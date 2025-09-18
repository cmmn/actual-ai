import { promptsKv } from './promptsKv'
import { Action, Target } from 'types'

export function generateSystemPrompt({
    action,
    target,
    length
  }: {
    action: Action
    target: Target
    length?: number
  }) {
    try {
      const prompt = promptsKv[action][target]

      if (typeof prompt === 'function' && length) {
        return prompt({ length })
      }

      return prompt
    } catch (error) {
      console.error('Error generating system prompt:', error)
      throw new Error(`
        Failed to generate system prompt for action: ${action}, target: ${target}
      `)
    }
  }
