import { BodyContent } from 'types'
import { getModelFunction } from './models'
import { generateSystemPrompt } from './prompts'

export async function processRequest({
  body
} : {
  body: BodyContent
}) {
  try {
    // Extract and validate required parameters
    const { instructions, content, model, action, target, length } = body

    // Validate required parameters
    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: model' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!instructions || !content) {
      return new Response(
        JSON.stringify({ error: 'At least one of instructions or content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }


    console.log('Request received:', {
      model,
      contentLength: content?.length || 0,
      instructionsLength: instructions?.length || 0,
      hasLegacyParams: !!(action && target)
    })

    // Use provided instructions or fallback to generated system prompt
    let systemInstructions: string
    if (instructions) {
      systemInstructions = instructions
    } else {
      // For legacy format, action and target are required
      if (!action || !target) {
        return new Response(
          JSON.stringify({ error: 'When using legacy format without instructions, action and target are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      systemInstructions = await generateSystemPrompt({ action, target, length }) as string
    }

    // Ensure we have content to process
    const processContent = content || ''

    // every model takes the same input,
    // but often in a different format
    // so we need the correct function to call based on the model
    const streamFunction = await getModelFunction({
      model,
      content: processContent,
      instructions: systemInstructions
    })

    // Call the function and return the streaming Response directly
    return await streamFunction()
  } catch (error) {
    console.error('Error processing request:', error)
    // Return error response
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}