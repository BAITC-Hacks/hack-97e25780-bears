import { randomUUID } from 'node:crypto';
import { calculateRating } from '../domain/rating.js';

function clone(value) {
  return structuredClone(value);
}

export class MemoryStore {
  constructor(seed = { tasks: [], teams: [], proposals: [] }) {
    this.storageKind = 'memory';
    this.inTransaction = false;
    this.restore(seed);
  }

  restore(snapshot) {
    for (const key of ['tasks', 'teams', 'proposals', 'uiCards', 'uiProposals', 'profiles', 'notifications']) {
      this[key] = new Map((snapshot[key] || []).map((item) => [item.id, clone(item)]));
    }
  }

  snapshot() {
    return {
      version: 1,
      ...Object.fromEntries(['tasks', 'teams', 'proposals', 'uiCards', 'uiProposals', 'profiles', 'notifications']
        .map((key) => [key, [...this[key].values()].map(clone)])),
    };
  }

  // UI operations group related records and notifications into one commit.
  // Callbacks are synchronous so no other request can see a partial mutation.
  transaction(operation) {
    if (this.inTransaction) return operation();
    const before = this.snapshot();
    this.inTransaction = true;
    try {
      const result = operation();
      this.persist();
      return result;
    } catch (error) {
      this.restore(before);
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }

  persist() {
    // The memory implementation deliberately has no disk side effects.
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
    this.transaction(() => this.tasks.set(task.id, task));
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
    this.transaction(() => this.tasks.set(id, task));
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
    this.transaction(() => this.proposals.set(proposal.id, proposal));
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
    this.transaction(() => this.proposals.set(id, updated));
    return clone(updated);
  }

  listProposals(taskId) {
    return [...this.proposals.values()]
      .filter((proposal) => proposal.taskId === taskId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(clone);
  }
}
