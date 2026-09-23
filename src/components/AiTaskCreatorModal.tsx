import React, { useState } from 'react';
import { TaskCard, TaskCategory } from '../types';
import { BrandLogo } from './BrandLogos';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  Clock,
  Coins,
  Bot,
  Wand2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AiTaskCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishCard: (newCard: TaskCard) => void;
}

export const AiTaskCreatorModal: React.FC<AiTaskCreatorModalProps> = ({
  isOpen,
  onClose,
  onPublishCard,
}) => {
  const [companyName, setCompanyName] = useState('NVIDIA Innovation Hub');
  const [brandColor, setBrandColor] = useState('#10B981');
  const [roughDescription, setRoughDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('ai');
  const [targetLevel, setTargetLevel] = useState('Junior+ / Middle');
  const [budgetSuggestion, setBudgetSuggestion] = useState('85 000 ₽ + Fast-track');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<any | null>(null);
  const [aiStepNotice, setAiStepNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Refine chat input
  const [refinePrompt, setRefinePrompt] = useState('');

  if (!isOpen) return null;

  // Preset templates for quick testing
  const presets = [
    {
      company: 'NVIDIA',
      color: '#10B981',
      cat: 'ai' as TaskCategory,
      text: 'Нужна легковесная нейросеть для умной сортировки карточек задач по профилю студента, чтобы быстро считала скор на GPU и выдавала рекомендации.',
      budget: '90 000 ₽ + оффер'
    },
    {
      company: 'Яндекс Go',
      color: '#EF4444',
      cat: 'web' as TaskCategory,
      text: 'Хотим виджет интерактивной карты с отображением курьеров и анимацией маршрута на WebGL/Canvas с поддержкой 60 FPS на смартфонах.',
      budget: '75 000 ₽ + мерч'
    },
    {
      company: 'Telegram Lab',
      color: '#38BDF8',
      cat: 'bots' as TaskCategory,
      text: 'Требуется Telegram бот и Mini App на React для проведения викторин и выдачи карточек достижений студентам с защитой от накрутки.',
      budget: '80 000 ₽ + Stars'
    }
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setCompanyName(preset.company);
    setBrandColor(preset.color);
    setCategory(preset.cat);
    setRoughDescription(preset.text);
    setBudgetSuggestion(preset.budget);
  };

  const handleGenerateAiTask = async () => {
    if (!roughDescription.trim()) {
      setErrorMsg('Пожалуйста, напишите хотя бы пару предложений о вашей задаче');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);
    setAiStepNotice('ИИ-Агент анализирует бизнес-требования...');

    const stepInterval = setTimeout(() => {
      setAiStepNotice('Формирование критериев приемки и ТЗ для студентов...');
    }, 1200);

    const stepInterval2 = setTimeout(() => {
      setAiStepNotice('Калибровка стека технологий и оценка сроков...');
    }, 2400);

    try {
      const response = await fetch('/api/ai/optimize-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughDescription,
          companyName,
          category,
          targetLevel,
          budgetSuggestion
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось связаться с сервером ИИ');
      }

      const data = await response.json();
      if (data.success && data.card) {
        setGeneratedCard(data.card);
      } else {
        throw new Error(data.error || 'Ошибка генерации');
      }
    } catch (err: any) {
      console.warn('API error, using robust fallback optimizer:', err);
      // Client-side fallback so it never fails
      const fallback = {
        title: roughDescription.slice(0, 35) + '...',
        shortSummary: `${companyName}: ${roughDescription.trim()}`,
        fullDescription: `Компания ${companyName} открывает студенческий кейс по направлению "${roughDescription}". Цель — создать чистый, масштабируемый прототип и презентовать его технической команде.`,
        deliverables: [
          'Репозиторий с исходным кодом и тестами',
          'Развернутое демо (Cloud / Docker)',
          'Архитектурная записка и инструкция по запуску'
        ],
        requirements: [
          'Знание стека и аккуратный код',
          'Соблюдение сроков выполнения',
          'Умение аргументировать технические решения'
        ],
        tags: ['FastAPI', 'Docker', 'TypeScript', 'Clean Code'],
        recommendedDeadlineDays: 7,
        recommendedReward: budgetSuggestion || '80 000 ₽ + Fast-track',
        aiAdvice: 'ИИ-Агент рекомендует приложить к задаче тестовые данные или моковые API для быстрого старта студентов.'
      };
      setGeneratedCard(fallback);
    } finally {
      clearTimeout(stepInterval);
      clearTimeout(stepInterval2);
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedCard) return;

    const newCard: TaskCard = {
      id: `card-${Date.now()}`,
      company: companyName,
      brandColor: brandColor,
      accentGlow: `${brandColor}33`,
      logoType: (['nvidia', 'sony', 'discord', 'telegram', 'yandex'].includes(companyName.toLowerCase())
        ? companyName.toLowerCase()
        : 'custom') as any,
      title: generatedCard.title,
      shortSummary: generatedCard.shortSummary || generatedCard.title,
      context: generatedCard.fullDescription || generatedCard.shortSummary || '',
      dataAndMaterials: 'Предоставляется куратором проекта',
      expectedResult: generatedCard.deliverables?.join('; ') || 'Рабочий прототип',
      successCriteria: generatedCard.requirements?.join('; ') || 'Прохождение приемочных тестов',
      constraints: 'Срок: 14 дней. Python / Docker',
      targetUsers: 'Студенты и сотрудники',
      businessContact: 'Куратор (@tech_lead)',
      readinessScore: 85,
      readinessLevel: 'ready',
      category: category,
      urgency: generatedCard.recommendedDeadlineDays <= 3 ? 'urgent' : generatedCard.recommendedDeadlineDays <= 7 ? 'medium' : 'normal',
      deadlineDays: generatedCard.recommendedDeadlineDays || 7,
      deadlineText: `${generatedCard.recommendedDeadlineDays || 7} дней`,
      reward: generatedCard.recommendedReward || budgetSuggestion || '75 000 ₽',
      tags: generatedCard.tags || ['MVP', 'IT', 'Code'],
      applicantsCount: 0,
      saved: false,
      hasApplied: false,
      datePosted: 'Только что',
      aiGenerated: true,
    };

    onPublishCard(newCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#15161E] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-[#181922] to-orange-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-950 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  ИИ-Ассистент создания задач и ТЗ
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  SC.ai Agent
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Превратите сырую идею в структурированную карточку StartCard за пару секунд
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Business Input & Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                1. Название компании или продукта
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., NVIDIA, Yandex, Сбер, Startup"
                  className="flex-1 bg-[#1E202B] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.1] focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-11 h-11 p-1 bg-[#1E202B] rounded-xl border border-white/[0.1] cursor-pointer"
                  title="Основной цвет полоски карточки"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] text-neutral-400 font-mono">Быстрые примеры:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-amber-400/15 text-neutral-300 hover:text-amber-300 border border-white/[0.06] transition-colors"
                  >
                    {p.company} • {p.cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rough Description */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                2. Сырое описание задачи (своими словами)
              </label>
              <textarea
                rows={4}
                value={roughDescription}
                onChange={(e) => setRoughDescription(e.target.value)}
                placeholder="Опишите в свободной форме, что нужно сделать. Например: 'Хотим телеграм-бота для студентов, чтобы они отправляли домашки и получали фидбек нейросети. На питоне, дедлайн 10 дней...'"
                className="w-full bg-[#1E202B] text-sm text-white p-3.5 rounded-xl border border-white/[0.1] focus:border-amber-400 focus:outline-none placeholder-neutral-500 leading-relaxed font-sans resize-none"
              />
            </div>

            {/* Category & Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                  Категория
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-[#1E202B] text-xs text-white p-2.5 rounded-xl border border-white/[0.1] focus:outline-none"
                >
                  <option value="ai">ИИ & ML</option>
                  <option value="gamedev">Геймдев & 3D</option>
                  <option value="bots">Боты & TMA</option>
                  <option value="web">Web & Mobile</option>
                  <option value="analytics">Финтех & Аналитика</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1 font-mono">
                  Вознаграждение
                </label>
                <input
                  type="text"
                  value={budgetSuggestion}
                  onChange={(e) => setBudgetSuggestion(e.target.value)}
                  placeholder="85 000 ₽ + оффер"
                  className="w-full bg-[#1E202B] text-xs text-white p-2.5 rounded-xl border border-white/[0.1] focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateAiTask}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-neutral-950 font-bold text-sm shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ИИ формирует структурированное ТЗ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-neutral-950" />
                  <span>✨ Сформировать четкое ТЗ с ИИ</span>
                </>
              )}
            </button>

            {isGenerating && (
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-300 font-mono text-center animate-pulse">
                {aiStepNotice}
              </div>
            )}
          </div>

          {/* Right Column: AI Structured Result & Live Card Preview */}
          <div className="space-y-4 flex flex-col justify-between">
            {generatedCard ? (
              <div className="space-y-3.5 bg-[#1B1D26] p-4 rounded-2xl border border-amber-500/30 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Результат ИИ-обработки ТЗ
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Готово к публикации
                  </span>
                </div>

                {/* Structured Fields */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-400 font-mono">Название:</span>
                    <p className="font-bold text-white text-sm mt-0.5">{generatedCard.title}</p>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-mono">Краткое описание (для карточки):</span>
                    <p className="text-neutral-200 mt-0.5 leading-relaxed bg-[#14151D] p-2.5 rounded-lg border border-white/[0.05]">
                      {generatedCard.shortSummary}
                    </p>
                  </div>

                  {/* Deliverables / ТЗ по пунктам */}
                  {generatedCard.deliverables && (
                    <div>
                      <span className="text-amber-400/90 font-mono font-semibold">Ожидаемый результат (ТЗ):</span>
                      <ul className="mt-1 space-y-1">
                        {generatedCard.deliverables.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-neutral-300">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Advice badge */}
                  {generatedCard.aiAdvice && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Совет ИИ-агента бизнесу: </span>
                        <span>{generatedCard.aiAdvice}</span>
                      </div>
                    </div>
                  )}

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {generatedCard.tags?.map((t: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 text-[10px] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Publish Action Button */}
                <div className="pt-3 border-t border-white/[0.08]">
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
                  >
                    <span>Опубликовать в общую ленту</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01] text-center text-neutral-400">
                <Wand2 className="w-10 h-10 text-amber-400/50 mb-3 animate-bounce" />
                <h4 className="text-sm font-bold text-white mb-1">
                  Предпросмотр появится здесь
                </h4>
                <p className="text-xs max-w-xs text-neutral-500">
                  Заполните черновик задачи слева или выберите один из быстрых примеров и нажмите кнопку генерации ТЗ
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
