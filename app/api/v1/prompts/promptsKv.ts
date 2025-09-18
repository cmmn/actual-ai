export const promptsKv = {
  'create': {
    'mcqs': generateMcqsPrompt,
    'deck': 'Create a new Deck'
  },
  'update': {
    'mcqs': 'Update an existing MCQ',
    'deck': 'Update an existing Deck'
  },
  'delete': {
    'mcqs': 'Delete an existing MCQ',
    'deck': 'Delete an existing Deck'
  }
}

export const titlePrompt = `Generate a title and description. Return ONLY a valid JSON object, without any surrounding text, markdown formatting, or code block indicators. The object should contain keys and values with this structure:

    {
      "title": string,
      "description": string,
    }

1. The JSON object must have exactly two keys: 'title' and 'description'.
2. The 'title' should be descriptive, eye-catching, and the title's length should be no more than 15 characters long.
3. The 'description' should be a brief summary of what a course about the 'title' would be and the description should be no longer than 50 characters in length.
4. The 'description' should be a complete sentence and should not contain any lists or bullet points.
5. Respond ONLY with the JSON object, nothing else.
6. Do not include 'JSONL:' or any other prefixes.
7. Ensure the JSON is valid and properly formatted.
8. Before answering, carefully reread the entire prompt.
9. Make sure to consider all information provided in the prompt.

DO NOT include any introductory text like Here is a JSON object for a course title a description or the word 'json'

IMPORTANT: The output must start with '{' and end with '}', containing only valid JSON. Do not include any explanatory text, headings, or formatting.`

export const chapterDescriptionPrompt = `Return EXACTLY ONE short sentence:
[Brief question]? [Quick answer]. [One key detail]

STRICT RULES:
1. MAXIMUM 250 CHARACTERS TOTAL
2. Must contain exactly ONE question, ONE answer, ONE detail
3. NO lists, NO multiple points, NO carriage returns
4. NO extra text or formatting
5. Avoid the word "need"  or words "need to" at the beginning of the description
6. NO key points, NO bullet points, NO lists

Valid examples:
"Need customer data? Have real conversations. Focus on past behaviors not future promises."
"Startup feedback unclear? Avoid generic praise. Ask for specific examples instead."

Invalid examples:
- Multiple points: "Talk to customers by: 1) Going to meetups 2) Getting intros..."
- Too long: "How do you find the right customers? Start with your network and..."
- Lists: "Three ways to improve: First... Second... Third..."
- Complex answers: "The solution involves multiple steps including..."
- Rhetorical questions: "What's the most important thing you learned from this chapter?"

Response starts with question, gives one answer, adds one detail.
NOTHING ELSE.`

const mcqInstructions = `
[
  {
    "question": string,
    "options": string[],
    "correctOptionIndex": number,
    "explanation": string
  }
]

CRITICAL REQUIREMENTS FOR QUESTIONS:
    1. Each question must be unique and directly related to the input text.
    2. The question should never repeat or be a variation of another question.
    3. The question should never reference the input, but assume the reader has knowledge of its content.
  
    CRITICAL REQUIREMENTS FOR OPTIONS:
    1. NEVER use these phrases or any variations:
       × "All of the above"
       × "All of these"
       × "None of the above"
       × "None of these"
       × "Both a and b"
       × "Both b and c"
       × "All of the following"
       × Any combination options
    
    2. Each option MUST BE:
       ✓ A specific, standalone answer
       ✓ Independent of other options
       ✓ Directly related to the question
       ✓ Complete without referencing other options

    3. The correctOptionIndex must always map to the correct option:
        ✓ Always triple check to make sure the correctOptionIndex is equal to the index of the correct option in the options array
  
    Rules:
    1. Each question must have EXACTLY 4 distinct, independent options
    2. Use specific content from the input text
    3. 'explanation' should justify why the correct answer is right
    4. Include various difficulty levels
    5. ANY use of forbidden option types will invalidate ALL questions
    IMPORTANT: The output must start with '[' and end with ']', containing only valid JSON. Do not include any explanatory text, headings, or formatting.`

