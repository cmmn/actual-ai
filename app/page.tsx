'use client'

import { YStack, XStack, Text, H1, Button, useMedia, Accordion, Square } from 'tamagui'
import { useState } from 'react'
import { Completion } from '../components/Completion'
import { Stream } from '../components/Stream'
import { Metrics } from '../components/Metrics'

type ModelKey = 'claude-sonnet' | 'grok' | 'hf'

interface MetricsData {
  cost: number | null
  timeToFirstToken: number | null
  totalTime: number | null
  tokenCount: number | null
}

interface UseCase {
  action: string
  target: string
  length: number
  content: string
}

interface ModelConfig {
  isHostedOnHF: boolean
  hourlyCost?: number // For HF-hosted models
}

// Use cases configuration
const useCases: Record<string, UseCase> = {
  'mcqs-multiplication-10': {
    action: 'create',
    target: 'mcqs',
    length: 10,
    content: 'multiplication tables 0-100'
  }
}

// Model configurations
const modelConfigs: Record<ModelKey, ModelConfig> = {
  'claude-sonnet': { isHostedOnHF: false },
  'grok': { isHostedOnHF: false },
  'hf': { isHostedOnHF: true, hourlyCost: 5 }
}

export default function Home() {
  const media = useMedia()
  const [responses, setResponses] = useState<Record<ModelKey, string>>({
    'claude-sonnet': '',
    'grok': '',
    'hf': ''
  })
  const [streaming, setStreaming] = useState<Record<ModelKey, boolean>>({
    'claude-sonnet': false,
    'grok': false,
    'hf': false
  })
  const [errors, setErrors] = useState<Record<ModelKey, string | null>>({
    'claude-sonnet': null,
    'grok': null,
    'hf': null
  })
  const [metrics, setMetrics] = useState<Record<ModelKey, MetricsData>>({
    'claude-sonnet': { cost: null, timeToFirstToken: null, totalTime: null, tokenCount: null },
    'grok': { cost: null, timeToFirstToken: null, totalTime: null, tokenCount: null },
    'hf': { cost: null, timeToFirstToken: null, totalTime: null, tokenCount: null }
  })
  const [currentUseCase, setCurrentUseCase] = useState<string>('mcqs-multiplication-10')


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
      const useCase = useCases[currentUseCase]
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: useCase.action,
          target: useCase.target,
          length: useCase.length,
          content: useCase.content,
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
    const costPer1KTokens = {
      'claude-sonnet': 0.003, // Claude 3.5 Sonnet
      'grok': 0.0015,         // Grok (estimated)
      'hf': 0.0001            // HuggingFace (very low cost)
    }

    return (tokens / 1000) * costPer1KTokens[model]
  }

  return (
    <>
      <YStack
        theme='blue'
        mt={20}
        br={20}
        mx='auto'
        width={media.gtXs ? 1400 : '100%'}
        padding="$10"
        gap={'$5'}
        backgroundColor="$background"
        jc='center'
        ai='center'
        ac='center'
      >
        <H1 color="$color">
          Hello, welcome to actual api!
        </H1>

        <Text color="$color" textAlign="center" mb="$4">
          Click any button to test streaming AI responses. Each model streams independently.
        </Text>

        {/* Model Buttons and Responses */}
        <XStack gap="$6" flexWrap="wrap" jc="center" w="100%" maxWidth={1400}>
          {/* Claude Sonnet */}
          <YStack flex={1} w={400} ai="center">
            <Button
              w={200}
              disabled={streaming['claude-sonnet']}
              onPress={() => handleStreamRequest('claude-sonnet')}
              theme={streaming['claude-sonnet'] ? 'active' : undefined}
              mb="$3"
            >
              {streaming['claude-sonnet'] ? 'Streaming...' : 'Claude Sonnet'}
            </Button>

            {/* Show metrics only after request completes */}
            {!streaming['claude-sonnet'] && (responses['claude-sonnet'] || errors['claude-sonnet']) && (
              <Metrics
                metrics={metrics['claude-sonnet']}
                model="claude-sonnet"
                isHostedOnHF={modelConfigs['claude-sonnet'].isHostedOnHF}
                hourlyCost={modelConfigs['claude-sonnet'].hourlyCost}
              />
            )}

            {errors['claude-sonnet'] ? (
              <Text color="$red10">{errors['claude-sonnet']}</Text>
            ) : streaming['claude-sonnet'] ? (
              <Stream response={responses['claude-sonnet']} />
            ) : responses['claude-sonnet'] ? (
              <Completion response={responses['claude-sonnet']} />
            ) : null}
          </YStack>

          {/* Grok */}
          <YStack flex={1} w={400} ai="center">
            <Button
              w={200}
              disabled={streaming['grok']}
              onPress={() => handleStreamRequest('grok')}
              theme={streaming['grok'] ? 'active' : undefined}
              mb="$3"
            >
              {streaming['grok'] ? 'Streaming...' : 'Grok'}
            </Button>

            {/* Show metrics only after request completes */}
            {!streaming['grok'] && (responses['grok'] || errors['grok']) && (
              <Metrics
                metrics={metrics['grok']}
                model="grok"
                isHostedOnHF={modelConfigs['grok'].isHostedOnHF}
                hourlyCost={modelConfigs['grok'].hourlyCost}
              />
            )}

            {errors['grok'] ? (
              <Text color="$red10">{errors['grok']}</Text>
            ) : streaming['grok'] ? (
              <Stream response={responses['grok']} />
            ) : responses['grok'] ? (
              <Completion response={responses['grok']} />
            ) : null}
          </YStack>

          {/* HuggingFace */}
          <YStack flex={1} w={400} ai="center">
            <Button
              w={200}
              disabled={streaming['hf']}
              onPress={() => handleStreamRequest('hf')}
              theme={streaming['hf'] ? 'active' : undefined}
              mb="$3"
            >
              {streaming['hf'] ? 'Streaming...' : 'HuggingFace'}
            </Button>

            {/* Show metrics only after request completes */}
            {!streaming['hf'] && (responses['hf'] || errors['hf']) && (
              <Metrics
                metrics={metrics['hf']}
                model="hf"
                isHostedOnHF={modelConfigs['hf'].isHostedOnHF}
                hourlyCost={modelConfigs['hf'].hourlyCost}
              />
            )}

            {errors['hf'] ? (
              <Text color="$red10">{errors['hf']}</Text>
            ) : streaming['hf'] ? (
              <Stream response={responses['hf']} />
            ) : responses['hf'] ? (
              <Completion response={responses['hf']} />
            ) : null}
          </YStack>
        </XStack>
      </YStack>
    </>
  )
}

/* original code
<div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div> 
*/