import React, { useRef, useState } from 'react';
import { errorMessage } from '../api';
import { TaskCard, StudentProfile, TeamProposal } from '../types';
import { BrandLogo } from './BrandLogos';
import {
  X,
  Send,
  CheckCircle2,
  Clock,
  Coins,
  Github,
  MessageSquare,
  ShieldCheck,
  Flame,
  Award,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface ApplyModalProps {
  card: TaskCard | null;
  student: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal: (proposal: Omit<TeamProposal, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  card,
  student,
  isOpen,
  onClose,
  onSubmitProposal,
}) => {
  const [teamName, setTeamName] = useState(student.teamName || '');
  const [solutionIdea, setSolutionIdea] = useState('');
  const [workPlan, setWorkPlan] = useState('');
  const [proposedDeadline, setProposedDeadline] = useState('');
  const [prototypeLink, setPrototypeLink] = useState('');
  const [telegram, setTelegram] = useState(student.telegram || '');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitting = useRef(false);

  if (!isOpen || !card) return null;

  const fillQuickDemoProposal = () => {
    setTeamName('Neural Bears Squad');
    setSolutionIdea(`Архитектура на ${card.tags[0] || 'Python'} с асинхронной обработкой очереди задач и Swagger-документацией.`);
    setWorkPlan('Этап 1: Интеграция данных и базовая модель. Этап 2: Тестирование производительности. Этап 3: Деплой прототипа.');
    setProposedDeadline(`${card.deadlineDays} дней`);
    setPrototypeLink('https://example.com/demo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmitProposal({
        cardId: card.id,
        cardTitle: card.title,
        companyName: card.company,
        teamName,
        leaderName: student.name,
        studentId: student.id,
        avatar: student.avatar,
        solutionIdea,
        workPlan,
        proposedDeadline,
        prototypeLink,
        telegram,
      });
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#161720] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#1A1C26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo type={card.logoType} company={card.company} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-neutral-400">
                  Подача предложения команды на кейс от
                </span>
                <span className="text-sm font-extrabold text-white">{card.company}</span>
              </div>
              <h3 className="text-sm font-bold text-amber-300 truncate max-w-md">
                {card.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрыть отклик"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 ring-4 ring-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold text-white mb-2">
              Предложение команды успешно отправлено!
            </h4>
            <p className="text-sm text-neutral-400 max-w-sm mb-4">
              Бизнес получил ваше предложение в список откликов. Представитель бизнеса вручную выберет команду для старта работы.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {submitError && <p role="alert" className="text-sm text-red-300">{submitError} Данные формы сохранены.</p>}
            <fieldset disabled={isSubmitting} className="space-y-4 min-w-0">
            {/* Quick Demo Pre-fill button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Готовность ТЗ: <strong className="text-amber-300">{card.readinessScore} б. / 100</strong></span>
              </div>

              <button
                type="button"
                onClick={fillQuickDemoProposal}
                className="text-xs px-3 py-1 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:brightness-110 font-mono"
              >
                ⚡ Заполнить демо-отклик
              </button>
            </div>

            {/* Team and Leader Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Название команды
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  placeholder="e.g. Neural Bears Squad"
                  className="w-full bg-[#1F212D] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Тимлид / Студент (ID)
                </label>
                <div className="flex items-center gap-2 bg-[#1F212D] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/[0.08]">
                  <span>{student.name}</span>
                  <span className="text-xs text-orange-300 font-mono font-bold">[{student.id}]</span>
                </div>
              </div>
            </div>

            {/* Idea of Solution (Required by Hackathon spec) */}
            <div>
              <label className="block text-xs font-mono text-amber-400 uppercase font-bold mb-1">
                1. Идея решения задачи
              </label>
              <textarea
                rows={2}
                value={solutionIdea}
                onChange={(e) => setSolutionIdea(e.target.value)}
                required
                placeholder="Как ваша команда планирует решить проблему бизнеса..."
                className="w-full bg-[#1F212D] text-sm text-white p-3 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none placeholder-neutral-500 font-sans resize-none"
              />
            </div>

            {/* Plan of Work (Required by Hackathon spec) */}
            <div>
              <label className="block text-xs font-mono text-amber-400 uppercase font-bold mb-1">
                2. План работы по этапам
              </label>
              <textarea
                rows={3}
                value={workPlan}
                onChange={(e) => setWorkPlan(e.target.value)}
                required
                placeholder="Этапы выполнения, вехи, дедлайны по дням..."
                className="w-full bg-[#1F212D] text-sm text-white p-3 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none placeholder-neutral-500 font-sans resize-none"
              />
            </div>

            {/* Deadline, Prototype Link & Telegram */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Предлагаемый срок
                </label>
                <input
                  type="text"
                  value={proposedDeadline}
                  onChange={(e) => setProposedDeadline(e.target.value)}
                  required
                  placeholder="e.g. 7 дней"
                  className="w-full bg-[#1F212D] text-xs text-white px-3 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Ссылка на прототип / Git (необязательно)
                </label>
                <input
                  type="text"
                  value={prototypeLink}
                  onChange={(e) => setPrototypeLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#1F212D] text-xs text-white px-3 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Telegram для связи
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  required
                  placeholder="@username"
                  className="w-full bg-[#1F212D] text-xs text-white px-3 py-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Отмена
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-neutral-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Отправляем…' : 'Отправить предложение бизнесу'}</span>
              </button>
            </div>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
};
