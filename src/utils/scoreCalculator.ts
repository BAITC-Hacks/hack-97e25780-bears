import { ReadinessScoreBreakdown, ReadinessLevel, TaskCard } from '../types';

export function calculateCardReadiness(card: Partial<TaskCard>): ReadinessScoreBreakdown {
  const contextLength = (card.context || '').trim().length;
  const dataLength = (card.dataAndMaterials || '').trim().length;
  const resultLength = (card.expectedResult || '').trim().length;
  const criteriaLength = (card.successCriteria || '').trim().length;
  const constraintsLength = (card.constraints || '').trim().length;
  const usersLength = (card.targetUsers || '').trim().length;
  const contactLength = (card.businessContact || '').trim().length;

  const breakdown = {
    context: {
      max: 20,
      earned: contextLength > 30 ? 20 : contextLength > 8 ? 10 : 0,
      present: contextLength > 8,
      advice: 'Опишите бизнес-контекст: что происходит сейчас и зачем менять (+10..20 б.)',
    },
    dataAndMaterials: {
      max: 20,
      earned: dataLength > 20 ? 20 : dataLength > 5 ? 10 : 0,
      present: dataLength > 5,
      advice: 'Укажите доступные данные, API, тестовые выборки или документацию (+10..20 б.)',
    },
    expectedResult: {
      max: 15,
      earned: resultLength > 20 ? 15 : resultLength > 5 ? 8 : 0,
      present: resultLength > 5,
      advice: 'Конкретизируйте финальный результат: прототип, Docker, документация (+7..15 б.)',
    },
    successCriteria: {
      max: 15,
      earned: criteriaLength > 20 ? 15 : criteriaLength > 5 ? 8 : 0,
      present: criteriaLength > 5,
      advice: 'Добавьте измеримые критерии приемки: метрики, тесты, SLA (+7..15 б.)',
    },
    constraints: {
      max: 10,
      earned: constraintsLength > 15 ? 10 : constraintsLength > 3 ? 5 : 0,
      present: constraintsLength > 3,
      advice: 'Укажите сроки, ограничения по стеку технологий или доступы (+5..10 б.)',
    },
    targetUsers: {
      max: 10,
      earned: usersLength > 12 ? 10 : usersLength > 3 ? 5 : 0,
      present: usersLength > 3,
      advice: 'Уточните, кто конечный пользователь решения (+5..10 б.)',
    },
    businessContact: {
      max: 10,
      earned: contactLength > 5 ? 10 : 0,
      present: contactLength > 5,
      advice: 'Укажите куратора со стороны бизнеса и формат обратной связи (+10 б.)',
    },
  };

  const score = Object.values(breakdown).reduce((sum, item) => sum + item.earned, 0);

  let level: ReadinessLevel = 'draft';
  let levelLabel = 'Черновик (0–39 б. — требует уточнения)';
  if (score >= 90) {
    level = 'priority';
    levelLabel = 'Приоритетная (90–100 б. — выделена в топе каталога)';
  } else if (score >= 70) {
    level = 'ready';
    levelLabel = 'Готовая (70–89 б. — повышенная позиция)';
  } else if (score >= 40) {
    level = 'working';
    levelLabel = 'Рабочая (40–69 б. — доступна к откликам)';
  }

  const missingAdvice = Object.values(breakdown)
    .filter((b) => b.earned < b.max)
    .map((b) => b.advice);

  return {
    score,
    level,
    levelLabel,
    breakdown,
    missingAdvice,
  };
}
