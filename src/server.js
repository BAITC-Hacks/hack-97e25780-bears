import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));

const openAiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const systemPrompt = `You are an expert mentor for educational and business gamification. Your task is to generate practical student tasks based on a business problem. Return concise, useful recommendations in JSON format with fields: summary, recommendations. Each recommendation must have title, difficulty, description, and why_it_matches.`;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hack-97e25780-bears',
    branch: 'feature/member-2-backend',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/recommend-tasks', async (req, res) => {
  const { businessProblem, audience = 'students', taskCount = 3, context = '' } = req.body || {};

  if (!businessProblem || typeof businessProblem !== 'string' || !businessProblem.trim()) {
    return res.status(400).json({
      error: 'businessProblem is required and must be a non-empty string.',
    });
  }

  if (!openAiClient) {
    return res.status(503).json({
      error: 'OpenAI API key is missing. Add OPENAI_API_KEY to your .env file.',
    });
  }

  try {
    const userPrompt = `
      Business problem: ${businessProblem}
      Audience: ${audience}
      Task count: ${taskCount}
      Context: ${context}

      Generate a short task recommendation list for students. Focus on practical tasks that mimic real work and are easy to evaluate.
      Return valid JSON only, with this shape:
      {
        "summary": "string",
        "recommendations": [
          {
            "title": "string",
            "difficulty": "easy|medium|hard",
            "description": "string",
            "why_it_matches": "string"
          }
        ]
      }
    `;

    const completion = await openAiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return res.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to generate task recommendations.',
      details: message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export { app };
