# Cashew

Set rules and policies around corporate spending.

## Getting Started

First, create `.env` at the root of the project then add your gemini API key like so:

```env
GEMINI_API_KEY="YOURAPIKEYHERE"
```

You can get a free key from [Google AI Studio](https://aistudio.google.com/).

Second, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## What is this

This is a small demo for a policy based spend tracking using Gemini 3.6 Flash. You can define a set of rules using normal text and transaction violations are automatically flagged based on the rules defined within a spreadsheet (preferably in a CSV format). The demo has been created using Next.js 16 and React 19.
