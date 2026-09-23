import type { TaskCard, TeamProposal } from './types';

export async function requestJson<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : data?.error?.message;
    throw new Error(message || `Сервер вернул ошибку ${response.status}. Попробуйте ещё раз.`);
  }
  if (data === null) throw new Error('Сервер вернул неверный ответ. Данные формы сохранены.');
  return data as T;
}

export const projectApi = {
  state: (signal?: AbortSignal) =>
    requestJson<{ cards: TaskCard[]; proposals: TeamProposal[] }>('/api/ui/state', undefined, signal),
  publishCard: (card: TaskCard) => requestJson<{ card: TaskCard }>('/api/ui/cards', { card }),
  submitProposal: (proposal: Omit<TeamProposal, 'id' | 'submittedAt' | 'status'>) =>
    requestJson<{ proposal: TeamProposal }>('/api/ui/proposals', { proposal }),
  selectProposal: (id: string, action: 'accept' | 'reject') =>
    requestJson<{ proposal: TeamProposal }>(`/api/ui/proposals/${encodeURIComponent(id)}/selection`, { action }),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}
