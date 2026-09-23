import type { TaskCard, TeamProposal, UserProfile, ProfileInput, AppNotification } from './types';

const API_ERRORS: Record<string, string> = {
  PROFILE_NOT_FOUND: 'Профиль не найден. Обновите список и выберите профиль.',
  PROFILE_ROLE_REQUIRED: 'Для этого действия выберите профиль нужной роли.',
  PROFILE_FIELDS_NOT_EDITABLE: 'ID, роль и системные поля профиля изменять нельзя.',
  TASK_NOT_FOUND: 'Задача больше не найдена. Обновите каталог.',
  PROPOSAL_NOT_FOUND: 'Отклик не найден. Обновите список.',
  NOTIFICATION_NOT_FOUND: 'Уведомление не найдено у выбранного профиля. Обновите список.',
  DUPLICATE_PROPOSAL: 'От этого профиля уже отправлено предложение на задачу.',
  PROPOSALS_CLOSED: 'Приём предложений на эту задачу закрыт.',
  CARD_OWNER_REQUIRED: 'Решение может принять только профиль владельца задачи.',
  SELECTION_CLOSED: 'Выбор команды для этой задачи уже закрыт.',
  PROPOSAL_ALREADY_DECIDED: 'Решение по этому предложению уже принято. Обновите список.',
};

export async function requestJson<T>(path: string, body?: unknown, signal?: AbortSignal, method?: string): Promise<T> {
  const response = await fetch(path, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : data?.error?.message;
    const translated = API_ERRORS[data?.error?.code];
    const validation = data?.error?.code === 'VALIDATION_ERROR' && path.startsWith('/api/ui/profiles')
      ? 'Проверьте обязательные поля, ссылку GitHub (http/https) и навыки: не более 30, до 80 символов каждый.' : '';
    throw new Error(translated || validation || message || `Сервер вернул ошибку ${response.status}. Попробуйте ещё раз.`);
  }
  if (data === null) throw new Error('Сервер вернул неверный ответ. Данные формы сохранены.');
  return data as T;
}

export const projectApi = {
  profiles: (signal?: AbortSignal) => requestJson<{ profiles: UserProfile[] }>('/api/ui/profiles', undefined, signal),
  createProfile: (profile: ProfileInput) => requestJson<{ profile: UserProfile }>('/api/ui/profiles', { profile }),
  updateProfile: (id: string, profile: ProfileInput) =>
    requestJson<{ profile: UserProfile }>(`/api/ui/profiles/${encodeURIComponent(id)}`, { profile }, undefined, 'PATCH'),
  state: (profileId: string, signal?: AbortSignal) =>
    requestJson<{ cards: TaskCard[]; proposals: TeamProposal[]; notifications: AppNotification[]; unreadCount: number }>(
      `/api/ui/state?profileId=${encodeURIComponent(profileId)}`, undefined, signal),
  publishCard: (profileId: string, card: TaskCard) => requestJson<{ card: TaskCard }>('/api/ui/cards', { profileId, card }),
  submitProposal: (profileId: string, proposal: Omit<TeamProposal, 'id' | 'submittedAt' | 'status'>) =>
    requestJson<{ proposal: TeamProposal }>('/api/ui/proposals', { profileId, proposal }),
  selectProposal: (profileId: string, id: string, action: 'accept' | 'reject') =>
    requestJson<{ proposal: TeamProposal }>(`/api/ui/proposals/${encodeURIComponent(id)}/selection`, { profileId, action }),
  readNotification: (profileId: string, id: string) =>
    requestJson<{ notification: AppNotification }>(`/api/ui/notifications/${encodeURIComponent(id)}`, { profileId, read: true }, undefined, 'PATCH'),
  readAllNotifications: (profileId: string) => requestJson('/api/ui/notifications/read-all', { profileId }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load/i.test(error.message)) return 'Не удалось связаться с сервером. Проверьте подключение и повторите попытку. Введённые данные сохранены в форме.';
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}
