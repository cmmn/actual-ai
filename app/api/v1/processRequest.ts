import { BodyContent } from 'types'
import { getModelFunction } from './models'
import { generateSystemPrompt } from './prompts'

export async function processRequest({
  body
} : {
  body: BodyContent
}) {
  try {
    // content is the query/subject we will provide to the model
    const { action, target, content, model, length } = body

    console.log('Request received:', { action, target, model, content, length })

    // and, we need to get the correct system prompt (instructions) based on the action and target
    const instructions = await generateSystemPrompt({ action, target, length }) as string

    // every model takes the same input,
    // but often in a different format
    // so we need the correct function to call based on the model
    const streamFunction = await getModelFunction({ model, content, instructions })

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