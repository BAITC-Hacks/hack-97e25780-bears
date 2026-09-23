import express from 'express';
import { isValidContact } from './domain/rating.js';
import { demoSeed } from './seed.js';
import { FrontendAiService } from './services/frontend-ai-service.js';
import { GeminiCardService } from './services/gemini-card-service.js';
import { QUESTION_TARGET_FIELDS, QuestionService } from './services/question-service.js';
import { MemoryStore } from './storage/memory-store.js';
import { createUiRouter } from './routes/ui-router.js';

const EDITABLE_TASK_FIELDS = [
  'title',
  'industry',
  'draftText',
  'context',
  'need',
  'users',
  'data',
  'constraints',
  'expectedResult',
  'successCriteria',
  'contact',
  'interactionFormat',
];

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function requireObject(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${name} must be an object.`);
  }
  return value;
}

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${name} is required and must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value, name) {
  if (value === undefined) return '';
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', `${name} must be a string.`);
  }
  return value.trim();
}

function findTask(store, id) {
  const task = store.getTask(id);
  if (!task) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task was not found.');
  return task;
}

function validateTaskPatch(body) {
  requireObject(body);
  const entries = Object.entries(body);
  if (!entries.length) throw new HttpError(400, 'VALIDATION_ERROR', 'At least one field is required.');

  const invalidFields = entries.map(([key]) => key).filter((key) => !EDITABLE_TASK_FIELDS.includes(key));
  if (invalidFields.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some task fields are not editable.', { invalidFields });
  }

  return Object.fromEntries(entries.map(([key, value]) => [key, optionalString(value, key)]));
}

function publicationErrors(task) {
  const missing = [];
  if (!task.title.trim()) missing.push('title');
  if (!task.context.trim() && !task.need.trim()) missing.push('contextOrNeed');
  if (!isValidContact(task.contact)) missing.push('contact');
  return missing;
}

function parseKnownFields(value) {
  if (value === undefined) return {};
  const knownFields = requireObject(value, 'knownFields');
  const invalidFields = Object.keys(knownFields).filter((key) => !QUESTION_TARGET_FIELDS.includes(key));
  if (invalidFields.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'knownFields contains unsupported fields.', {
      invalidFields,
    });
  }
  return Object.fromEntries(
    Object.entries(knownFields).map(([key, fieldValue]) => [key, optionalString(fieldValue, `knownFields.${key}`)]),
  );
}

function parseAnswers(value) {
  if (!Array.isArray(value) || !value.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'answers must be a non-empty array.');
  }

  return value.reduce((patch, answer, index) => {
    requireObject(answer, `answers[${index}]`);
    if (!QUESTION_TARGET_FIELDS.includes(answer.targetField)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `answers[${index}].targetField is unsupported.`);
    }
    patch[answer.targetField] = optionalString(answer.value, `answers[${index}].value`);
    return patch;
  }, {});
}

function parseProposal(body) {
  requireObject(body);
  const prototypeUrl = optionalString(body.prototypeUrl, 'prototypeUrl');
  if (prototypeUrl) {
    try {
      const url = new URL(prototypeUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      throw new HttpError(400, 'VALIDATION_ERROR', 'prototypeUrl must be a valid HTTP(S) URL.');
    }
  }

  return {
    teamId: requireNonEmptyString(body.teamId, 'teamId'),
    solutionIdea: requireNonEmptyString(body.solutionIdea, 'solutionIdea'),
    plan: requireNonEmptyString(body.plan, 'plan'),
    duration: requireNonEmptyString(body.duration, 'duration'),
    prototypeUrl,
  };
}

export function createApp({
  store = new MemoryStore(demoSeed),
  questionService = new QuestionService(),
  cardOptimizationService = new GeminiCardService(),
  frontendAiService = new FrontendAiService(),
  corsOrigin = '*',
  aiConfigured = false,
  aiProviders = { openai: aiConfigured, gemini: false },
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/ui', createUiRouter({ store }));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'hack-97e25780-bears',
      storage: 'memory',
      aiConfigured,
      aiProviders,
      timestamp: new Date().toISOString(),
    });
  });

  app.post(
    '/api/ai/clarify-task',
    asyncRoute(async (req, res) => {
      const body = requireObject(req.body);
      const draft = requireNonEmptyString(body.draft, 'draft');
      if (draft.length < 5) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'draft must contain at least 5 characters.');
      }
      const result = await frontendAiService.clarify({
        draft,
        companyName: optionalString(body.companyName, 'companyName'),
      });
      res.json({ success: true, ...result });
    }),
  );

  app.post(
    '/api/ai/build-card',
    asyncRoute(async (req, res) => {
      const body = requireObject(req.body);
      const draft = requireNonEmptyString(body.draft, 'draft');
      const answers = body.answers === undefined ? {} : requireObject(body.answers, 'answers');
      const normalizedAnswers = Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [key, optionalString(value, `answers.${key}`)]),
      );
      const result = await frontendAiService.buildCard({
        draft,
        answers: normalizedAnswers,
        companyName: optionalString(body.companyName, 'companyName'),
      });
      res.json({ success: true, ...result });
    }),
  );

  app.post(
    '/api/ai/optimize-task',
    asyncRoute(async (req, res) => {
      const body = requireObject(req.body);
      const input = {
        roughDescription: requireNonEmptyString(body.roughDescription, 'roughDescription'),
        companyName: optionalString(body.companyName, 'companyName'),
        category: optionalString(body.category, 'category'),
        targetLevel: optionalString(body.targetLevel, 'targetLevel'),
        budgetSuggestion: optionalString(body.budgetSuggestion, 'budgetSuggestion'),
      };
      const result = await cardOptimizationService.optimize(input);
      res.json({ success: true, ...result });
    }),
  );

  app.post(
    '/api/clarifications',
    asyncRoute(async (req, res) => {
      const body = requireObject(req.body);
      const draftText = requireNonEmptyString(body.draftText, 'draftText');
      const knownFields = parseKnownFields(body.knownFields);
      const result = await questionService.generate({ draftText, knownFields });
      res.json(result);
    }),
  );

  app.post('/api/tasks', (req, res) => {
    const body = requireObject(req.body);
    const draftText = requireNonEmptyString(body.draftText, 'draftText');
    const patch = validateTaskPatch({ ...body, draftText });
    const task = store.createTask(patch);
    res.status(201).json({ task });
  });

  app.get('/api/tasks', (req, res) => {
    const items = store.listCatalog();
    res.json({ items, total: items.length });
  });

  app.get('/api/tasks/:taskId', (req, res) => {
    res.json({ task: findTask(store, req.params.taskId) });
  });

  app.post(
    '/api/tasks/:taskId/clarifications',
    asyncRoute(async (req, res) => {
      const task = findTask(store, req.params.taskId);
      const knownFields = Object.fromEntries(
        QUESTION_TARGET_FIELDS.map((field) => [field, task[field] || '']),
      );
      const result = await questionService.generate({ draftText: task.draftText, knownFields });
      res.json(result);
    }),
  );

  app.post('/api/tasks/:taskId/answers', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (!['draft', 'confirmed'].includes(task.status)) {
      throw new HttpError(409, 'TASK_NOT_EDITABLE', 'Only draft or confirmed tasks can be edited.');
    }
    const body = requireObject(req.body);
    const patch = parseAnswers(body.answers);
    res.json({ task: store.updateTask(task.id, patch) });
  });

  app.patch('/api/tasks/:taskId', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (!['draft', 'confirmed'].includes(task.status)) {
      throw new HttpError(409, 'TASK_NOT_EDITABLE', 'Only draft or confirmed tasks can be edited.');
    }
    res.json({ task: store.updateTask(task.id, validateTaskPatch(req.body)) });
  });

  app.post('/api/tasks/:taskId/confirm', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (task.status !== 'draft') {
      throw new HttpError(409, 'INVALID_TASK_STATUS', 'Only a draft task can be confirmed.');
    }
    res.json({ task: store.updateTask(task.id, { status: 'confirmed' }) });
  });

  app.post('/api/tasks/:taskId/publish', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (task.status !== 'confirmed') {
      throw new HttpError(409, 'TASK_NOT_CONFIRMED', 'Confirm the task before publication.');
    }
    const missing = publicationErrors(task);
    if (missing.length) {
      throw new HttpError(422, 'PUBLICATION_REQUIREMENTS_NOT_MET', 'The task is not ready for publication.', {
        missing,
      });
    }
    res.json({ task: store.updateTask(task.id, { status: 'published' }) });
  });

  app.get('/api/teams', (req, res) => {
    const items = store.listTeams();
    res.json({ items, total: items.length });
  });

  app.get('/api/tasks/:taskId/proposals', (req, res) => {
    findTask(store, req.params.taskId);
    const items = store.listProposals(req.params.taskId);
    res.json({ items, total: items.length });
  });

  app.post('/api/tasks/:taskId/proposals', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new HttpError(409, 'PROPOSALS_CLOSED', 'This task does not accept proposals.');
    }
    const input = parseProposal(req.body);
    if (!store.getTeam(input.teamId)) {
      throw new HttpError(404, 'TEAM_NOT_FOUND', 'Team was not found.');
    }
    const proposal = store.createProposal({ taskId: task.id, ...input });
    res.status(201).json({ proposal });
  });

  app.post('/api/tasks/:taskId/selection', (req, res) => {
    const task = findTask(store, req.params.taskId);
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new HttpError(409, 'SELECTION_CLOSED', 'Selection is not available for this task.');
    }
    const body = requireObject(req.body);
    const action = body.action;
    if (!['accept', 'reject', 'close'].includes(action)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'action must be accept, reject, or close.');
    }

    if (action !== 'close') {
      if (!Array.isArray(body.proposalIds) || !body.proposalIds.length) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'proposalIds must be a non-empty array.');
      }
      const proposalIds = [...new Set(body.proposalIds)];
      const proposals = proposalIds.map((id) => store.getProposal(id));
      if (
        proposals.some(
          (proposal, index) =>
            !proposal || proposal.taskId !== task.id || typeof proposalIds[index] !== 'string',
        )
      ) {
        throw new HttpError(400, 'INVALID_PROPOSAL_IDS', 'Every proposal must belong to this task.');
      }
      proposals.forEach((proposal) => store.updateProposal(proposal.id, { status: `${action}ed` }));
      store.updateTask(task.id, {
        status: 'in_selection',
        selectionOutcome: action === 'accept' ? 'selected' : task.selectionOutcome,
      });
    } else {
      const proposals = store.listProposals(task.id);
      const hasAccepted = proposals.some((proposal) => proposal.status === 'accepted');
      proposals
        .filter((proposal) => proposal.status === 'submitted')
        .forEach((proposal) => store.updateProposal(proposal.id, { status: 'rejected' }));
      store.updateTask(task.id, {
        status: 'closed',
        selectionOutcome: hasAccepted ? 'selected' : 'no_selection',
      });
    }

    res.json({
      task: store.getTask(task.id),
      proposals: store.listProposals(task.id),
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route was not found.' },
    });
  });

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' },
      });
    }
    if (error instanceof HttpError) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }
    console.error(error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
    });
  });

  return app;
}

export const appInternals = { EDITABLE_TASK_FIELDS, HttpError, publicationErrors };
