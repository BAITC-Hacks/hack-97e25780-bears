import React, { useEffect, useState } from 'react';
import { ProfileAvatar } from './ProfileAvatar';
import { TaskCard, TeamProposal, BusinessProfile } from '../types';
import { TaskCardItem } from './TaskCardItem';
import {
  Sparkles,
  Plus,
  Users,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Github,
  Award,
  TrendingUp,
  XCircle,
  FileCode,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface BusinessDashboardProps {
  businessProfile: BusinessProfile;
  cards: TaskCard[];
  proposals: TeamProposal[];
  activeTab: string;
  onOpenConstructor: () => void;
  onAcceptProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  pendingSelections?: string[];
  onViewCardDetails: (card: TaskCard) => void;
  focusedProposalId?: string | null;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  businessProfile,
  cards,
  proposals,
  activeTab,
  onOpenConstructor,
  onAcceptProposal,
  onRejectProposal,
  pendingSelections = [],
  onViewCardDetails,
  focusedProposalId,
}) => {
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('all');
  useEffect(() => {
    if (focusedProposalId) setSelectedCardFilter('all');
  }, [focusedProposalId]);
  useEffect(() => {
    if (focusedProposalId && activeTab === 'applicants' && selectedCardFilter === 'all') {
      document.getElementById(`proposal-${focusedProposalId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [focusedProposalId, activeTab, selectedCardFilter]);

  const filteredProposals =
    selectedCardFilter === 'all'
      ? proposals
      : proposals.filter((p) => p.cardId === selectedCardFilter);

  const avgReadiness = Math.round(
    cards.reduce((acc, c) => acc + (c.readinessScore || 0), 0) / (cards.length || 1)
  );

  const acceptedCount = proposals.filter((p) => p.status === 'accepted').length;

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner for Business */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171822] via-[#1B1D29] to-[#251E13] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                STARTCARD BUSINESS
              </span>
              <span className="text-xs text-neutral-400">
                {businessProfile.company} • ID [{businessProfile.id}]
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Кабинет Бизнеса: Качество задач & Выбор команд
            </h1>
            <p className="text-xs text-neutral-300 max-w-2xl mt-1 leading-relaxed">
              Сквозной сценарий хакатона AI Sana: опишите черновик задачи, пройдите уточнение через ИИ-Агента (≥3 вопроса), получите карточку с рейтингом до 100 баллов и выберите лучшую студенческую команду вручную.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenConstructor}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-neutral-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-neutral-950" />
              <span>Создать задачу (Сквозной сценарий)</span>
            </button>
          </div>
        </div>

        {/* Gamification KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Опубликовано задач
            </span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {cards.length}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Ср. рейтинг готовности
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
              <span>{avgReadiness} / 100</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Предложений команд
            </span>
            <div className="text-xl font-extrabold text-blue-400 mt-0.5">
              {proposals.length}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">
              Команд принято в работу
            </span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>{acceptedCount}</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs View */}
      {activeTab === 'applicants' ? (
        /* Team Proposals Review & Manual Choice (Step 7 of Hackathon Spec) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Предложения студенческих команд ({filteredProposals.length})</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ручной выбор бизнеса в текущем MVP
              </p>
            </div>

            {/* Filter by Card */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">Фильтр по задаче:</span>
              <select
                value={selectedCardFilter}
                onChange={(e) => setSelectedCardFilter(e.target.value)}
                className="bg-[#1C1E28] text-xs text-white px-3 py-1.5 rounded-xl border border-white/[0.1] focus:outline-none"
              >
                <option value="all">Все задачи</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company}: {c.title.slice(0, 25)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredProposals.map((prop) => (
              <div
                key={prop.id}
                id={`proposal-${prop.id}`}
                className={`p-5 rounded-2xl bg-[#181A24] border hover:border-amber-400/30 transition-all shadow-md space-y-3 ${focusedProposalId === prop.id ? 'border-amber-400/60' : 'border-white/[0.08]'}`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar name={prop.leaderName} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-white">
                          Команда «{prop.teamName}»
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                          (Тимлид: {prop.leaderName} ID: [{prop.studentId}])
                        </span>
                        {prop.status === 'accepted' && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            ✓ Выбрана бизнесом
                          </span>
                        )}
                        {prop.status === 'rejected' && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            Отклонено
                          </span>
                        )}
                        {prop.status === 'pending' && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Ожидает решения бизнеса
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-400/90 font-mono mt-0.5">
                        Кейс: {prop.cardTitle} ({prop.companyName})
                      </p>
                    </div>
                  </div>

                  {/* Manual Choice Buttons for Business */}
                  <div className="flex items-center gap-2">
                    {prop.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => onRejectProposal(prop.id)}
                          disabled={pendingSelections.includes(prop.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold transition-colors"
                        >
                          Отклонить
                        </button>
                        <button
                          onClick={() => onAcceptProposal(prop.id)}
                          disabled={pendingSelections.includes(prop.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-neutral-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{pendingSelections.includes(prop.id) ? 'Сохраняем…' : 'Выбрать команду'}</span>
                        </button>
                      </>
                    ) : prop.status === 'accepted' ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Команда выбрана к выполнению этапа</span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 font-mono">
                        Предложение отклонено
                      </span>
                    )}
                  </div>
                </div>

                {/* Proposal content: Solution idea & plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold block mb-1">
                      1. Идея решения:
                    </span>
                    <p className="text-neutral-200 leading-relaxed">
                      {prop.solutionIdea}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold block mb-1">
                      2. План работы и дедлайн:
                    </span>
                    <p className="text-neutral-200 leading-relaxed whitespace-pre-line">
                      {prop.workPlan}
                    </p>
                    <div className="mt-2 text-[11px] text-neutral-400 font-mono">
                      Срок: <strong className="text-white">{prop.proposedDeadline}</strong>
                    </div>
                  </div>
                </div>

                {/* Prototype link & Telegram */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-neutral-400 border-t border-white/[0.04]">
                  <div className="flex items-center gap-4">
                    {prop.prototypeLink && <a
                      href={prop.prototypeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>{prop.prototypeLink}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>}

                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{prop.telegram}</span>
                    </span>
                  </div>

                  <span>Подано: {prop.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Default: Business Cards Feed & Manager */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <span>Задачи компании в каталоге ({cards.length})</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Задачи ранжируются по рейтингу готовности ТЗ
              </p>
            </div>

            <button
              onClick={onOpenConstructor}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Создать задачу через ИИ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => (
              <TaskCardItem
                key={card.id}
                studentActions={false}
                card={card}
                onApply={() => {}}
                onToggleSave={() => {}}
                onViewDetails={onViewCardDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
