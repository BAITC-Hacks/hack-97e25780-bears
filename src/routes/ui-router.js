import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { frontendAiServiceInternals } from '../services/frontend-ai-service.js';

const categories = ['all', 'ai', 'gamedev', 'web', 'bots', 'design', 'analytics'];
const logos = ['nvidia', 'sony', 'discord', 'telegram', 'yandex', 'tinkoff', 'custom'];

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

const profileFields = {
  student: ['name', 'teamName', 'avatar', 'university', 'specialization', 'skills', 'github', 'telegram'],
  business: ['name', 'roleTitle', 'company', 'avatar'],
};

function readProfile(input, current) {
  const data = object(input, 'profile');
  const role = current?.role || enumValue(data.role, ['student', 'business'], undefined, 'role');
  if (!role) throw new UiError(400, 'VALIDATION_ERROR', 'role is required.');
  const allowed = [...profileFields[role], ...(!current ? ['role'] : [])];
  if (Object.keys(data).some((field) => !allowed.includes(field))) {
    throw new UiError(400, 'PROFILE_FIELDS_NOT_EDITABLE', 'Only editable profile fields may be supplied; id and role cannot be changed.');
  }
  if (current && !Object.keys(data).length) {
    throw new UiError(400, 'VALIDATION_ERROR', 'At least one profile field is required.');
  }
  const merged = { ...current, ...data, role };
  const result = { role };
  for (const field of profileFields[role]) {
    if (field === 'skills') {
      const skills = merged.skills ?? [];
      if (!Array.isArray(skills) || skills.length > 30 || skills.some((skill) => typeof skill !== 'string' || skill.length > 80)) {
        throw new UiError(400, 'VALIDATION_ERROR', 'skills must be an array of at most 30 short strings.');
      }
      result.skills = [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];
    } else {
      const value = ['avatar', 'github'].includes(field)
        ? webUrl(merged[field], field)
        : string(merged[field], field, ['name', 'teamName', 'company'].includes(field));
      if (value.length > (['avatar', 'github'].includes(field) ? 2000 : 300)) {
        throw new UiError(400, 'VALIDATION_ERROR', `${field} is too long.`);
      }
      result[field] = value;
    }
  }
  return result;
}

