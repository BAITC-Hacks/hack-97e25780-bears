import React, { useState, useEffect } from 'react';
import { TaskCard, TaskCategory, ReadinessScoreBreakdown } from '../types';
import { calculateCardReadiness } from '../utils/scoreCalculator';
import {
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wand2,
  FileText,
  ShieldCheck,
  Building2,
  Sliders
} from 'lucide-react';

interface TaskConstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishCard: (newCard: TaskCard) => void;
  defaultCompany?: string;
}

export const TaskConstructorModal: React.FC<TaskConstructorModalProps> = ({
  isOpen,
  onClose,
  onPublishCard,
  defaultCompany = 'NVIDIA Innovation Hub',
}) => {
  // Step in the 8-step hackathon pipeline: 1 = Draft, 2 = Clarifying Questions, 3 = Editable Card & Rating
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [company, setCompany] = useState(defaultCompany);
  const [brandColor, setBrandColor] = useState('#10B981');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<TaskCategory>('ai');

  // Questions State
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<
    { id: string; category: string; question: string; placeholder: string }[]
  >([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Generated & Editable Card State
  const [isBuildingCard, setIsBuildingCard] = useState(false);
  const [editableCard, setEditableCard] = useState<Partial<TaskCard>>({
    title: '',
    shortSummary: '',
    context: '',
    dataAndMaterials: '',
    expectedResult: '',
    successCriteria: '',
    constraints: '',
    targetUsers: '',
    businessContact: '',
    reward: '80 000 ₽ + Fast-track',
    deadlineDays: 14,
    tags: ['Python', 'Docker', 'MVP'],
  });

  // Live Calculated Rating
  const [rating, setRating] = useState<ReadinessScoreBreakdown>(
    calculateCardReadiness(editableCard)
  );
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Re-calculate rating whenever editableCard changes
  useEffect(() => {
    if (step === 3) {
      setRating(calculateCardReadiness(editableCard));
    }
  }, [editableCard, step]);

  if (!isOpen) return null;

  // Demo presets for the 5-minute hackathon presentation
  const setWeakDraftPreset = () => {
    setCompany('FinTech Cloud');
    setBrandColor('#3B82F6');
    setCategory('analytics');
    setDraft('Хотим сервис для анализа финансовых документов и составления отчетов.');
  };

  const setMlDraftPreset = () => {
    setCompany('NVIDIA Innovation Hub');
    setBrandColor('#10B981');
    setCategory('ai');
    setDraft('Нужна легковесная нейросеть для кластеризации и рекомендаций студенческих кейсов с инференсом на GPU.');
  };

  // Step 1 -> Step 2: Request AI Clarifying Questions
  const handleAnalyzeDraft = async () => {
    if (!draft.trim() || draft.trim().length < 5) {
      setErrorMsg('Пожалуйста, введите хотя бы краткое описание черновика задачи.');
      return;
    }

    setErrorMsg('');
    setIsLoadingQuestions(true);

    try {
      const res = await fetch('/api/ai/clarify-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, companyName: company }),
      });

      const data = await res.json();
      if (data.success && data.questions?.length >= 3) {
        setQuestions(data.questions);
        setStep(2);
      } else {
        throw new Error(data.error || 'Не удалось сгенерировать вопросы');
      }
    } catch (e: any) {
      // Reliable fallback matching exact hackathon criteria
      setQuestions([
        {
          id: 'q1',
          category: 'dataAndMaterials',
          question: '1. Какие данные, примеры или API вы предоставите команде для работы?',
          placeholder: 'Например: Тестовый набор данных 10 000 записей в JSON, Swagger-спецификация API.',
        },
        {
          id: 'q2',
          category: 'successCriteria',
          question: '2. Каковы измеримые критерии приемки решения (метрики качества, тесты)?',
          placeholder: 'Например: Точность классификации > 85%, время ответа < 50мс, 90% покрытие unit-тестами.',
        },
        {
          id: 'q3',
          category: 'constraints',
          question: '3. Какие ограничения по срокам, стеку технологий и архитектуре?',
          placeholder: 'Например: Срок 14 дней. Python / FastAPI / Docker. Чистый код по PEP8.',
        },
        {
          id: 'q4',
          category: 'businessContact',
          question: '4. Кто контактное лицо бизнеса и в каком формате будет проходить обратная связь?',
          placeholder: 'Например: Куратор проекта Александр (@tech_lead), еженедельные 20-минутные синки.',
        },
      ]);
      setStep(2);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Quick fill answers for 5-minute demo
  const fillDemoAnswers = () => {
    setAnswers({
      q1: 'Тестовый датасет из 5 000 анонимизированных записей в JSON и документация по API платформы.',
      q2: 'Точность предсказания F1 > 0.88, задержка ответа сервиса менее 40 мс, прохождение нагрузочного теста.',
      q3: 'Срок выполнения 14 дней. Обязателен Docker-контейнер и развертывание в облачном окружении.',
      q4: 'Архитектор команды Михаил (@mikhail_arch), созвоны каждый вторник в Google Meet.',
    });
  };

  // Step 2 -> Step 3: Build Structured Card
  const handleBuildCard = async () => {
    setIsBuildingCard(true);
    try {
      const res = await fetch('/api/ai/build-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, answers, companyName: company }),
      });

      const data = await res.json();
      if (data.success && data.card) {
        setEditableCard({
          ...data.card,
          company,
          brandColor,
          category,
          deadlineDays: 14,
          reward: data.card.reward || '85 000 ₽ + Оффер',
          tags: data.card.tags || ['Python', 'FastAPI', 'Docker', 'AI'],
        });
      } else {
        throw new Error();
      }
    } catch {
      // Fallback construction
      setEditableCard({
        title: draft.slice(0, 40) + '...',
        shortSummary: draft,
        context: `Потребность компании ${company}: ${draft}`,
        dataAndMaterials: answers.q1 || 'Тестовый датасет и документация API',
        expectedResult: 'Рабочий репозиторий с кодом, развернутый прототип и инструкция по запуску',
        successCriteria: answers.q2 || 'Прохождение приемочных тестов и валидация на контрольной выборке',
        constraints: answers.q3 || 'Срок: 14 дней. Стек: Python / Docker',
        targetUsers: 'Сотрудники и клиенты компании',
        businessContact: answers.q4 || 'Куратор проекта (@tech_lead)',
        company,
        brandColor,
        category,
        deadlineDays: 14,
        reward: '80 000 ₽ + Оффер',
        tags: ['Python', 'MVP', 'Docker'],
      });
    } finally {
      setIsBuildingCard(false);
      setStep(3);
    }
  };

  // Step 3 -> Publish to general catalog
  const handleFinalPublish = () => {
    const finalRating = calculateCardReadiness(editableCard);

    const newCard: TaskCard = {
      id: `card-${Date.now()}`,
      company,
      brandColor,
      accentGlow: `${brandColor}33`,
      logoType: (['nvidia', 'sony', 'discord', 'telegram', 'yandex'].includes(
        company.toLowerCase()
      )
        ? company.toLowerCase()
        : 'custom') as any,
      title: editableCard.title || 'Новая задача',
      shortSummary: editableCard.shortSummary || editableCard.title || '',
      context: editableCard.context || '',
      dataAndMaterials: editableCard.dataAndMaterials || '',
      expectedResult: editableCard.expectedResult || '',
      successCriteria: editableCard.successCriteria || '',
      constraints: editableCard.constraints || '',
      targetUsers: editableCard.targetUsers || '',
      businessContact: editableCard.businessContact || '',
      readinessScore: finalRating.score,
      readinessLevel: finalRating.level,
      scoreBreakdown: finalRating,
      category,
      urgency: finalRating.score >= 90 ? 'urgent' : 'medium',
      deadlineDays: editableCard.deadlineDays || 14,
      deadlineText: `${editableCard.deadlineDays || 14} дней`,
      reward: editableCard.reward || '80 000 ₽',
      tags: editableCard.tags || ['MVP', 'Code'],
      applicantsCount: 0,
      saved: false,
      hasApplied: false,
      datePosted: 'Только что',
      aiGenerated: true,
    };

    onPublishCard(newCard);
    onClose();
  };

  // Helper for level badges with dynamic red-to-bright-orange color coding
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'priority':
        return {
          text: 'Приоритетная (90–100 б.)',
          color: 'bg-gradient-to-r from-orange-500 to-amber-400 text-neutral-950 border-orange-300 font-extrabold shadow-md shadow-orange-500/30',
        };
      case 'ready':
        return {
          text: 'Готовая (70–89 б.)',
          color: 'bg-orange-500/25 text-orange-200 border-orange-400/50 font-bold',
        };
      case 'working':
        return {
          text: 'Рабочая (40–69 б.)',
          color: 'bg-orange-600/20 text-orange-300 border-orange-600/40 font-bold',
        };
      default:
        return {
          text: 'Черновик (0–39 б. — требует уточнения)',
          color: 'bg-red-500/20 text-red-300 border-red-500/40 font-medium',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#151620] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header with 3 Pipeline Steps */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-[#181926] to-orange-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Конструктор бизнес-задач (Сквозной сценарий)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  AI Sana Хакатон
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Геймификация бизнеса: чем полнее ТЗ, тем выше рейтинг задачи и позиция в каталоге
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

        {/* Step Indicator Breadcrumb */}
        <div className="px-6 py-3 bg-[#111218] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? 'text-amber-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Шаг 1: Черновик</span>
          </div>

          <div className="h-0.5 w-10 bg-white/[0.1]" />

          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? 'text-amber-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                step >= 2 ? 'bg-amber-400/20 border-amber-400' : 'border-neutral-600'
              }`}
            >
              2
            </span>
            <span>Шаг 2: Уточнение (≥3 вопроса)</span>
          </div>

          <div className="h-0.5 w-10 bg-white/[0.1]" />

          <div
            className={`flex items-center gap-2 ${
              step === 3 ? 'text-amber-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                step === 3 ? 'bg-amber-400/20 border-amber-400' : 'border-neutral-600'
              }`}
            >
              3
            </span>
            <span>Шаг 3-4: Карточка & Рейтинг</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* STEP 1: Ввод черновика задачи */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-2xl border border-white/[0.05]">
                <span className="text-xs text-neutral-300">
                  🎯 Для защиты за 5 минут используйте готовые сценарии:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={setWeakDraftPreset}
                    className="text-xs px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-mono transition-colors"
                  >
                    1. Слабый черновик (демо роста рейтинга)
                  </button>
                  <button
                    type="button"
                    onClick={setMlDraftPreset}
                    className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-mono transition-colors"
                  >
                    2. ML-кейс NVIDIA
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">
                    Компания / Организация
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="flex-1 bg-[#1A1C26] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.1] focus:border-amber-400 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-11 h-11 p-1 bg-[#1A1C26] rounded-xl border border-white/[0.1] cursor-pointer"
                      title="Цвет полоски карточки"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">
                    Категория проекта
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-[#1A1C26] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.1] focus:outline-none"
                  >
                    <option value="ai">ИИ & ML</option>
                    <option value="gamedev">Геймдев & 3D</option>
                    <option value="bots">Боты & TMA</option>
                    <option value="web">Web & Mobile</option>
                    <option value="analytics">Финтех & Аналитика</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-neutral-300 uppercase font-bold">
                    Краткое описание потребности, проблемы или задачи (Черновик)
                  </label>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Свободный ввод
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Опишите своими словами, что нужно сделать. Например: 'Хотим сервис для анализа документов и составления отчетов...'"
                  className="w-full bg-[#1A1C26] text-sm text-white p-3.5 rounded-xl border border-white/[0.1] focus:border-amber-400 focus:outline-none placeholder-neutral-500 leading-relaxed font-sans resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeDraft}
                  disabled={isLoadingQuestions}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoadingQuestions ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ИИ анализирует полноту...</span>
                    </>
                  ) : (
                    <>
                      <span>Проверить полноту и задать вопросы</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Уточняющие вопросы ИИ (≥ 3 вопросов) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Wand2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Шаг 2. ИИ выявил недостающие сведения для качественного ТЗ
                    </h4>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      Ответьте на вопросы, чтобы карточка получила высокий рейтинг готовности и привлекла сильные студенческие команды.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fillDemoAnswers}
                  className="text-xs px-3 py-1.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:brightness-110 whitespace-nowrap shadow-sm"
                >
                  ⚡ Заполнить ответы для демо
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-[#1A1C26] border border-white/[0.08] space-y-2"
                  >
                    <label className="block text-xs font-semibold text-amber-300 font-mono">
                      {q.question}
                    </label>
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                      placeholder={q.placeholder}
                      className="w-full bg-[#12131C] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  ← Назад к черновику
                </button>

                <button
                  type="button"
                  onClick={handleBuildCard}
                  disabled={isBuildingCard}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isBuildingCard ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Формирование карточки и расчет рейтинга...</span>
                    </>
                  ) : (
                    <>
                      <span>Сформировать карточку и рассчитать рейтинг</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Редактируемая карточка + Шкала рейтинга (0–100) */}
          {step === 3 && (
            <div className="space-y-6">
              {/* TOP RATING DASHBOARD (The core gamification metric!) */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1E2A] via-[#1A1C28] to-[#251E14] border border-amber-500/40 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Big Score Dial */}
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-950 font-extrabold shadow-lg shadow-orange-500/20">
                      <div className="text-center">
                        <div className="text-2xl leading-none">{rating.score}</div>
                        <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                          из 100 б.
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase text-neutral-400">
                          Рейтинг готовности задачи:
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full border ${
                            getLevelBadge(rating.level).color
                          }`}
                        >
                          {getLevelBadge(rating.level).text}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {rating.score >= 90
                          ? '🌟 Приоритетная задача — высшая позиция в каталоге'
                          : rating.score >= 70
                          ? '✅ Готовая задача — повышенная позиция'
                          : rating.score >= 40
                          ? '⚡ Рабочая задача — доступна к откликам'
                          : '⚠️ Черновик — требует уточнения перед стартом'}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Рейтинг пересчитывается в реальном времени при заполнении любого из 7 полей ниже.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-mono self-start sm:self-auto"
                  >
                    <span>{showBreakdown ? 'Скрыть детализацию' : 'Показать детализацию баллов'}</span>
                    {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Breakdown of 7 criteria from section 4 of hackathon PDF */}
                {showBreakdown && (
                  <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Контекст (20 б.)</span>
                      <span className={`font-bold ${rating.breakdown.context.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.context.earned} / 20 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Данные (20 б.)</span>
                      <span className={`font-bold ${rating.breakdown.dataAndMaterials.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.dataAndMaterials.earned} / 20 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Результат (15 б.)</span>
                      <span className={`font-bold ${rating.breakdown.expectedResult.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.expectedResult.earned} / 15 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Критерии (15 б.)</span>
                      <span className={`font-bold ${rating.breakdown.successCriteria.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.successCriteria.earned} / 15 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Ограничения (10 б.)</span>
                      <span className={`font-bold ${rating.breakdown.constraints.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.constraints.earned} / 10 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[10px] text-neutral-400 block font-mono">Пользователи (10 б.)</span>
                      <span className={`font-bold ${rating.breakdown.targetUsers.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.targetUsers.earned} / 10 б.
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] col-span-2">
                      <span className="text-[10px] text-neutral-400 block font-mono">Связь с бизнесом (10 б.)</span>
                      <span className={`font-bold ${rating.breakdown.businessContact.earned > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {rating.breakdown.businessContact.earned} / 10 б.
                      </span>
                    </div>
                  </div>
                )}

                {/* Recommendations to reach 100 points */}
                {rating.missingAdvice.length > 0 && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <span className="font-bold font-mono uppercase text-[10px] block mb-1">
                      💡 Как повысить рейтинг до 100 баллов:
                    </span>
                    <ul className="space-y-0.5 list-disc list-inside text-neutral-300">
                      {rating.missingAdvice.slice(0, 2).map((adv, i) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* EDITABLE FIELDS (HUMAN IN THE LOOP) */}
              <div className="space-y-4 bg-[#181A24] p-5 rounded-3xl border border-white/[0.08]">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Редактирование полей карточки перед публикацией</span>
                  </h4>
                  <span className="text-xs text-neutral-400 font-mono">
                    Человек проверяет и подтверждает текст
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                    Название задачи
                  </label>
                  <input
                    type="text"
                    value={editableCard.title || ''}
                    onChange={(e) =>
                      setEditableCard({ ...editableCard, title: e.target.value })
                    }
                    className="w-full bg-[#1E202C] text-sm text-white px-3.5 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Context & Need (20 pts) */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                    <span>1. Контекст и потребность бизнеса (вес: 20 баллов)</span>
                    <span className="text-emerald-400 font-bold">{rating.breakdown.context.earned} / 20</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editableCard.context || ''}
                    onChange={(e) =>
                      setEditableCard({ ...editableCard, context: e.target.value })
                    }
                    placeholder="Что происходит сейчас и что необходимо изменить..."
                    className="w-full bg-[#1E202C] text-xs text-white p-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Data & Materials (20 pts) */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                    <span>2. Данные, примеры и материалы (вес: 20 баллов)</span>
                    <span className="text-emerald-400 font-bold">{rating.breakdown.dataAndMaterials.earned} / 20</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editableCard.dataAndMaterials || ''}
                    onChange={(e) =>
                      setEditableCard({ ...editableCard, dataAndMaterials: e.target.value })
                    }
                    placeholder="Доступные данные, примеры или источники..."
                    className="w-full bg-[#1E202C] text-xs text-white p-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Expected Result & Success Criteria (15 + 15 pts) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                      <span>3. Ожидаемый результат (15 б.)</span>
                      <span className="text-emerald-400 font-bold">{rating.breakdown.expectedResult.earned} / 15</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editableCard.expectedResult || ''}
                      onChange={(e) =>
                        setEditableCard({ ...editableCard, expectedResult: e.target.value })
                      }
                      placeholder="Конкретный результат работы команды..."
                      className="w-full bg-[#1E202C] text-xs text-white p-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                      <span>4. Критерии успеха (15 б.)</span>
                      <span className="text-emerald-400 font-bold">{rating.breakdown.successCriteria.earned} / 15</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editableCard.successCriteria || ''}
                      onChange={(e) =>
                        setEditableCard({ ...editableCard, successCriteria: e.target.value })
                      }
                      placeholder="Измеримые признаки принятия решения..."
                      className="w-full bg-[#1E202C] text-xs text-white p-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Constraints, Users & Contact (10 + 10 + 10 pts) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                      <span>5. Ограничения (10 б.)</span>
                      <span className="text-emerald-400 font-bold">{rating.breakdown.constraints.earned} / 10</span>
                    </label>
                    <input
                      type="text"
                      value={editableCard.constraints || ''}
                      onChange={(e) =>
                        setEditableCard({ ...editableCard, constraints: e.target.value })
                      }
                      placeholder="Сроки, стек, доступы"
                      className="w-full bg-[#1E202C] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                      <span>6. Пользователи (10 б.)</span>
                      <span className="text-emerald-400 font-bold">{rating.breakdown.targetUsers.earned} / 10</span>
                    </label>
                    <input
                      type="text"
                      value={editableCard.targetUsers || ''}
                      onChange={(e) =>
                        setEditableCard({ ...editableCard, targetUsers: e.target.value })
                      }
                      placeholder="Для кого создается решение"
                      className="w-full bg-[#1E202C] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1 flex justify-between">
                      <span>7. Связь с бизнесом (10 б.)</span>
                      <span className="text-emerald-400 font-bold">{rating.breakdown.businessContact.earned} / 10</span>
                    </label>
                    <input
                      type="text"
                      value={editableCard.businessContact || ''}
                      onChange={(e) =>
                        setEditableCard({ ...editableCard, businessContact: e.target.value })
                      }
                      placeholder="Контакт и формат синка"
                      className="w-full bg-[#1E202C] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  ← Вернуться к вопросам
                </button>

                <button
                  type="button"
                  onClick={handleFinalPublish}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-neutral-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Подтвердить и опубликовать в каталоге ({rating.score} б.)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
