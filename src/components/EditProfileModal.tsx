import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { X, User, Save, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  profile: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: StudentProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(profile.name);
  const [id, setId] = useState(profile.id);
  const [university, setUniversity] = useState(profile.university);
  const [specialization, setSpecialization] = useState(profile.specialization);
  const [github, setGithub] = useState(profile.github);
  const [telegram, setTelegram] = useState(profile.telegram);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name,
      id,
      university,
      specialization,
      github,
      telegram,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#161720] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#1A1C26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Профиль студента</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              ФИО Студента
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#1E202B] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Студенческий ID (номер билета)
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              className="w-full bg-[#1E202B] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              ВУЗ
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full bg-[#1E202B] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                GitHub
              </label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full bg-[#1E202B] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                Telegram
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full bg-[#1E202B] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-orange-500/20 hover:brightness-110"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
