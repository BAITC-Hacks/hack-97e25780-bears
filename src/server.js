import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import { createApp } from './backend-app.js';
import { demoSeed } from './seed.js';
import { FrontendAiService } from './services/frontend-ai-service.js';
import { GeminiCardService } from './services/gemini-card-service.js';
import { QuestionService } from './services/question-service.js';
import { MemoryStore } from './storage/memory-store.js';

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const port = positiveInteger(process.env.PORT, 3000);
const timeoutMs = positiveInteger(process.env.OPENAI_TIMEOUT_MS, 10_000);
const apiKey = process.env.OPENAI_API_KEY?.trim();
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const client = apiKey ? new OpenAI({ apiKey, maxRetries: 0 }) : null;

export const app = createApp({
  store: new MemoryStore(demoSeed),
  questionService: new QuestionService({
    client,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs,
  }),
  cardOptimizationService: new GeminiCardService({
    apiKey: geminiApiKey,
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    timeoutMs: positiveInteger(process.env.GEMINI_TIMEOUT_MS, 10_000),
  }),
  frontendAiService: new FrontendAiService({
    apiKey: geminiApiKey,
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    timeoutMs: positiveInteger(process.env.GEMINI_TIMEOUT_MS, 10_000),
  }),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  aiConfigured: Boolean(client || geminiApiKey),
  aiProviders: { openai: Boolean(client), gemini: Boolean(geminiApiKey) },
});

export { port };

// Importing the configured API into the shared UI server must not open a second port.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`Challenge Hub API is running at http://localhost:${port}`);
  });
}
