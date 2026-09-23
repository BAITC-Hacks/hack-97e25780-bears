import React from 'react';
import { Logo } from './Logo';
import { UserRole } from '../types';
import { Sparkles, GraduationCap, Briefcase, Bell } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeCardsCount: number;
  onOpenAiCreator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeCardsCount,
  onOpenAiCreator,
}) => {
  return (
    <header className="h-16 px-5 border-b border-white/[0.08] bg-[#14151B]/90 backdrop-blur-md flex items-center justify-between z-30 sticky top-0">
      {/* Top Left: Logo & Subtitle */}
      <div className="flex items-center gap-6">
        <Logo size="md" />

        {/* Subtitle from the user's sketch/mockup */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-neutral-300">
            Веб Приложение без аккаунтов (автоматизация) → 2 режима
          </span>
          <span className="text-orange-400/90 font-medium">
            ({currentRole === 'student' ? 'Режим: Студент' : 'Режим: Бизнес'})
          </span>
        </div>
      </div>

      {/* Right Controls: Role Switcher & Action */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill (Студент / Бизнес) */}
        <div className="flex items-center p-1 rounded-xl bg-[#1C1E26] border border-white/[0.08] shadow-inner">
          <button
            onClick={() => onRoleChange('student')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentRole === 'student'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Студент</span>
          </button>

          <button
            onClick={() => onRoleChange('business')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentRole === 'business'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/25'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Бизнес</span>
          </button>
        </div>

        {/* Business quick AI create button if in business mode */}
        {currentRole === 'business' && onOpenAiCreator && (
          <button
            onClick={onOpenAiCreator}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-neutral-950" />
            <span>Создать Карту + ИИ</span>
          </button>
        )}

        {/* Notifications / Live status icon */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Уведомления платформы"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#14151B]" />
          </button>
        </div>
      </div>
    </header>
  );
};
