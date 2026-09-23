import { calculateRating } from './domain/rating.js';

const publishedTask = {
  id: 'task-demo',
  title: 'Прогноз очередей в столовой кампуса',
  industry: 'Общественное питание',
  draftText: 'Нужен сервис, который поможет сократить очереди в студенческой столовой',
  context: 'В обеденные часы у двух касс образуются очереди, а посетители не знают время ожидания.',
  need: 'Нужно прогнозировать загрузку касс и подсказывать посетителям менее загруженное время.',
  users: 'Студенты и сотрудники кампуса, которые посещают столовую в обеденный перерыв.',
  data: 'Доступны обезличенная история чеков и загрузка касс по пятнадцатиминутным интервалам.',
  constraints: 'Срок две недели, без персональных данных, развёртывание только в тестовом контуре.',
  expectedResult: 'Рабочий веб-прототип прогноза очереди и простая панель для администратора столовой.',
  successCriteria: 'На тестовой неделе среднее ожидание должно снизиться с 12 до 7 минут.',
  contact: 'canteen@example.kz',
  interactionFormat: 'Две онлайн-консультации в неделю и ответы представителя бизнеса в общем канале.',
  status: 'published',
  selectionOutcome: 'pending',
  createdAt: '2026-09-23T08:00:00.000Z',
  updatedAt: '2026-09-23T09:00:00.000Z',
};

publishedTask.rating = calculateRating(publishedTask);

export const demoSeed = {
  tasks: [publishedTask],
  teams: [
    {
      id: 'team-data-nomads',
      name: 'Data Nomads',
      interests: ['аналитика', 'городские сервисы'],
      skills: ['прогнозирование', 'UX'],
      technologies: ['Python', 'React'],
    },
    {
      id: 'team-campus-lab',
      name: 'Campus Lab',
      interests: ['образование', 'кампус'],
      skills: ['frontend', 'исследования'],
      technologies: ['TypeScript', 'Next.js'],
    },
  ],
  proposals: [],
};
