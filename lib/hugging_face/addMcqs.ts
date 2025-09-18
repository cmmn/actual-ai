export async function addMcqs(length: number, existingMcqs: any[]): Promise {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: { messages: [{ role: "user", content: addMcqsPrompt({length, existingMcqs: JSON.stringify(existingMcqs)}) }] },
      parameters: { max_new_tokens: length * 300, temperature: 0.7 },
    }),
  });
  return (await response.json()).generated_text;
}