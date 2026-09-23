import React from 'react';
import { Sparkles, AlertCircle, CheckCircle, Award, ShieldAlert, ShieldCheck } from 'lucide-react';
import { TaskCard } from '../types';

interface AiReadinessScoreIndicatorProps {
  card: TaskCard;
  variant?: 'card' | 'detailed' | 'compact';
  className?: string;
}

/**
 * Calculates dynamic color coding from RED (low quality ТЗ) to BRIGHT ORANGE (exceptional ТЗ)
 * strictly adhering to the user requirement: "с цветовой кодировкой (от красного до ярко-оранжевого)".
 */
export function getReadinessColorData(score: number) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // HSL Interpolation from Red (0°) to Bright Vivid Orange (~30-33°)
  // Score 0: hsl(0, 90%, 55%) -> Vivid Red
  // Score 40: hsl(14, 92%, 52%) -> Red-Orange
  // Score 70: hsl(25, 96%, 50%) -> Rich Orange
  // Score 100: hsl(32, 100%, 50%) -> Bright Electric Neon Orange
  const hue = Math.round((clampedScore / 100) * 32);
  const saturation = 88 + Math.round((clampedScore / 100) * 12);
  const lightness = 53 - Math.round((clampedScore / 100) * 3);
  const dynamicColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const dynamicBg = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.14)`;
  const dynamicBorder = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.35)`;
  const dynamicGlow = `0 0 16px hsla(${hue}, ${saturation}%, ${lightness}%, 0.35)`;

  if (clampedScore < 40) {
    return {
      score: clampedScore,
      level: 'draft' as const,
      label: 'Черновик (требует уточнения)',
      shortLabel: 'Низкое качество ТЗ',
      statusText: 'ТЗ не готово к разработке',
      badgeClass: 'bg-red-500/15 text-red-400 border-red-500/35',
      barGradient: 'from-red-600 via-red-500 to-rose-400',
      pillColor: '#EF4444',
      dynamicColor,
      dynamicBg,
      dynamicBorder,
      dynamicGlow,
      icon: AlertCircle,
    };
  }

  if (clampedScore < 70) {
    return {
      score: clampedScore,
      level: 'working' as const,
      label: 'Рабочая задача',
      shortLabel: 'Базовое качество ТЗ',
      statusText: 'Доступно к откликам',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/35',
      barGradient: 'from-red-500 via-orange-500 to-orange-400',
      pillColor: '#F97316',
      dynamicColor,
      dynamicBg,
      dynamicBorder,
      dynamicGlow,
      icon: ShieldAlert,
    };
  }

  if (clampedScore < 90) {
    return {
      score: clampedScore,
      level: 'ready' as const,
      label: 'Готовая задача',
      shortLabel: 'Высокое качество ТЗ',
      statusText: 'Повышенная позиция в каталоге',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/45',
      barGradient: 'from-orange-600 via-orange-500 to-amber-400',
      pillColor: '#FB923C',
      dynamicColor,
      dynamicBg,
      dynamicBorder,
      dynamicGlow,
      icon: ShieldCheck,
    };
  }

  return {
    score: clampedScore,
    level: 'priority' as const,
    label: 'Приоритетная задача',
    shortLabel: 'Эталонное ТЗ (ТОП)',
    statusText: 'Выделена в топе платформы',
    badgeClass: 'bg-gradient-to-r from-orange-500/25 to-amber-500/25 text-orange-100 border-orange-400/60 ring-1 ring-orange-500/30',
    barGradient: 'from-orange-600 via-[#FF5500] to-[#FF9900]',
    pillColor: '#FF6A00',
    dynamicColor,
    dynamicBg,
    dynamicBorder,
    dynamicGlow,
    icon: Award,
  };
}

