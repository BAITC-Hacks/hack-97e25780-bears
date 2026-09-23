import React, { useRef, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import type { ProfileInput, UserProfile, UserRole } from '../types';
import { errorMessage } from '../api';

export function EditProfileModal({ profile, role, onBack, onSave, onBusyChange }: {
  profile?: UserProfile; role: UserRole; onBack: () => void;
  onSave: (input: ProfileInput, id?: string) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const student = profile?.role === 'student' ? profile : undefined;
  const business = profile?.role === 'business' ? profile : undefined;
  const [values, setValues] = useState({
    name: profile?.name || '', teamName: student?.teamName || '', university: student?.university || '',
    specialization: student?.specialization || '', skills: student?.skills.join(', ') || '', github: student?.github || '',
    telegram: student?.telegram || '', company: business?.company || '', roleTitle: business?.roleTitle || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const set = (field: keyof typeof values, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const field = (name: keyof typeof values, label: string, required = false, placeholder = '', maxLength = 200) => (
    <div>
      <label htmlFor={`profile-${name}`} className="block text-xs font-medium text-neutral-300 mb-1.5">{label}{required ? ' *' : ''}</label>
      <input id={`profile-${name}`} name={name} autoFocus={name === 'name'} value={values[name]} onChange={(event) => set(name, event.target.value)} required={required} maxLength={maxLength} type={name === 'github' ? 'url' : 'text'} placeholder={placeholder} disabled={busy}
        className="w-full bg-[#1E202B] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none disabled:opacity-60" />
    </div>
  );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    if (!values.name.trim() || !(role === 'student' ? values.teamName : values.company).trim()) {
      setError('Заполните обязательные поля. Одних пробелов недостаточно.'); return;
    }
    pending.current = true; setBusy(true); onBusyChange(true); setError('');
    const input: ProfileInput = {
      name: values.name.trim(),
      ...(profile ? {} : { role }),
      ...(role === 'student' ? {
        teamName: values.teamName.trim(), university: values.university.trim(), specialization: values.specialization.trim(),
        skills: values.skills.split(',').map((value) => value.trim()).filter(Boolean), github: values.github.trim(), telegram: values.telegram.trim(),
      } : { company: values.company.trim(), roleTitle: values.roleTitle.trim() }),
    };
    try { await onSave(input, profile?.id); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { pending.current = false; setBusy(false); onBusyChange(false); }
  };
  return <form onSubmit={submit} className="p-5 space-y-4">
    <button type="button" onClick={onBack} disabled={busy} className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-white disabled:opacity-40"><ArrowLeft className="w-4 h-4" />К списку профилей</button>
    <div><h3 className="text-white font-semibold">{profile ? 'Редактирование' : 'Новый профиль'} · {role === 'student' ? 'Студент' : 'Бизнес'}</h3>
      {profile && <p className="text-xs text-neutral-500 mt-1 break-all">ID: {profile.id} · назначен сервером</p>}
    </div>
    {field('name', role === 'student' ? 'Имя студента' : 'Имя представителя', true)}
    {role === 'student' ? <>
      {field('teamName', 'Название команды', true)}
      {field('university', 'Учебное заведение')}
      {field('specialization', 'Специализация')}
      {field('skills', 'Навыки через запятую', false, 'React, Python, дизайн', 500)}
      <div className="grid sm:grid-cols-2 gap-4">{field('github', 'Ссылка на GitHub', false, 'https://github.com/username', 500)}{field('telegram', 'Telegram', false, '@username')}</div>
    </> : <>{field('company', 'Компания', true)}{field('roleTitle', 'Должность')}</>}
    {error && <p role="alert" className="text-sm text-red-300 rounded-xl p-3 bg-red-500/10 border border-red-500/20">{error}</p>}
    <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
      <button type="button" onClick={onBack} disabled={busy} className="px-4 py-2 text-sm text-neutral-300 disabled:opacity-40">Отмена</button>
      <button type="submit" disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-sm hover:bg-amber-300 disabled:opacity-50"><Save className="w-4 h-4" />{busy ? 'Сохраняем…' : profile ? 'Сохранить изменения' : 'Создать профиль'}</button>
    </div>
  </form>;
}
