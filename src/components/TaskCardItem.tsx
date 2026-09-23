import React from 'react';
import { TaskCard } from '../types';
import { BrandLogo } from './BrandLogos';
import { AiReadinessScoreIndicator, getReadinessColorData } from './AiReadinessScoreIndicator';
import {
  Clock,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Flame,
  Coins,
  Sparkles,
} from 'lucide-react';

interface TaskCardItemProps {
  card: TaskCard;
  onApply: (card: TaskCard) => void;
  onToggleSave: (cardId: string) => void;
  onViewDetails: (card: TaskCard) => void;
}

export const TaskCardItem: React.FC<TaskCardItemProps> = ({
  card,
  onApply,
  onToggleSave,
  onViewDetails,
}) => {
  // Determine deadline badge urgency style
  const getDeadlineBadge = () => {
    if (card.deadlineDays <= 2) {
      return {
        bg: 'bg-red-500/10 border-red-500/30 text-red-300',
        dot: 'bg-red-400 animate-ping',
        icon: <Flame className="w-3.5 h-3.5 text-red-400" />,
        label: `Дедлайн: ${card.deadlineText}`,
      };
    }
    if (card.deadlineDays <= 5) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        dot: 'bg-amber-400',
        icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
        label: `Дедлайн: ${card.deadlineText}`,
      };
    }
    return {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      dot: 'bg-emerald-400',
      icon: <Clock className="w-3.5 h-3.5 text-emerald-400" />,
      label: `Дедлайн: ${card.deadlineText}`,
    };
  };

  const deadlineBadge = getDeadlineBadge();
  const colorData = getReadinessColorData(card.readinessScore || 0);

  return (
    <div
      onClick={() => onViewDetails(card)}
      className="group relative rounded-2xl bg-[#191A22] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer flex flex-col justify-between"
      style={{
        boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.5)`,
      }}
    >
      {/* Left colored vertical strip representing company brand color */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all duration-300 group-hover:w-2"
        style={{
          backgroundColor: card.brandColor,
          boxShadow: `0 0 12px ${card.brandColor}`,
        }}
      />

      {/* Card Content Container */}
      <div className="p-5 pl-7 flex-1 flex flex-col">
        {/* Top Header: Business Logo + Business Name + AI Readiness Score Chip + Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <BrandLogo
              type={card.logoType}
              company={card.company}
              size="md"
              className="group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  {card.company}
                </h3>
                {card.aiGenerated && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI ТЗ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                {card.datePosted} • {card.applicantsCount} откликов
              </p>
            </div>
          </div>

          {/* Top Right: Compact Score Tag & Bookmark Button */}
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dynamic AI Readiness Score pill (Red to Bright Orange) */}
            <div
              className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full border transition-all"
              style={{
                backgroundColor: colorData.dynamicBg,
                borderColor: colorData.dynamicBorder,
                color: colorData.dynamicColor,
              }}
              title={`AI Readiness Score: ${card.readinessScore || 0}/100 • ${colorData.label}`}
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>{card.readinessScore || 0} б.</span>
            </div>

            <button
              onClick={() => onToggleSave(card.id)}
              className={`p-1.5 rounded-lg border transition-all ${
                card.saved
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
              }`}
              title={card.saved ? 'Удалить из сохраненных' : 'Сохранить задачу'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${card.saved ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Task Title & Description Block */}
        <div className="mb-3">
          <div className="text-xs uppercase font-mono tracking-wider text-amber-400/90 font-bold mb-1">
            {card.title}
          </div>
          <p className="text-sm font-semibold text-neutral-200 leading-snug line-clamp-2">
            {card.shortSummary || card.context}
          </p>
        </div>

        {/* Dynamic AI Readiness Score Indicator inside task card */}
        <div className="mb-3.5">
          <AiReadinessScoreIndicator card={card} variant="card" />
        </div>

        {/* Tech Stack Chips & Reward */}
        <div className="mt-auto space-y-2.5 pt-1">
          {/* Tech tags */}
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.06] text-neutral-300"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.03] text-neutral-400">
                +{card.tags.length - 3}
              </span>
            )}
          </div>

          {/* Reward pill */}
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">{card.reward}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Deadline Indicator + Apply Button in right corner */}
      <div className="px-5 pl-7 py-3 bg-[#14151D] border-t border-white/[0.06] flex items-center justify-between gap-3">
        {/* Deadline Indicator with status badge & pulse */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${deadlineBadge.bg}`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${deadlineBadge.dot}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${deadlineBadge.dot.replace('animate-ping', '')}`} />
          </span>
          {deadlineBadge.icon}
          <span>{deadlineBadge.label}</span>
        </div>

        {/* Prominent Apply Button */}
        <div onClick={(e) => e.stopPropagation()}>
          {card.hasApplied ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Предложение отправлено</span>
            </div>
          ) : (
            <button
              onClick={() => onApply(card)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-neutral-950 text-xs font-bold shadow-md shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Подать предложение</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
