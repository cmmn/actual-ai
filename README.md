## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Add the ENV variables for your LLM models

1. Create an .env and ensure it is ignored by git
2. Add you keys for ANTHROPIC_API_KEY, XAI_API_KEY, OPENAI_API_KEY
3. If you want to test open source (free models) configured on Hugging Face: add HF_API_KEY and HF_ENDPOINT_URL

## Edit Use Cases (optional)

If you'd like to test your own use case (recommended), you can add it to 
