import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { frontendAiServiceInternals } from '../services/frontend-ai-service.js';

// Presentation-only fields are retained alongside the shared MemoryStore, not
// squeezed into the generic task schema. Both APIs address the same records.
const metadataByStore = new WeakMap();
const categories = ['all', 'ai', 'gamedev', 'web', 'bots', 'design', 'analytics'];
const logos = ['nvidia', 'sony', 'discord', 'telegram', 'yandex', 'tinkoff', 'custom'];
const visibleStatuses = ['published', 'in_selection', 'closed'];

class UiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function object(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new UiError(400, 'VALIDATION_ERROR', `${name} must be an object.`);
  }
  return value;
}

function string(value, name, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || (required && !value.trim())) {
    throw new UiError(400, 'VALIDATION_ERROR', `${name} must be ${required ? 'a non-empty' : 'a'} string.`);
  }
  return value.trim();
}

function webUrl(value, name) {
  const text = string(value, name);
  if (!text) return '';
  try {
    if (!['http:', 'https:'].includes(new URL(text).protocol)) throw new Error();
  } catch {
    throw new UiError(400, 'VALIDATION_ERROR', `${name} must be an HTTP(S) URL.`);
  }
  return text;
}

function enumValue(value, values, fallback, name) {
  if (value === undefined) return fallback;
  if (!values.includes(value)) throw new UiError(400, 'VALIDATION_ERROR', `${name} is invalid.`);
  return value;
}

function readCard(input) {
  const card = object(input, 'card');
  const textFields = ['shortSummary', 'context', 'dataAndMaterials', 'expectedResult',
    'successCriteria', 'constraints', 'targetUsers', 'reward', 'customLogoText'];
  const result = Object.fromEntries(textFields.map((key) => [key, string(card[key], key)]));
  result.title = string(card.title, 'title', true);
  result.company = string(card.company, 'company', true);
  result.businessContact = string(card.businessContact, 'businessContact', true);
  if (!result.context && !result.shortSummary) {
    throw new UiError(400, 'VALIDATION_ERROR', 'context or shortSummary is required.');
  }
  result.category = enumValue(card.category, categories, 'all', 'category');
  result.logoType = enumValue(card.logoType, logos, 'custom', 'logoType');
  result.brandColor = string(card.brandColor, 'brandColor') || '#F59E0B';
  if (!/^#[\da-f]{6}$/i.test(result.brandColor)) {
    throw new UiError(400, 'VALIDATION_ERROR', 'brandColor must be a six-digit hex color.');
  }
  result.accentGlow = `${result.brandColor}33`;
  result.deadlineDays = card.deadlineDays === undefined ? 14 : card.deadlineDays;
  if (!Number.isInteger(result.deadlineDays) || result.deadlineDays < 1 || result.deadlineDays > 365) {
    throw new UiError(400, 'VALIDATION_ERROR', 'deadlineDays must be an integer from 1 to 365.');
  }
  if (card.tags !== undefined && (!Array.isArray(card.tags) || card.tags.some((tag) => typeof tag !== 'string'))) {
    throw new UiError(400, 'VALIDATION_ERROR', 'tags must be an array of strings.');
  }
  result.tags = (card.tags || []).map((tag) => tag.trim()).filter(Boolean);
  if (card.aiGenerated !== undefined && typeof card.aiGenerated !== 'boolean') {
    throw new UiError(400, 'VALIDATION_ERROR', 'aiGenerated must be a boolean.');
  }
  result.aiGenerated = card.aiGenerated === true;
  return result;
}

