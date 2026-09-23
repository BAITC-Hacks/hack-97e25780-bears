import { randomUUID } from 'node:crypto';
import { calculateRating } from '../domain/rating.js';

function clone(value) {
  return structuredClone(value);
}

export class MemoryStore {
  constructor(seed = { tasks: [], teams: [], proposals: [] }) {
    this.tasks = new Map((seed.tasks || []).map((task) => [task.id, clone(task)]));
    this.teams = new Map((seed.teams || []).map((team) => [team.id, clone(team)]));
    this.proposals = new Map((seed.proposals || []).map((proposal) => [proposal.id, clone(proposal)]));
  }

  createTask(input) {
    const now = new Date().toISOString();
    const task = {
      id: `task-${randomUUID()}`,
      title: '',
      industry: '',
      draftText: '',
      context: '',
      need: '',
      users: '',
      data: '',
      constraints: '',
      expectedResult: '',
      successCriteria: '',
      contact: '',
      interactionFormat: '',
      ...input,
      status: 'draft',
      selectionOutcome: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    task.rating = calculateRating(task);
    this.tasks.set(task.id, task);
    return clone(task);
  }

  getTask(id) {
    const task = this.tasks.get(id);
    return task ? clone(task) : null;
  }

  updateTask(id, patch) {
    const current = this.tasks.get(id);
    if (!current) return null;
    const task = { ...current, ...patch, updatedAt: new Date().toISOString() };
    task.rating = calculateRating(task);
    this.tasks.set(id, task);
    return clone(task);
  }

  listCatalog() {
    const visibleStatuses = new Set(['published', 'in_selection', 'closed']);
    return [...this.tasks.values()]
      .filter((task) => visibleStatuses.has(task.status))
      .sort(
        (left, right) =>
          right.rating.score - left.rating.score ||
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .map(clone);
  }

  listTeams() {
    return [...this.teams.values()].map(clone);
  }

  getTeam(id) {
    const team = this.teams.get(id);
    return team ? clone(team) : null;
  }

  createProposal(input) {
    const proposal = {
      id: `proposal-${randomUUID()}`,
      ...input,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    this.proposals.set(proposal.id, proposal);
    return clone(proposal);
  }

  getProposal(id) {
    const proposal = this.proposals.get(id);
    return proposal ? clone(proposal) : null;
  }

  updateProposal(id, patch) {
    const proposal = this.proposals.get(id);
    if (!proposal) return null;
    const updated = { ...proposal, ...patch };
    this.proposals.set(id, updated);
    return clone(updated);
  }

  listProposals(taskId) {
    return [...this.proposals.values()]
      .filter((proposal) => proposal.taskId === taskId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(clone);
  }
}