export function generateMcqsPrompt({ length }: { length: number }) {
  return `Generate at least ${length} multiple-choice questions based on the input. Return ONLY a valid JSON array, without any surrounding text, markdown formatting, or code block indicators. The array should contain objects with this structure:
  ${mcqInstructions}
  `
}  

export function addMcqsPrompt({ length, existingMcqs }: { length: number, existingMcqs: string }) {
  return `Given an existing array of multiple choice questions, ${existingMcqs}, generate ${length} new multiple choice questions without repeating the existing questions. Return ONLY a valid JSON array, without any surrounding text, markdown formatting, or code block indicators. The array should contain objects with this structure:
  ${mcqInstructions}
  `
}

export const reprocessCombinationOptionPrompt = `Rewrite these multiple choice questions (MCQs) to avoid using "All of the above" or any combination options. Each option should be independent and specific.

Current MCQs have at least one invalid option, for example "all of the above", which answers the question by combining other options. Instead, for every MCQ, provide 4 distinct, standalone options that each represent a unique aspect of marketing strategy for farms.

Rules:
1. Keep the same general topic and difficulty level
2. Each option must be independent (not referencing other options)
3. Make the correct answer one of the specific options
4. Update the explanation to match the new correct answer
5. Return only a valid JSON array without any additional text

Return the rewritten MCQ maintaining this exact structure:
[
  {
    "question": string,
    "options": string[],
    "correctOptionIndex": number,
    "explanation": string
  }
]`

export const chapterTitlePrompt = `Generate a title for the chapter text provided. The title is located after the word "chapter" and its number, which could be a number, "1" or a word, "ONE." 

IMPORTANT:
Do not create a title based on the content of the text provided.
Your job is to extract the existing title which are the first few words after chapter and number.

Return ONLY a JSON object with the 'title' key's value as a string, without any surrounding text explaining what you are returning, markdown formatting, or code block indicators. The JSON object should contain a key and value with this structure:

{
  "title": string,
}

`

export const chaptersDataPrompt = `As the author of the input text I am authorizing you to parse the text into a JSON object including the chapterIndex, the chapter's title, the text of the chapter, the word count and the character count of the chapter text

IMPORTANT:
Skip the table of contents, preface, introduction, acknowledgements and conclusion.
Only return the JSON object without any words describing what you have done.

Return a JSON object with the chapterIndex as the key and the following structure as the value:
{
  chapterIndex: number;
  title: string;
  wordCount: number;
  characterCount: number;
}

The JSON object as returned should be structures like this:
{
  0: {
    chapterIndex: number;
    title: string;
    documentText: string;
    wordCount: number;
    characterCount: number;
  }
}
`

// import { gradeLevelsKv } from './gradeLevelsKv'
// import { passageLengthKv } from './passageLength'

// export function generateCompPassagePrompt({ level, previousPassages }: { level: number; previousPassages?: string[] }) {
//   const wordLengthStr = passageLengthKv[level]
//   return `Generate a reading passage of ${wordLengthStr} words for a reading comprehension question like those presented to students on standardized tests for students of the ${gradeLevelsKv[level]} reading level ${previousPassages ? `without repeating, duplicating, or close similarity to the stories provided: ${previousPassages?.join(', ')}` : ''}. Return ONLY a valid JSON object, without any surrounding text, markdown formatting, or code block indicators. The object should contain key and value with this structure:
//     { passage: string }

//     IMPORTANT:
//     1. The passage should be approximately ${wordLengthStr} words long.
//     2. The passage should be informative and engaging, suitable for a ${gradeLevelsKv[level]} level reader.
//     ${previousPassages ? `3. The passage should be unique and not similar to the stories provided: ${previousPassages?.join(', ')}` : ''}
//   `
// }