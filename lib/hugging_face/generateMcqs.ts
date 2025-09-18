// import { deduplicate } from './deduplicate'
// import { addMcqs } from './addMcqs'
// import { Mcq } from 'types'
// import { generateMcqsPrompt } from 'lib'

// export async function generateMCQs(shortPrompt: string): Promise<Mcq[]> {
//   const API_URL = 'https://your-endpoint...hf.cloud';
//   const HF_TOKEN = 'YOUR_HF_TOKEN';
//   const instructions = generateMcqsPrompt({ length: 10 })
//   const response = await fetch(API_URL, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${HF_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       inputs: {
//         messages: [
//           { role: 'system', content: shortPrompt },
//           { role: 'user', content: instructions }
//         ]
//       },
//       parameters: { max_new_tokens: 4096, temperature: 0.7 },
//     }),
//   });
//   const data = await response.json();
//   const mcqs = data.generated_text;
//   const unique = deduplicate(mcqs);
//   if (unique.length < 10) {
//     const missing = 10 - unique.length;
//     const addResponse = await addMcqs(missing, unique)
//     unique.push(...addResponse);
//   }
//   return unique;
// }