export function createUiRouter({ store }) {
  const router = Router();
  let metadata = metadataByStore.get(store);
  if (!metadata) {
    metadata = { cards: new Map(), proposals: new Map() };
    metadataByStore.set(store, metadata);
  }

  function findTask(id) {
    const task = store.getTask(id);
    if (!task) throw new UiError(404, 'TASK_NOT_FOUND', 'Task was not found.');
    return task;
  }

  function taskView(task) {
    const extra = metadata.cards.get(task.id);
    const card = {
      company: 'Учебный пример', brandColor: '#F59E0B', accentGlow: '#F59E0B33',
      logoType: 'custom', customLogoText: 'DEMO', category: 'all', deadlineDays: 14,
      reward: '', tags: [], aiGenerated: false,
      ...extra,
      id: task.id, title: task.title,
      shortSummary: extra?.shortSummary ?? task.draftText ?? '',
      context: task.context || task.need || '', dataAndMaterials: task.data || '',
      expectedResult: task.expectedResult || '', successCriteria: task.successCriteria || '',
      constraints: task.constraints || '', targetUsers: task.users || '',
      businessContact: [task.contact, task.interactionFormat].filter(Boolean).join(', '),
    };
    const rating = frontendAiServiceInternals.frontendRating(card);
    const proposals = store.listProposals(task.id);
    return {
      ...card,
      readinessScore: rating.score, readinessLevel: rating.level, scoreBreakdown: rating,
      urgency: rating.score >= 90 ? 'urgent' : 'medium',
      deadlineText: `${card.deadlineDays} дней`, datePosted: task.createdAt,
      applicantsCount: proposals.length, saved: false, hasApplied: proposals.length > 0,
    };
  }

  function proposalView(proposal) {
    const task = findTask(proposal.taskId);
    const team = store.getTeam(proposal.teamId);
    const extra = metadata.proposals.get(proposal.id);
    return {
      teamName: team?.name || '', leaderName: '', studentId: '', avatar: '', telegram: '',
      ...extra,
      id: proposal.id, cardId: task.id, cardTitle: task.title,
      companyName: taskView(task).company,
      solutionIdea: proposal.solutionIdea, workPlan: proposal.plan,
      proposedDeadline: proposal.duration, prototypeLink: proposal.prototypeUrl || '',
      submittedAt: proposal.createdAt,
      status: proposal.status === 'submitted' ? 'pending' : proposal.status,
    };
  }

  router.get('/state', (req, res) => {
    const tasks = store.listCatalog();
    res.json({
      cards: tasks.map(taskView).sort((a, b) => b.readinessScore - a.readinessScore),
      proposals: tasks.flatMap((task) => store.listProposals(task.id).map(proposalView)),
    });
  });

  router.post('/cards', (req, res) => {
    const card = readCard(object(req.body, 'body').card);
    const created = store.createTask({
      title: card.title, industry: card.category,
      draftText: card.shortSummary || card.context,
      context: card.context || card.shortSummary, need: '', data: card.dataAndMaterials,
      expectedResult: card.expectedResult, successCriteria: card.successCriteria,
      constraints: card.constraints, users: card.targetUsers,
      contact: card.businessContact, interactionFormat: '',
    });
    metadata.cards.set(created.id, card);
    // The UI's final publish action includes its explicit user confirmation.
    // Its free-text businessContact is preserved; generic API validation is unchanged.
    const task = store.updateTask(created.id, { status: 'published' });
    res.status(201).json({ card: taskView(task) });
  });

  router.post('/proposals', (req, res) => {
    const input = object(object(req.body, 'body').proposal, 'proposal');
    const cardId = string(input.cardId, 'cardId', true);
    const task = findTask(cardId);
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new UiError(409, 'PROPOSALS_CLOSED', 'This task does not accept proposals.');
    }
    const required = ['teamName', 'leaderName', 'studentId', 'solutionIdea', 'workPlan', 'proposedDeadline'];
    const data = Object.fromEntries(required.map((key) => [key, string(input[key], key, true)]));
    data.prototypeLink = webUrl(input.prototypeLink, 'prototypeLink');
    data.avatar = webUrl(input.avatar, 'avatar');
    data.telegram = string(input.telegram, 'telegram');
    const duplicate = store.listProposals(task.id).some((proposal) =>
      metadata.proposals.get(proposal.id)?.studentId === data.studentId);
    if (duplicate) throw new UiError(409, 'DUPLICATE_PROPOSAL', 'This student has already submitted a proposal.');
    const teamId = `team-${randomUUID()}`;
    store.teams.set(teamId, {
      id: teamId, name: data.teamName, interests: [], skills: [], technologies: [],
    });
    const proposal = store.createProposal({
      taskId: task.id, teamId, solutionIdea: data.solutionIdea,
      plan: data.workPlan, duration: data.proposedDeadline, prototypeUrl: data.prototypeLink,
    });
    metadata.proposals.set(proposal.id, {
      teamName: data.teamName, leaderName: data.leaderName, studentId: data.studentId,
      avatar: data.avatar, telegram: data.telegram,
    });
    res.status(201).json({ proposal: proposalView(proposal) });
  });

  router.post('/proposals/:proposalId/selection', (req, res) => {
    const action = object(req.body, 'body').action;
    if (!['accept', 'reject'].includes(action)) {
      throw new UiError(400, 'VALIDATION_ERROR', 'action must be accept or reject.');
    }
    const proposal = store.getProposal(req.params.proposalId);
    if (!proposal) throw new UiError(404, 'PROPOSAL_NOT_FOUND', 'Proposal was not found.');
    const task = findTask(proposal.taskId);
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new UiError(409, 'SELECTION_CLOSED', 'Selection is not available for this task.');
    }
    if (proposal.status !== 'submitted') {
      throw new UiError(409, 'PROPOSAL_ALREADY_DECIDED', 'This proposal has already been accepted or rejected.');
    }
    const updated = store.updateProposal(proposal.id, { status: action === 'accept' ? 'accepted' : 'rejected' });
    const hasAccepted = store.listProposals(task.id).some((item) => item.status === 'accepted');
    store.updateTask(task.id, {
      status: 'in_selection', selectionOutcome: hasAccepted ? 'selected' : 'pending',
    });
    res.json({ proposal: proposalView(updated) });
  });

  router.use((error, req, res, next) => {
    if (!(error instanceof UiError)) return next(error);
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  });

  return router;
}
