import React from 'react';
import { TaskCard } from '../types';
import { BrandLogo } from './BrandLogos';
import { AiReadinessScoreIndicator } from './AiReadinessScoreIndicator';
import {
  X,
  Clock,
  Coins,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface TaskDetailsModalProps {
  card: TaskCard | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (card: TaskCard) => void;
  onToggleSave: (cardId: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  card,
  isOpen,
  onClose,
  onApply,
  onToggleSave,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#161720] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Top decorative stripe with company color */}
        <div
          className="h-2.5 w-full"
          style={{ backgroundColor: card.brandColor }}
        />

        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] bg-[#191B24] flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo type={card.logoType} company={card.company} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  {card.company}
                </span>
                {card.aiGenerated && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                    <Sparkles className="w-3 h-3" />
                    AI ТЗ
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-amber-300 mt-1">
                {card.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(card.id)}
              className={`p-2 rounded-xl border transition-all ${
                card.saved
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-white/[0.04] border-white/[0.08] text-neutral-400 hover:text-white'
              }`}
              title="Сохранить"
            >
              <Bookmark className={`w-5 h-5 ${card.saved ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: All 7 hackathon fields + Dynamic AI Readiness Score */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Dynamic AI Readiness Score Indicator (Detailed view with red-to-bright-orange color coding) */}
          <AiReadinessScoreIndicator card={card} variant="detailed" />

          {/* Key Quick Info Row: Reward & Deadline */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-neutral-400">Награда за решение:</span>
              <span className="font-bold text-white">{card.reward || 'Не указана'}</span>
            </div>
            <div className="flex items-center gap-2 text-red-300">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-neutral-400">Срок сдачи:</span>
              <span className="font-bold text-white">{card.deadlineText}</span>
            </div>
          </div>

          {/* 1. Context and Need (20 pts) */}
          <div className="p-4 rounded-2xl bg-[#181A24] border border-white/[0.06]">
            <h4 className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">
              1. Контекст и потребность бизнеса (макс. 20 б.)
            </h4>
            <p className="text-xs text-neutral-200 leading-relaxed">
              {card.context || card.shortSummary}
            </p>
          </div>

          {/* 2. Data and Materials (20 pts) */}
          <div className="p-4 rounded-2xl bg-[#181A24] border border-white/[0.06]">
            <h4 className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">
              2. Предоставляемые данные, примеры и материалы (макс. 20 б.)
            </h4>
            <p className="text-xs text-neutral-200 leading-relaxed">
              {card.dataAndMaterials || 'Не указано'}
            </p>
          </div>

          {/* 3 & 4. Expected Result (15 pts) and Success Criteria (15 pts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#181A24] border border-white/[0.06]">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">
                3. Ожидаемый результат (макс. 15 б.)
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {card.expectedResult || 'Не указано'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#181A24] border border-white/[0.06]">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">
                4. Критерии успеха и приёмки (макс. 15 б.)
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {card.successCriteria || 'Не указано'}
              </p>
            </div>
          </div>

          {/* 5, 6, 7: Constraints, Target Users, Business Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block mb-1">
                5. Ограничения и стек (10 б.)
              </span>
              <p className="text-neutral-200 font-medium">
                {card.constraints || 'Не указано'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block mb-1">
                6. Пользователи решения (10 б.)
              </span>
              <p className="text-neutral-200 font-medium">
                {card.targetUsers || 'Не указано'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block mb-1">
                7. Куратор от бизнеса (10 б.)
              </span>
              <p className="text-amber-300 font-mono font-medium">
                {card.businessContact || 'Не указано'}
              </p>
            </div>
          </div>

          {/* Tech tags */}
          <div>
            <span className="text-[10px] text-neutral-400 font-mono uppercase block mb-1.5">
              Стек технологий:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-mono text-neutral-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Apply action */}
        <div className="p-5 px-6 border-t border-white/[0.08] bg-[#191B24] flex items-center justify-between">
          <div className="text-xs text-neutral-400 font-mono">
            Опубликовано: {card.datePosted}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Закрыть
            </button>

            {card.hasApplied ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Предложение подано</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onApply(card);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-neutral-950 font-bold text-xs shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <span>Подать предложение команды</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
