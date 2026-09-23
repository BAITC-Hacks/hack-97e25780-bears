import React, { useRef, useState } from 'react';
import { Bell, ArrowUpRight, CheckCheck } from 'lucide-react';
import type { AppNotification } from '../types';
import { errorMessage } from '../api';
import { ModalFrame } from './ModalFrame';

export function NotificationsPanel({ notifications, profileName, loadError, onClose, onOpen, onReadAll, onRefresh }: {
  notifications: AppNotification[]; profileName: string; loadError: string;
  onClose: () => void; onOpen: (notification: AppNotification) => Promise<void>;
  onReadAll: () => Promise<void>; onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const perform = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await action(); } catch (cause) { setError(errorMessage(cause)); }
    finally { pending.current = false; setBusy(false); }
  };
  const unread = notifications.filter((notification) => !notification.readAt).length;
  return <ModalFrame title="Уведомления" onClose={onClose} busy={busy}>
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-white">{profileName}</p><p className="text-xs text-neutral-500">Обновление каждые 10 секунд</p></div><button type="button" onClick={onRefresh} disabled={busy} className="text-xs text-amber-300 hover:text-white">Обновить</button></div>
      {(error || loadError) && <p role="alert" className="p-3 rounded-xl bg-red-500/10 text-sm text-red-300">{error || loadError}</p>}
      {unread > 0 && <button type="button" disabled={busy} onClick={() => { void perform(onReadAll); }} className="flex items-center gap-2 text-xs font-semibold text-amber-300 disabled:opacity-40"><CheckCheck className="w-4 h-4" />Прочитать все ({unread})</button>}
      {notifications.length === 0 ? <div className="text-center py-10 space-y-2"><Bell className="w-9 h-9 mx-auto text-neutral-600" /><h3 className="font-semibold text-neutral-200">Пока нет уведомлений</h3><p className="text-xs text-neutral-500 max-w-xs mx-auto">Здесь появятся новые отклики на ваши задачи и решения бизнеса по вашим предложениям.</p></div> :
        <div className="space-y-2">{notifications.map((notification) => <button key={notification.id} type="button" disabled={busy} onClick={() => { void perform(() => onOpen(notification)); }} className={`w-full p-4 rounded-2xl text-left border transition-colors hover:bg-white/[0.06] disabled:opacity-60 ${notification.readAt ? 'border-white/10 bg-white/[0.02]' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className="flex items-start gap-2">{!notification.readAt && <span aria-label="Не прочитано" className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}<span className="flex-1 text-sm font-semibold text-white">{notification.title}</span><ArrowUpRight className="w-4 h-4 text-neutral-500 flex-shrink-0" /></div>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{notification.message}</p><p className="text-[11px] text-neutral-500 mt-2">{new Date(notification.createdAt).toLocaleString('ru-RU')}</p>
        </button>)}</div>}
    </div>
  </ModalFrame>;
}
