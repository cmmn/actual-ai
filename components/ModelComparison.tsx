'use client'

import { YStack, XStack, Text, H2, Button } from 'tamagui'
import { useState } from 'react'
import { Completion } from './Completion'
import { Stream } from './Stream'
import { Metrics } from './Metrics'
import { ModelKey, MetricsData, UseCaseContent } from 'types'
import { modelConfigs } from 'lib'

export function ModelComparison({
  selectedModels,
  useCaseContent
}: {
  selectedModels: ModelKey[]
  useCaseContent: UseCaseContent | null
}) {
  const allModelKeys = Object.keys(modelConfigs) as ModelKey[]
  const [responses, setResponses] = useState<Record<ModelKey, string>>(
    Object.fromEntries(allModelKeys.map(key => [key, ''])) as Record<ModelKey, string>
  )
  const [streaming, setStreaming] = useState<Record<ModelKey, boolean>>(
    Object.fromEntries(allModelKeys.map(key => [key, false])) as Record<ModelKey, boolean>
  )
  const [errors, setErrors] = useState<Record<ModelKey, string | null>>(
    Object.fromEntries(allModelKeys.map(key => [key, null])) as Record<ModelKey, string | null>
  )
  const [metrics, setMetrics] = useState<Record<ModelKey, MetricsData>>(
    Object.fromEntries(allModelKeys.map(key => [key, { cost: null, timeToFirstToken: null, totalTime: null, tokenCount: null }])) as Record<ModelKey, MetricsData>
  )


  // Function to start all selected models simultaneously
  const handleBeginAll = async () => {
    console.log('handleBeginAll called, useCaseContent:',
  useCaseContent)
    // Ensure use case content is loaded
    if (!useCaseContent) {
      return
    }

    // Start all models in parallel
    const requests = selectedModels.map(model => handleStreamRequest(model))
    await Promise.allSettled(requests)
  }
  
  // Track if any model is currently streaming
  const anyStreaming = selectedModels.some(model => streaming[model])
  // const allCompleted = selectedModels.every(model => responses[model] || errors[model])


  function handleDirtyStreamRequest(model: ModelKey, dirtyResponse: string, startTime: number, firstTokenTime: number | null, tokenCount: number) {
    console.log(`[${model}] Processing dirty response`)

    // Find the first '[' and last ']' to extract just the array
    const firstBracket = dirtyResponse.indexOf('[')
    const lastBracket = dirtyResponse.lastIndexOf(']')

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      // Extract just the array part
      let cleanedResponse = dirtyResponse.substring(firstBracket, lastBracket + 1)

      // Remove any remaining special tokens
      cleanedResponse = cleanedResponse.replace(/<\/s>/g, '')
                                      .replace(/<\|endoftext\|>/g, '')
                                      .trim()

      console.log(`[${model}] Cleaned dirty response:`, cleanedResponse.substring(0, 200) + '...')

      // Test if it's valid JSON
      try {
        JSON.parse(cleanedResponse)
        console.log(`[${model}] Cleaned JSON is valid!`)
        setResponses(prev => ({ ...prev, [model]: cleanedResponse }))
      } catch (e) {
        console.log(`[${model}] Cleaned JSON still invalid:`, e)
        console.log(`[${model}] Last 50 characters:`, cleanedResponse.slice(-50))
        setResponses(prev => ({ ...prev, [model]: cleanedResponse }))
      }
    } else {
      console.log(`[${model}] Could not find valid array boundaries`)
      setResponses(prev => ({ ...prev, [model]: dirtyResponse }))
    }

    // Update metrics for dirty response
    const totalTime = Date.now() - startTime
    const estimatedCost = calculateCost(model, tokenCount)

    setMetrics(prev => ({
      ...prev,
      [model]: {
        cost: estimatedCost,
        timeToFirstToken: firstTokenTime,
        totalTime: totalTime,
        tokenCount: tokenCount
      }
    }))

    setStreaming(prev => ({ ...prev, [model]: false }))
  }

  async function handleStreamRequest(model: ModelKey) {
    console.log('handleStreamRequest called for model:', model)
    // Reset the response for this model
    setResponses(prev => ({ ...prev, [model]: '' }))
    setErrors(prev => ({ ...prev, [model]: null }))
    setStreaming(prev => ({ ...prev, [model]: true }))

    // Initialize metrics tracking
    const startTime = Date.now()
    let firstTokenTime: number | null = null
    let tokenCount = 0

    setMetrics(prev => ({
      ...prev,
      [model]: { cost: null, timeToFirstToken: null, totalTime: null, tokenCount: null }
    }))

    try {
      
      if (!useCaseContent) {
        throw new Error('Failed to load use case content')
      }

      console.log('About to make fetch request to /api/v1 for model:', model)
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: useCaseContent.instructions,
          content: useCaseContent.content,
          model: model
        }),
      })

      if (!res.ok) {
        // Try to read the error response
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `HTTP error! status: ${res.status}`)
        } catch {
          throw new Error(errorText || `HTTP error! status: ${res.status}`)
        }
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            // Track first token time (before any processing)
            if (firstTokenTime === null && data !== '[DONE]') {
              firstTokenTime = Date.now() - startTime
              console.log(`[${model}] First token received at ${firstTokenTime}ms`)
            }

            if (data === '[DONE]') {
              setStreaming(prev => ({ ...prev, [model]: false }))
              return
            }

            try {
              const parsed = JSON.parse(data)

              if (typeof parsed === 'string') {
                // Check if it's an error message
                if (parsed.startsWith('Error:')) {
                  setErrors(prev => ({ ...prev, [model]: parsed }))
                  setStreaming(prev => ({ ...prev, [model]: false }))
                  return
                }
                setResponses(prev => ({ ...prev, [model]: prev[model] + parsed }))
                tokenCount++
              } else if (parsed.generated_text) {
                // Handle final HuggingFace response with complete text
                console.log(`[${model}] Final generated_text received:`, parsed.generated_text.substring(0, 200) + '...')

                // Check if response is clean (starts with '[') or dirty (has extra text)
                const trimmedResponse = parsed.generated_text.trim()
                if (trimmedResponse.startsWith('[')) {
                  console.log(`[${model}] Clean response detected`)

                  // Update metrics for clean response
                  const totalTime = Date.now() - startTime
                  const estimatedCost = calculateCost(model, tokenCount)

                  setMetrics(prev => ({
                    ...prev,
                    [model]: {
                      cost: estimatedCost,
                      timeToFirstToken: firstTokenTime,
                      totalTime: totalTime,
                      tokenCount: tokenCount
                    }
                  }))

                  setResponses(prev => ({ ...prev, [model]: trimmedResponse }))
                  setStreaming(prev => ({ ...prev, [model]: false }))
                  return
                } else {
                  console.log(`[${model}] Dirty response detected, routing to cleanup handler`)
                  handleDirtyStreamRequest(model, parsed.generated_text, startTime, firstTokenTime, tokenCount)
                  return
                }
              } else if (parsed.token && parsed.token.text) {
                // Handle HuggingFace token format - accumulate token text
                setResponses(prev => ({ ...prev, [model]: prev[model] + parsed.token.text }))
                tokenCount++
              }
            } catch {
              // If it's not JSON, treat as plain text
              if (data.startsWith('Error:')) {
                setErrors(prev => ({ ...prev, [model]: data }))
                setStreaming(prev => ({ ...prev, [model]: false }))
                return
              }
              setResponses(prev => ({ ...prev, [model]: prev[model] + data }))
            }
          } else if (line.trim()) {
            // Track first token time for plain text
            if (firstTokenTime === null) {
              firstTokenTime = Date.now() - startTime
              console.log(`[${model}] First token received at ${firstTokenTime}ms`)
            }

            // Handle plain text chunks (AI SDK format)
            console.log(`[${model}] Plain text:`, line)
            // Check if it's an error message
            if (line.startsWith('Error:')) {
              setErrors(prev => ({ ...prev, [model]: line }))
              setStreaming(prev => ({ ...prev, [model]: false }))
              return
            }
            setResponses(prev => ({ ...prev, [model]: prev[model] + line }))
            tokenCount += line.length // Rough token estimation for plain text
          }
        }
      }

      // Handle the final buffer content if any
      if (buffer.trim()) {
        // Check if the final buffer contains an error
        if (buffer.trim().startsWith('Error:')) {
          setErrors(prev => ({ ...prev, [model]: buffer.trim() }))
        } else {
          setResponses(prev => ({ ...prev, [model]: prev[model] + buffer }))
        }
      }

      // If we have no response and no error, it might be a silent failure
      setResponses(prev => {
        if (!prev[model] && !errors[model]) {
          setErrors(prevErrors => ({ ...prevErrors, [model]: 'No response received - possible rate limit or API error' }))
        }
        return prev
      })

      // Update final metrics
      const totalTime = Date.now() - startTime
      const estimatedCost = calculateCost(model, tokenCount)

      setMetrics(prev => ({
        ...prev,
        [model]: {
          cost: estimatedCost,
          timeToFirstToken: firstTokenTime,
          totalTime: totalTime,
          tokenCount: tokenCount
        }
      }))

      setStreaming(prev => ({ ...prev, [model]: false }))
    } catch (error) {
      // Update metrics even on error
      const totalTime = Date.now() - startTime
      const estimatedCost = calculateCost(model, tokenCount)

      setMetrics(prev => ({
        ...prev,
        [model]: {
          cost: estimatedCost,
          timeToFirstToken: firstTokenTime,
          totalTime: totalTime,
          tokenCount: tokenCount
        }
      }))

      setErrors(prev => ({ ...prev, [model]: error instanceof Error ? error.message : 'Unknown error' }))
      setStreaming(prev => ({ ...prev, [model]: false }))
    }
  }

  function calculateCost(model: ModelKey, tokens: number): number {
    // Rough cost estimates per 1K tokens (input + output combined)
    const costPer1KTokens: Record<ModelKey, number> = {
      'claude-sonnet-4': 0.009,                // Claude Sonnet 4 ($3/1M input, $15/1M output - averaged)
      'claude-3-5-haiku': 0.0004,              // Claude 3.5 Haiku ($0.25/1M input, $1.25/1M output - averaged)
      'grok-2': 0.0015,                         // Grok 2 (estimated)
      'grok-3': 0.002,                          // Grok 3 (estimated higher)
      'grok-4': 0.003,                          // Grok 4 (estimated premium)
      'mixtral-8x7b-instruct-v0-1': 0.0001,     // Mixtral 8x7B (very low cost)
      'gpt-4o': 0.00375,                        // GPT-4o ($2.50/1M input, $5/1M output - averaged)
      'gpt-4o-mini': 0.0003,                    // GPT-4o Mini ($0.15/1M input, $0.60/1M output - averaged)
      'gpt-4-turbo': 0.020,                     // GPT-4 Turbo ($10/1M input, $30/1M output - averaged)
      'gpt-5': 0.005625,                        // GPT-5 ($1.25/1M input, $10/1M output - averaged)
      'gpt-5-mini': 0.000125,                   // GPT-5 Mini ($0.25/1M input, $2/1M output - averaged)
      'gpt-5-nano': 0.0000225                   // GPT-5 Nano ($0.05/1M input, $0.40/1M output - averaged)
    }

    return (tokens / 1000) * costPer1KTokens[model]
  }

  return (
    <YStack
      gap="$5"
      px="$6"
    >
      <YStack gap="$3" ai="center">       

        {/* Title row - Centered */}
        <YStack ai="center" gap="$2">
          <H2 color="$color" textAlign="center">
            Click and Compare
          </H2>
          <Text color="$color" textAlign="center" mb="$4">
            Cost, performance, and quality of AI models
          </Text>
        </YStack>

        {/* BEGIN button row - centered and larger */}
        <XStack width="100%" ai="center" jc="center">
          <Button
            w={350}
            theme="active"
            onPress={handleBeginAll}
            disabled={anyStreaming}
            fontWeight="700"
            minWidth={180}
            paddingHorizontal="$6"
          >
            {anyStreaming ? 'RUNNING...' : 'BEGIN'}
          </Button>
        </XStack>
      </YStack>

      {/* Model Buttons and Responses */}
      <XStack gap="$4" flexWrap="wrap" jc="center" w="100%" maxWidth={1400}>
        {selectedModels.map((modelKey) => {
          const config = modelConfigs[modelKey]
          if (!config) {
            console.error(`Model config not found for: ${modelKey}`)
            return null
          }
          const modelWidth = 1400 / selectedModels.length - 16 // Responsive width based on number of displayed models

          return (
            <YStack key={modelKey} flex={1} w={modelWidth} ai="center">
              <Button
                w={Math.min(200, modelWidth - 20)}
                disabled={streaming[modelKey]}
                onPress={() => handleStreamRequest(modelKey)}
                theme={streaming[modelKey] ? 'active' : undefined}
                mb="$3"
              >
                {streaming[modelKey] ? 'Streaming...' : config.displayName}
              </Button>

              {/* Show metrics only after request completes */}
              {!streaming[modelKey] && (responses[modelKey] || errors[modelKey]) && (
                <Metrics
                  metrics={metrics[modelKey]}
                  model={modelKey}
                  isHostedOnHF={config.isHostedOnHF}
                  hourlyCost={config.hourlyCost}
                />
              )}

              {errors[modelKey] ? (
                <Text color="$red10">{errors[modelKey]}</Text>
              ) : streaming[modelKey] ? (
                <Stream response={responses[modelKey]} />
              ) : responses[modelKey] ? (
                <Completion response={responses[modelKey]} />
              ) : null}
            </YStack>
          )
        })}
      </XStack>
    </YStack>
  )
}