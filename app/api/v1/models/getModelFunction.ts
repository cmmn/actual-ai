import { Model } from 'types'
import { getLLMStream } from './llm-stream'

// Model configuration mapping
const modelMap = {
  'claude-sonnet': {
    provider: 'anthropic' as const,
    model: 'claude-3-5-sonnet-20241022'
  },
  'grok': {
    provider: 'xai' as const,
    model: 'grok-4'
  },
  'hf': {
    provider: 'hf' as const,
    model: 'custom'
  },
} as const

export async function getModelFunction({
  model,
  instructions,
  content
}: {
  model: Model
  instructions: string
  content: string
}) {
  // Get model configuration
  const config = modelMap[model]
  if (!config) {
    throw new Error(`Unknown model: ${model}`)
  }

  // Return function that creates the streaming response
  return () => getLLMStream({
    provider: config.provider,
    model: config.model,
    instructions,
    content,
  })
}