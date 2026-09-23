import React from 'react';
import { Logo } from './Logo';
import { UserRole } from '../types';
import { Sparkles, GraduationCap, Briefcase, Bell, UserRound } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeCardsCount: number;
  onOpenAiCreator?: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfiles: () => void;
  profileName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeCardsCount,
  onOpenAiCreator,
  unreadCount,
  onOpenNotifications,
  onOpenProfiles,
  profileName,
}) => {
  return (
    <header className="min-h-16 px-3 py-2 sm:px-5 border-b border-white/[0.08] bg-[#14151B]/90 backdrop-blur-md flex flex-wrap gap-2 items-center justify-between z-30 sticky top-0">
      {/* Top Left: Logo & Subtitle */}
      <div className="flex items-center gap-6">
        <Logo size="md" />

        {/* Subtitle from the user's sketch/mockup */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-neutral-300">
            Демо-профили без паролей → 2 режима
          </span>
          <span className="text-orange-400/90 font-medium">
            ({currentRole === 'student' ? 'Режим: Студент' : 'Режим: Бизнес'})
          </span>
        </div>
      </div>

      {/* Right Controls: Role Switcher & Action */}
      <div className="flex items-center gap-2 flex-wrap">
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
            aria-label="Создать Карту + ИИ"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-neutral-950" />
            <span className="hidden sm:inline">Создать Карту + ИИ</span>
          </button>
        )}

        {/* Notifications / Live status icon */}
        <button onClick={onOpenProfiles} aria-label={`Профили: ${profileName}`} title="Создать, выбрать или редактировать профиль" className="flex items-center gap-2 h-9 px-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.08]">
          <UserRound className="w-4 h-4" /><span className="hidden xl:inline text-xs max-w-28 truncate">{profileName}</span>
        </button>
        <div className="relative">
          <button
            onClick={onOpenNotifications}
            aria-label={`Уведомления: ${unreadCount} непрочитанных`}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Уведомления платформы"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold flex items-center justify-center ring-2 ring-[#14151B]">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
