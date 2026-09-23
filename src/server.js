import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import OpenAI from 'openai';
import { createApp } from './backend-app.js';
import { appDemoSeed } from './profile-seed.js';
import { FrontendAiService } from './services/frontend-ai-service.js';
import { GeminiCardService } from './services/gemini-card-service.js';
import { QuestionService } from './services/question-service.js';
import { MemoryStore } from './storage/memory-store.js';
import { FileStore } from './storage/file-store.js';

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const port = positiveInteger(process.env.PORT, 3000);
const timeoutMs = positiveInteger(process.env.OPENAI_TIMEOUT_MS, 10_000);
const apiKey = process.env.OPENAI_API_KEY?.trim();
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const client = apiKey ? new OpenAI({ apiKey, maxRetries: 0 }) : null;
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const store = process.env.DATA_FILE === ':memory:'
  ? new MemoryStore(appDemoSeed)
  : new FileStore(resolve(projectRoot, process.env.DATA_FILE || 'data/runtime/startcard.json'), appDemoSeed);

export const app = createApp({
  store,
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
