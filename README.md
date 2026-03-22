# Madam Sam - AI Birth Card Customization

An AI-powered web application that allows clients to personalize birth card designs through natural language prompts, while preserving the original artistic design.

## Tech Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Image Editing**: FLUX.1 Kontext Pro (via Replicate)
- **Prompt Safety**: Claude API (Anthropic)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` with your API keys:
- `REPLICATE_API_TOKEN` - Get from [replicate.com](https://replicate.com)
- `ANTHROPIC_API_KEY` - Get from [console.anthropic.com](https://console.anthropic.com)

### 3. Add card templates

Place card images (PNG/JPG) in `server/cards/` and update `server/cards/metadata.json`.

### 4. Run development servers

In two terminal windows:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

## How It Works

1. User browses the card gallery and selects a template
2. User types a modification request (e.g., "change the name to Emma")
3. Backend sends the prompt to Claude API for sanitization/guardrails
4. Sanitized prompt + card image are sent to FLUX.1 Kontext Pro on Replicate
5. Edited image is returned and displayed alongside the original

## Costs

- ~$0.04 per edit (FLUX.1 Kontext Pro)
- ~$0.001 per edit (Claude prompt sanitization)
- ~$0.20 per typical session (5 edits)
