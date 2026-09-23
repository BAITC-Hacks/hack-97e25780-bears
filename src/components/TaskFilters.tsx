import React from 'react';
import { TaskCategory, ReadinessLevel } from '../types';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  Gamepad2,
  Bot,
  Globe,
  Palette,
  BarChart,
  Layers,
  X,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: TaskCategory;
  onCategoryChange: (category: TaskCategory) => void;
  selectedReadinessLevel: ReadinessLevel | 'all';
  onReadinessLevelChange: (level: ReadinessLevel | 'all') => void;
  sortBy: 'rating' | 'deadline' | 'newest';
  onSortByChange: (sort: 'rating' | 'deadline' | 'newest') => void;
  totalCardsCount: number;
  filteredCount: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedReadinessLevel,
  onReadinessLevelChange,
  sortBy,
  onSortByChange,
  totalCardsCount,
  filteredCount,
}) => {
  const categories: { id: TaskCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Все темы', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'ИИ & ML', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'gamedev', label: 'Геймдев & 3D', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'bots', label: 'Боты & TMA', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'web', label: 'Web & Mobile', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Финтех & Аналитика', icon: <BarChart className="w-3.5 h-3.5" /> },
  ];

  const readinessLevels: {
    id: ReadinessLevel | 'all';
    label: string;
    icon: React.ReactNode;
    color: string;
    activeClass: string;
  }[] = [
    {
      id: 'all',
      label: 'Все уровни',
      icon: <Layers className="w-3.5 h-3.5" />,
      color: 'text-neutral-300',
      activeClass: 'bg-white/10 text-white border-white/20',
    },
    {
      id: 'priority',
      label: '🌟 Приоритетные (90-100 б.)',
      icon: <Award className="w-3.5 h-3.5" />,
      color: 'text-[#FF6A00]',
      activeClass: 'bg-[#FF6A00]/20 text-[#FFA040] border-[#FF6A00]/50 shadow-[0_0_12px_rgba(255,106,0,0.3)]',
    },
    {
      id: 'ready',
      label: '⚡ Готовые (70-89 б.)',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      color: 'text-[#FB923C]',
      activeClass: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
    },
    {
      id: 'working',
      label: '🔹 Рабочие (40-69 б.)',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: 'text-[#F97316]',
      activeClass: 'bg-orange-600/20 text-orange-300 border-orange-600/40',
    },
    {
      id: 'draft',
      label: '⚠️ Черновики (0-39 б.)',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-[#EF4444]',
      activeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
  ];

  return (
    <div className="space-y-3.5 bg-[#14151B] p-4 rounded-2xl border border-white/[0.08] shadow-lg mb-6">
      {/* Top Search Input Bar with Sorting & Count */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по теме, компании, требованиям (NVIDIA, PyTorch, C++, Telegram, Docker)..."
            className="w-full bg-[#1A1C24] text-sm text-neutral-100 placeholder-neutral-500 pl-10 pr-9 py-2.5 rounded-xl border border-white/[0.08] focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector & Counter */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#1A1C24] px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-mono text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="rating" className="bg-[#1A1C24]">По рейтингу готовности (ТЗ)</option>
              <option value="deadline" className="bg-[#1A1C24]">По срочности дедлайна</option>
              <option value="newest" className="bg-[#1A1C24]">Сначала новые</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-400 flex-shrink-0">
            <span>В каталоге:</span>
            <span className="text-amber-400 font-bold">{filteredCount}</span>
            <span className="text-neutral-600">/</span>
            <span>{totalCardsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Row 1: Readiness Level Pills (Hackathon Gamification) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-neutral-500 font-mono uppercase text-[10px] tracking-wider pl-1 flex-shrink-0">
          Уровень готовности:
        </span>
        {readinessLevels.map((lvl) => {
          const isActive = selectedReadinessLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              onClick={() => onReadinessLevelChange(lvl.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? `${lvl.activeClass} shadow-sm font-semibold`
                  : 'bg-white/[0.03] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] border-transparent'
              }`}
            >
              <span>{lvl.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Row 2: Topic / Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-white/[0.04] pt-2.5">
        <span className="text-neutral-500 font-mono uppercase text-[10px] tracking-wider pl-1 flex-shrink-0">
          Тематика:
        </span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
