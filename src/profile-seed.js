import { demoSeed } from './seed.js';

export const appDemoSeed = {
  ...demoSeed,
  profiles: [
    {
      id: 'demo-student', role: 'student', name: 'Демо-студент', teamName: 'Учебная команда',
      avatar: '', university: '', specialization: '', skills: [], github: '', telegram: '',
      rating: 0, completedTasks: 0,
    },
    {
      id: 'demo-business', role: 'business', name: 'Демо-представитель',
      company: 'Учебная компания (демо)', roleTitle: 'Представитель компании',
      avatar: '', verified: false,
    },
  ],
  // Ownership is explicit for this sample only; arbitrary old tasks are not reassigned.
  uiCards: [{ id: 'task-demo', businessId: 'demo-business', company: 'Учебная компания (демо)' }],
  uiProposals: [],
  notifications: [],
};
