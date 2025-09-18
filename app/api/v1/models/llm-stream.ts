import { streamText } from 'ai'

export async function getLLMStream({
  provider,
  model,
  instructions,
  content,
}: {
  provider: 'anthropic' | 'xai' | 'hf'
  model: string
  instructions: string
  content: string
}) {
  try {
    let result

    if (provider === 'anthropic') {
      const { createAnthropic } = await import('@ai-sdk/anthropic')
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      })

      result = await streamText({
        model: anthropic(model),
        system: instructions,
        prompt: content,
      })
    } else if (provider === 'xai') {
      const { xai } = await import('@ai-sdk/xai')

      try {
        result = await streamText({
          model: xai(model),
          system: instructions,
          prompt: content,
        })
      } catch (xaiError) {
        console.error('XAI streaming error:', xaiError)
        throw xaiError
      }
    } else if (provider === 'hf') {
      try {
        const endpoint = process.env.HF_ENDPOINT_URL as string
        if (!endpoint) {
          throw new Error('HuggingFace API endpoint not configured')
        }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `${instructions}\n\nUser: ${content}\nAssistant:`,
            parameters: {
              max_new_tokens: 2000,
              temperature: 0.7,
              return_full_text: false
            },
            options: {
              wait_for_model: true
            },
            stream: true
          })
        })

        if (!response.ok) {
          throw new Error(`HuggingFace API error: ${response.statusText}`)
        }

        // Pass through the actual streaming response from HuggingFace
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (hfError) {
        console.error('HuggingFace streaming error:', hfError)
        throw hfError
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    // Create the stream response but handle stream errors
    try {
      const streamResponse = result.toTextStreamResponse({
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })

      console.log('Stream response created successfully')
      return streamResponse
    } catch (streamError) {
      console.error('Error creating stream response:', streamError)
      throw streamError
    }
  } catch (error) {
    console.error('LLM Stream error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Extract more specific error information if available
    let displayError = `Error: ${errorMessage}`
    if (error && typeof error === 'object' && 'responseBody' in error) {
      try {
        const responseBody = JSON.parse(error.responseBody as string)
        if (responseBody.error) {
          displayError = `Error: ${responseBody.error}`
        }
      } catch {
        // If parsing fails, use the original message
      }
    }

    // Return a streaming error response to match the expected SSE format
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(displayError)}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}