import React, { useState } from 'react';
import { ProfileAvatar } from './ProfileAvatar';
import { UserRole, StudentProfile, BusinessProfile } from '../types';
import {
  Layers,
  Users,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  studentProfile: StudentProfile;
  businessProfile: BusinessProfile;
  onOpenAiCreator?: () => void;
  savedCount: number;
  appliedCount: number;
  onOpenProfiles: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  studentProfile,
  businessProfile,
  onOpenAiCreator,
  savedCount,
  appliedCount,
  onOpenProfiles,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const profile = currentRole === 'student' ? studentProfile : businessProfile;

  return (
    <aside
      className={`h-[calc(100vh-4rem)] bg-[#13141A] border-r border-white/[0.08] hidden md:flex flex-col justify-between transition-all duration-300 select-none z-20 flex-shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Navigation Items */}
      <div className="p-3">
        {/* Navigation label & collapse toggle */}
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-neutral-400 mb-2">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400/80" />
              <span className="uppercase tracking-wider font-mono text-[11px] text-neutral-400">
                Навигация
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-colors ml-auto"
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {currentRole === 'student' ? (
            <>
              {/* Карты */}
              <button
                onClick={() => onTabChange('cards')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'cards'
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-amber-300 border border-orange-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Карты"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'cards'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Карты</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-neutral-400 font-mono">
                      Feed
                    </span>
                  </div>
                )}
              </button>

              {/* Команда */}
              <button
                onClick={() => onTabChange('team')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'team'
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-amber-300 border border-orange-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Команда"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'team'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Команда</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                      Поиск
                    </span>
                  </div>
                )}
              </button>

              {/* Мои отклики */}
              <button
                onClick={() => onTabChange('applied')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'applied'
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-amber-300 border border-orange-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Мои отклики"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'applied'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Мои отклики</span>
                    {appliedCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                        {appliedCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Избранное */}
              <button
                onClick={() => onTabChange('saved')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'saved'
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-amber-300 border border-orange-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Сохраненные"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'saved'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Сохраненные</span>
                    {savedCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 font-mono">
                        {savedCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Business Navigation Tabs */}
              <button
                onClick={() => onTabChange('cards')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'cards'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Мои Карты (Задачи)"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'cards'
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-neutral-950 shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                {!collapsed && <span>Мои Карты</span>}
              </button>

              <button
                onClick={() => onTabChange('applicants')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'applicants'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Отклики студентов"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'applicants'
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-neutral-950 shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Отклики студентов</span>
                  </div>
                )}
              </button>

              <button
                onClick={() => onOpenAiCreator && onOpenAiCreator()}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all group"
                title="Создать Карту с ИИ"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>ИИ-Ассистент ТЗ</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 font-bold uppercase">
                      AI
                    </span>
                  </div>
                )}
              </button>

              <button
                onClick={() => onTabChange('analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                title="Аналитика кейсов"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTab === 'analytics'
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-neutral-950 shadow-sm'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                {!collapsed && <span>Аналитика</span>}
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-white/[0.08] bg-[#111216]">
        <button onClick={onOpenProfiles} aria-label={`Профили: ${profile.name}`} title="Создать, выбрать или редактировать профиль" className="flex items-center gap-3 w-full p-2.5 text-left rounded-2xl bg-white/[0.03] border border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-500/5 transition-colors">
          <ProfileAvatar name={profile.name} />
          {!collapsed && <span className="flex-1 min-w-0">
            <span className="block text-xs font-semibold text-white truncate">{profile.name}</span>
            <span className="block text-[10px] text-neutral-400 truncate">{currentRole === 'business' ? businessProfile.company : studentProfile.teamName}</span>
            <span className="block text-[10px] text-amber-300 mt-1">Выбрать / изменить профиль</span>
          </span>}
        </button>
      </div>
    </aside>
  );
};
