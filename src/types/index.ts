export type UserRole = 'student' | 'business';

export type ReadinessLevel = 'draft' | 'working' | 'ready' | 'priority';

export type TaskCategory = 
  | 'all'
  | 'ai'
  | 'gamedev'
  | 'web'
  | 'bots'
  | 'design'
  | 'analytics';

export type UrgencyFilter = 
  | 'all'
  | 'urgent' // < 3 days
  | 'week'   // <= 7 days
  | 'month'; // > 7 days

export interface ScoreCriterion {
  max: number;
  earned: number;
  present: boolean;
  advice: string;
}

export interface ReadinessScoreBreakdown {
  score: number;
  level: ReadinessLevel;
  levelLabel: string;
  breakdown: {
    context: ScoreCriterion;
    dataAndMaterials: ScoreCriterion;
    expectedResult: ScoreCriterion;
    successCriteria: ScoreCriterion;
    constraints: ScoreCriterion;
    targetUsers: ScoreCriterion;
    businessContact: ScoreCriterion;
  };
  missingAdvice: string[];
}

export interface TaskCard {
  id: string;
  company: string;
  brandColor: string;
  accentGlow: string;
  logoType: 'nvidia' | 'sony' | 'discord' | 'telegram' | 'yandex' | 'tinkoff' | 'custom';
  customLogoText?: string;
  title: string;
  shortSummary: string; // Краткое описание для витрины
  
  // Обязательные поля карточки по ТЗ хакатона:
  context: string;            // Контекст и потребность бизнеса (20 б.)
  dataAndMaterials: string;   // Данные, примеры и материалы (20 б.)
  expectedResult: string;     // Ожидаемый результат работы команды (15 б.)
  successCriteria: string;    // Измеримые критерии успеха (15 б.)
  constraints: string;        // Ограничения: сроки, технологии, доступы (10 б.)
  targetUsers: string;        // Для кого создается решение (10 б.)
  businessContact: string;    // Контакт куратора и формат синка (10 б.)
  
  // Рейтинг готовности (0 - 100 баллов)
  readinessScore: number;
  readinessLevel: ReadinessLevel;
  scoreBreakdown?: ReadinessScoreBreakdown;
  
  category: TaskCategory;
  urgency: 'urgent' | 'medium' | 'normal';
  deadlineDays: number;
  deadlineText: string;
  reward: string;
  tags: string[];
  applicantsCount: number;
  saved?: boolean;
  hasApplied?: boolean;
  datePosted: string;
  businessId?: string;
  aiGenerated?: boolean;
}

export interface StudentProfile {
  name: string;
  id: string;
  teamName: string;
  avatar: string;
  university: string;
  specialization: string;
  rating: number;
  completedTasks: number;
  skills: string[];
  github: string;
  telegram: string;
}

export interface BusinessProfile {
  name: string;
  roleTitle: string;
  company: string;
  id: string;
  avatar: string;
  verified: boolean;
  activeCardsCount: number;
}

export type UserProfile =
  | (StudentProfile & { role: 'student' })
  | (BusinessProfile & { role: 'business' });

export interface ProfileInput {
  role?: UserRole;
  name: string;
  teamName?: string;
  university?: string;
  specialization?: string;
  skills?: string[];
  github?: string;
  telegram?: string;
  company?: string;
  roleTitle?: string;
}

export interface AppNotification {
  id: string;
  profileId: string;
  type: 'new_proposal' | 'proposal_accepted' | 'proposal_rejected';
  title: string;
  message: string;
  cardId: string;
  proposalId: string;
  createdAt: string;
  readAt: string | null;
}

// Предложение (отклик) студенческой команды по ТЗ хакатона
export interface TeamProposal {
  id: string;
  cardId: string;
  cardTitle: string;
  companyName: string;
  teamName: string;
  leaderName: string;
  studentId: string;
  avatar: string;
  solutionIdea: string;  // Идея решения
  workPlan: string;      // План работы
  proposedDeadline: string; // Предлагаемый срок
  prototypeLink: string; // Ссылка на прототип или GitHub
  telegram: string;
  submittedAt: string;
  status: 'pending' | 'accepted' | 'rejected'; // Ручной выбор бизнеса!
  awardedScore?: number; // Баллы за прогресс
}

export interface TeamSquad {
  id: string;
  title: string;
  targetCardTitle: string;
  targetCompany: string;
  leader: {
    name: string;
    role: string;
    avatar: string;
    id: string;
  };
  members: {
    name: string;
    role: string;
    avatar: string;
  }[];
  neededRoles: string[];
  description: string;
  status: 'recruiting' | 'full';
}
