import React, { useState } from 'react';
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
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <aside
      className={`h-[calc(100vh-4rem)] bg-[#13141A] border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 select-none z-20 flex-shrink-0 ${
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold font-mono">
                      +3 новых
                    </span>
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

      {/* Bottom Left Profile Block (Exact requirement: non-editable view-only display) */}
      {/* "Убери возможность редактировать профиль. Нам просто нужно показать что он будет, но проваливаться и редактировать пока не надо." */}
      <div className="p-3 border-t border-white/[0.08] bg-[#111216]">
        {currentRole === 'student' ? (
          <div
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] select-none"
          >
            {/* Student Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={studentProfile.avatar}
                alt={studentProfile.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/40 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#111216]" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white truncate">
                    {studentProfile.name}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400 font-mono">
                    Студент
                  </span>
                </div>

                {/* ID with copy button */}
                <div
                  onClick={(e) => handleCopyId(studentProfile.id, e)}
                  className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono mt-0.5 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Нажмите, чтобы скопировать ID"
                >
                  <span className="text-neutral-500">ID:</span>
                  <span className="text-orange-300/90 font-bold">[{studentProfile.id}]</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-500 hover:text-neutral-300" />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Business Representative Profile */
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 select-none">
            <div className="relative flex-shrink-0">
              <img
                src={businessProfile.avatar}
                alt={businessProfile.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/50 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#111216]" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white truncate">
                    {businessProfile.name}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 font-mono">
                    Бизнес
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 truncate">
                  {businessProfile.company}
                </div>
                <div
                  onClick={(e) => handleCopyId(businessProfile.id, e)}
                  className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono mt-0.5 hover:text-amber-400 cursor-pointer"
                  title="Скопировать ID бизнеса"
                >
                  <span className="text-neutral-500">ID:</span>
                  <span className="text-amber-300 font-bold">[{businessProfile.id}]</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-500" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