export const AiReadinessScoreIndicator: React.FC<AiReadinessScoreIndicatorProps> = ({
  card,
  variant = 'card',
  className = '',
}) => {
  const score = card.readinessScore || 0;
  const colorData = getReadinessColorData(score);
  const StatusIcon = colorData.icon;

  // Criteria summary check (7 hackathon criteria)
  const criteriaChecks = [
    { label: 'Контекст', filled: (card.context || '').trim().length > 15 },
    { label: 'Данные', filled: (card.dataAndMaterials || '').trim().length > 10 },
    { label: 'Результат', filled: (card.expectedResult || '').trim().length > 10 },
    { label: 'Критерии', filled: (card.successCriteria || '').trim().length > 10 },
    { label: 'Стек/Сроки', filled: (card.constraints || '').trim().length > 5 },
    { label: 'Аудитория', filled: (card.targetUsers || '').trim().length > 5 },
    { label: 'Куратор', filled: (card.businessContact || '').trim().length > 5 },
  ];

  // Compact badge for header or filters
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all ${className}`}
        style={{
          backgroundColor: colorData.dynamicBg,
          borderColor: colorData.dynamicBorder,
          color: colorData.dynamicColor,
        }}
        title={`AI Readiness Score: ${score}/100 — ${colorData.label}`}
      >
        <Sparkles className="w-3 h-3 animate-pulse" />
        <span>{score} б.</span>
        <span className="text-[10px] opacity-80 uppercase font-sans">({colorData.shortLabel})</span>
      </div>
    );
  }

  // Card Variant: displayed inside every task card in the feed
  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl p-3 border transition-all relative overflow-hidden ${className}`}
        style={{
          backgroundColor: colorData.dynamicBg,
          borderColor: colorData.dynamicBorder,
          boxShadow: score >= 85 ? colorData.dynamicGlow : undefined,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colorData.dynamicColor }}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-neutral-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" style={{ color: colorData.dynamicColor }} />
              AI Readiness Score
            </span>
          </div>

          {/* Numerical Score Pill with dynamic red-to-bright-orange styling */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: colorData.dynamicBorder,
                color: colorData.dynamicColor,
                textShadow: `0 0 10px ${colorData.dynamicColor}`,
              }}
            >
              {score} / 100
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar (Gradient from Red to Bright Orange) */}
        <div className="space-y-1 mb-2">
          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden ring-1 ring-white/10 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${colorData.barGradient}`}
              style={{
                width: `${Math.max(6, Math.min(100, score))}%`,
                boxShadow: `0 0 8px ${colorData.dynamicColor}`,
              }}
            />
          </div>
        </div>

        {/* Status Label & 7 Criteria Micro-Pips */}
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" style={{ color: colorData.dynamicColor }} />
            <span className="font-semibold" style={{ color: colorData.dynamicColor }}>
              {colorData.shortLabel}
            </span>
          </div>

          {/* 7 criteria micro-indicators showing completeness */}
          <div className="flex items-center gap-1" title="7 обязательных критериев ТЗ">
            <span className="text-[9px] text-neutral-400 font-mono mr-0.5">Критерии:</span>
            {criteriaChecks.map((crit, idx) => (
              <span
                key={idx}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: crit.filled ? colorData.dynamicColor : '#4B5563',
                  opacity: crit.filled ? 1 : 0.4,
                }}
                title={`${crit.label}: ${crit.filled ? 'Заполнено' : 'Не заполнено'}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detailed Variant: for TaskDetailsModal & Constructor
  return (
    <div
      className={`rounded-2xl p-5 border transition-all relative overflow-hidden ${className}`}
      style={{
        backgroundColor: colorData.dynamicBg,
        borderColor: colorData.dynamicBorder,
        boxShadow: colorData.dynamicGlow,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold shadow-lg border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderColor: colorData.dynamicBorder,
              color: colorData.dynamicColor,
              boxShadow: `0 0 20px ${colorData.dynamicBg}`,
            }}
          >
            <span className="text-xl leading-none font-mono">{score}</span>
            <span className="text-[9px] uppercase font-mono tracking-wider opacity-80">из 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                Динамический индикатор качества
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: colorData.dynamicBorder,
                  color: colorData.dynamicColor,
                }}
              >
                AI Readiness Score
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <span style={{ color: colorData.dynamicColor }}>{colorData.label}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {colorData.statusText}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="self-start sm:self-auto">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${colorData.badgeClass}`}
          >
            <StatusIcon className="w-4 h-4" />
            <span>{colorData.shortLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
          <span className="text-red-400">0 б. (Черновик)</span>
          <span className="text-orange-400">40 б. (Рабочая)</span>
          <span className="text-orange-300">70 б. (Готовая)</span>
          <span className="text-amber-300 font-bold">90–100 б. (ТОП ТЗ)</span>
        </div>
        <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden ring-1 ring-white/10 p-[2px]">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${colorData.barGradient}`}
            style={{
              width: `${Math.max(5, Math.min(100, score))}%`,
              boxShadow: `0 0 12px ${colorData.dynamicColor}`,
            }}
          />
        </div>
      </div>

      {/* 7 criteria chip grid */}
      <div className="pt-3 border-t border-white/[0.08]">
        <div className="text-[11px] font-mono uppercase text-neutral-400 mb-2">
          Анализ 7 обязательных критериев ТЗ:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {criteriaChecks.map((crit, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl border flex items-center gap-2 text-[11px] transition-colors ${
                crit.filled
                  ? 'bg-white/[0.04] border-white/[0.1] text-neutral-200'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: crit.filled ? colorData.dynamicColor : '#EF4444' }}
              />
              <span className="truncate">{crit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
