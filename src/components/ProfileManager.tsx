import React, { useState } from 'react';
import { Check, Pencil, Plus } from 'lucide-react';
import type { ProfileInput, UserProfile, UserRole } from '../types';
import { ModalFrame } from './ModalFrame';
import { ProfileAvatar } from './ProfileAvatar';
import { EditProfileModal } from './EditProfileModal';

export function ProfileManager({ role, profiles, currentId, onSelect, onSave, onClose }: {
  role: UserRole; profiles: UserProfile[]; currentId?: string; onSelect: (profile: UserProfile) => void;
  onSave: (input: ProfileInput, id?: string) => Promise<void>; onClose: () => void;
}) {
  const [editing, setEditing] = useState<UserProfile | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  return <ModalFrame title="Профили" onClose={onClose} busy={busy}>
    {editing ? <EditProfileModal key={editing === 'new' ? `new-${role}` : editing.id} profile={editing === 'new' ? undefined : editing} role={role} onBack={() => setEditing(null)} onSave={onSave} onBusyChange={setBusy} /> :
      <div className="p-5 space-y-4">
        <p className="text-xs text-neutral-400 leading-relaxed">Демо-профили без пароля. Выберите, от чьего имени работать. Любой посетитель этого сервера может переключать профили.</p>
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{role === 'student' ? 'Студенты' : 'Представители бизнеса'}</h3><span className="text-xs text-neutral-500">{profiles.length}</span></div>
        <div className="space-y-2">
          {profiles.map((profile) => <div key={profile.id} className={`flex items-center gap-2 p-2 rounded-2xl border ${profile.id === currentId ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
            <button type="button" onClick={() => onSelect(profile)} className="flex flex-1 items-center gap-3 text-left p-1 rounded-xl min-w-0 focus-visible:outline-2 focus-visible:outline-amber-400" aria-label={`Выбрать профиль ${profile.name}`}>
              <ProfileAvatar name={profile.name} /><span className="min-w-0"><span className="block text-sm text-white truncate">{profile.name}</span><span className="block text-xs text-neutral-400 truncate">{profile.role === 'student' ? profile.teamName : profile.company}</span></span>
              {profile.id === currentId && <Check className="w-4 h-4 ml-auto text-amber-400 flex-shrink-0" />}
            </button>
            <button type="button" onClick={() => setEditing(profile)} aria-label={`Редактировать профиль ${profile.name}`} className="p-2.5 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-amber-300"><Pencil className="w-4 h-4" /></button>
          </div>)}
          {profiles.length === 0 && <p className="text-sm text-neutral-400 py-4">Профилей пока нет. Создайте первый.</p>}
        </div>
        <button type="button" onClick={() => setEditing('new')} className="flex w-full justify-center items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-neutral-950 font-bold text-sm hover:bg-amber-300"><Plus className="w-4 h-4" />Создать профиль {role === 'student' ? 'студента' : 'бизнеса'}</button>
      </div>}
  </ModalFrame>;
}