export function createUiRouter({ store }) {
  const router = Router();

  function findProfile(id, role) {
    const profileId = string(id, 'profileId', true);
    const profile = store.profiles.get(profileId);
    if (!profile) throw new UiError(404, 'PROFILE_NOT_FOUND', 'Profile was not found.');
    if (role && profile.role !== role) throw new UiError(403, 'PROFILE_ROLE_REQUIRED', `A ${role} profile is required.`);
    return profile;
  }

  function profileView(profile) {
    if (profile.role === 'student') return { ...profile, rating: 0, completedTasks: 0 };
    return {
      ...profile, verified: false,
      activeCardsCount: store.listCatalog().filter((task) =>
        store.uiCards.get(task.id)?.businessId === profile.id && task.status !== 'closed').length,
    };
  }

  function notify(profileId, type, task, proposal, title, message) {
    // Generic/legacy records without a profile owner have no notification recipient.
    if (!profileId || !store.profiles.has(profileId)) return;
    const notification = {
      id: `notification-${randomUUID()}`, profileId, type, title, message,
      cardId: task.id, proposalId: proposal.id,
      createdAt: new Date().toISOString(), readAt: null,
    };
    store.notifications.set(notification.id, notification);
  }

  function findTask(id) {
    const task = store.getTask(id);
    if (!task) throw new UiError(404, 'TASK_NOT_FOUND', 'Task was not found.');
    return task;
  }

  function taskView(task, profile) {
    const extra = store.uiCards.get(task.id);
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
      applicantsCount: proposals.length, saved: false,
      hasApplied: profile?.role === 'student' && proposals.some((proposal) =>
        store.uiProposals.get(proposal.id)?.studentId === profile.id),
    };
  }

  function proposalView(proposal) {
    const task = findTask(proposal.taskId);
    const team = store.getTeam(proposal.teamId);
    const extra = store.uiProposals.get(proposal.id);
    const student = extra?.studentId ? store.profiles.get(extra.studentId) : undefined;
    return {
      teamName: team?.name || '', leaderName: '', studentId: '', avatar: '', telegram: '',
      ...extra,
      ...(student ? { leaderName: student.name, avatar: student.avatar } : {}),
      id: proposal.id, cardId: task.id, cardTitle: task.title,
      companyName: taskView(task).company,
      solutionIdea: proposal.solutionIdea, workPlan: proposal.plan,
      proposedDeadline: proposal.duration, prototypeLink: proposal.prototypeUrl || '',
      submittedAt: proposal.createdAt,
      status: proposal.status === 'submitted' ? 'pending' : proposal.status,
    };
  }

  router.get('/profiles', (req, res) => {
    res.json({ profiles: [...store.profiles.values()].map(profileView) });
  });

  router.post('/profiles', (req, res) => {
    const data = readProfile(object(req.body, 'body').profile);
    const now = new Date().toISOString();
    const profile = { ...data, id: `profile-${randomUUID()}`, createdAt: now, updatedAt: now };
    store.transaction(() => store.profiles.set(profile.id, profile));
    res.status(201).json({ profile: profileView(profile) });
  });

  router.patch('/profiles/:profileId', (req, res) => {
    const current = findProfile(req.params.profileId);
    const data = readProfile(object(req.body, 'body').profile, current);
    const profile = { ...current, ...data, updatedAt: new Date().toISOString() };
    store.transaction(() => store.profiles.set(profile.id, profile));
    res.json({ profile: profileView(profile) });
  });

  router.get('/state', (req, res) => {
    const tasks = store.listCatalog();
    const profile = req.query.profileId === undefined ? null : findProfile(req.query.profileId);
    const proposals = tasks.flatMap((task) => store.listProposals(task.id)).filter((proposal) => {
      if (profile?.role === 'business') return store.uiCards.get(proposal.taskId)?.businessId === profile.id;
      if (profile?.role === 'student') return store.uiProposals.get(proposal.id)?.studentId === profile.id;
      return false;
    });
    const notifications = [...store.notifications.values()]
      .filter((item) => item.profileId === profile?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({
      cards: tasks.map((task) => taskView(task, profile)).sort((a, b) => b.readinessScore - a.readinessScore),
      proposals: proposals.map(proposalView), notifications,
      unreadCount: notifications.filter((item) => !item.readAt).length,
    });
  });

  router.post('/cards', (req, res) => {
    const body = object(req.body, 'body');
    const profile = findProfile(body.profileId, 'business');
    const card = readCard({ ...object(body.card, 'card'), company: profile.company });
    const task = store.transaction(() => {
      const created = store.createTask({
        title: card.title, industry: card.category,
        draftText: card.shortSummary || card.context,
        context: card.context || card.shortSummary, need: '', data: card.dataAndMaterials,
        expectedResult: card.expectedResult, successCriteria: card.successCriteria,
        constraints: card.constraints, users: card.targetUsers,
        contact: card.businessContact, interactionFormat: '',
      });
      store.uiCards.set(created.id, { ...card, id: created.id, businessId: profile.id });
      // The final publish action includes explicit user confirmation.
      return store.updateTask(created.id, { status: 'published' });
    });
    res.status(201).json({ card: taskView(task, profile) });
  });

  router.post('/proposals', (req, res) => {
    const body = object(req.body, 'body');
    const profile = findProfile(body.profileId, 'student');
    const input = object(body.proposal, 'proposal');
    const cardId = string(input.cardId, 'cardId', true);
    const task = findTask(cardId);
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new UiError(409, 'PROPOSALS_CLOSED', 'This task does not accept proposals.');
    }
    const required = ['solutionIdea', 'workPlan', 'proposedDeadline'];
    const data = Object.fromEntries(required.map((key) => [key, string(input[key], key, true)]));
    data.teamName = input.teamName === undefined ? profile.teamName : string(input.teamName, 'teamName', true);
    data.prototypeLink = webUrl(input.prototypeLink, 'prototypeLink');
    data.telegram = input.telegram === undefined ? (profile.telegram || '') : string(input.telegram, 'telegram');
    const duplicate = store.listProposals(task.id).some((proposal) =>
      store.uiProposals.get(proposal.id)?.studentId === profile.id);
    if (duplicate) throw new UiError(409, 'DUPLICATE_PROPOSAL', 'This student has already submitted a proposal.');
    const proposal = store.transaction(() => {
      const teamId = `team-${randomUUID()}`;
      store.teams.set(teamId, { id: teamId, name: data.teamName, interests: [], skills: [], technologies: [] });
      const created = store.createProposal({
        taskId: task.id, teamId, solutionIdea: data.solutionIdea,
        plan: data.workPlan, duration: data.proposedDeadline, prototypeUrl: data.prototypeLink,
      });
      store.uiProposals.set(created.id, {
        id: created.id, teamName: data.teamName, leaderName: profile.name, studentId: profile.id,
        avatar: profile.avatar, telegram: data.telegram,
      });
      notify(store.uiCards.get(task.id)?.businessId, 'new_proposal', task, created,
        'Новый отклик на карточку', `${data.teamName} предлагает решение: ${task.title}`);
      return created;
    });
    res.status(201).json({ proposal: proposalView(proposal) });
  });

  router.post('/proposals/:proposalId/selection', (req, res) => {
    const body = object(req.body, 'body');
    const profile = findProfile(body.profileId, 'business');
    const action = body.action;
    if (!['accept', 'reject'].includes(action)) {
      throw new UiError(400, 'VALIDATION_ERROR', 'action must be accept or reject.');
    }
    const proposal = store.getProposal(req.params.proposalId);
    if (!proposal) throw new UiError(404, 'PROPOSAL_NOT_FOUND', 'Proposal was not found.');
    const task = findTask(proposal.taskId);
    if (store.uiCards.get(task.id)?.businessId !== profile.id) {
      throw new UiError(403, 'CARD_OWNER_REQUIRED', 'Only the selected card owner can make this decision.');
    }
    if (!['published', 'in_selection'].includes(task.status)) {
      throw new UiError(409, 'SELECTION_CLOSED', 'Selection is not available for this task.');
    }
    if (proposal.status !== 'submitted') {
      throw new UiError(409, 'PROPOSAL_ALREADY_DECIDED', 'This proposal has already been accepted or rejected.');
    }
    const updated = store.transaction(() => {
      const result = store.updateProposal(proposal.id, { status: action === 'accept' ? 'accepted' : 'rejected' });
      const hasAccepted = store.listProposals(task.id).some((item) => item.status === 'accepted');
      store.updateTask(task.id, { status: 'in_selection', selectionOutcome: hasAccepted ? 'selected' : 'pending' });
      notify(store.uiProposals.get(proposal.id)?.studentId, `proposal_${result.status}`, task, result,
        action === 'accept' ? 'Ваш отклик принят' : 'Ваш отклик отклонён', task.title);
      return result;
    });
    res.json({ proposal: proposalView(updated) });
  });

  router.patch('/notifications/:notificationId', (req, res) => {
    const body = object(req.body, 'body');
    const profile = findProfile(body.profileId);
    if (body.read !== true) throw new UiError(400, 'VALIDATION_ERROR', 'read must be true.');
    const current = store.notifications.get(req.params.notificationId);
    if (!current || current.profileId !== profile.id) {
      throw new UiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found for this profile.');
    }
    const notification = { ...current, readAt: current.readAt || new Date().toISOString() };
    store.transaction(() => store.notifications.set(notification.id, notification));
    res.json({ notification });
  });

  router.post('/notifications/read-all', (req, res) => {
    const profile = findProfile(object(req.body, 'body').profileId);
    const readAt = new Date().toISOString();
    store.transaction(() => {
      for (const notification of store.notifications.values()) {
        if (notification.profileId === profile.id && !notification.readAt) {
          store.notifications.set(notification.id, { ...notification, readAt });
        }
      }
    });
    res.json({ unreadCount: 0 });
  });

  router.use((error, req, res, next) => {
    if (!(error instanceof UiError)) return next(error);
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  });

  return router;
}
