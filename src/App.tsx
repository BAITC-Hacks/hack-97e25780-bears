import React, { useState, useMemo } from 'react';
import {
  UserRole,
  TaskCard,
  TaskCategory,
  UrgencyFilter,
  ReadinessLevel,
  StudentProfile,
  BusinessProfile,
  TeamProposal,
  TeamSquad
} from './types';
import {
  INITIAL_CARDS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_BUSINESS_PROFILE,
  INITIAL_PROPOSALS,
  INITIAL_TEAMS
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskFilters } from './components/TaskFilters';
import { TaskCardItem } from './components/TaskCardItem';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { ApplyModal } from './components/ApplyModal';
import { TaskConstructorModal } from './components/TaskConstructorModal';
import { TeamView } from './components/TeamView';
import { BusinessDashboard } from './components/BusinessDashboard';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Award,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Role switcher: 'student' or 'business'
  const [currentRole, setCurrentRole] = useState<UserRole>('student');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('cards');

  // State collections
  const [cards, setCards] = useState<TaskCard[]>(INITIAL_CARDS);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [proposals, setProposals] = useState<TeamProposal[]>(INITIAL_PROPOSALS);
  const [teams, setTeams] = useState<TeamSquad[]>(INITIAL_TEAMS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [selectedReadinessLevel, setSelectedReadinessLevel] = useState<ReadinessLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'deadline' | 'newest'>('rating');

  // Modals
  const [selectedCardForApply, setSelectedCardForApply] = useState<TaskCard | null>(null);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<TaskCard | null>(null);
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered and Sorted cards calculation
  const filteredAndSortedCards = useMemo(() => {
    const list = cards.filter((card) => {
      // Tab filters for student
      if (currentRole === 'student') {
        if (activeTab === 'applied' && !card.hasApplied) return false;
        if (activeTab === 'saved' && !card.saved) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCompany = card.company.toLowerCase().includes(query);
        const matchesTitle = card.title.toLowerCase().includes(query);
        const matchesSummary = (card.shortSummary || '').toLowerCase().includes(query);
        const matchesContext = (card.context || '').toLowerCase().includes(query);
        const matchesTags = card.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesCompany && !matchesTitle && !matchesSummary && !matchesContext && !matchesTags) {
          return false;
        }
      }

      // Readiness Level filter (Hackathon Gamification)
      if (selectedReadinessLevel !== 'all' && card.readinessLevel !== selectedReadinessLevel) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && card.category !== selectedCategory) {
        return false;
      }

      return true;
    });

    // Sorting: default to rating descending (highest readiness on top!)
    return list.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.readinessScore || 0) - (a.readinessScore || 0);
      }
      if (sortBy === 'deadline') {
        return a.deadlineDays - b.deadlineDays;
      }
      return 0;
    });
  }, [cards, currentRole, activeTab, searchQuery, selectedCategory, selectedReadinessLevel, sortBy]);

  // Handlers
  const handleToggleSave = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const newSaved = !c.saved;
          showToast(newSaved ? 'Кейс добавлен в сохраненные' : 'Кейс удален из сохраненных');
          return { ...c, saved: newSaved };
        }
        return c;
      })
    );
  };

  const handleApplyClick = (card: TaskCard) => {
    setSelectedCardForApply(card);
  };

  const handleViewDetails = (card: TaskCard) => {
    setSelectedCardForDetails(card);
  };

  const handleSubmitProposal = (
    proposalData: Omit<TeamProposal, 'id' | 'submittedAt' | 'status'>
  ) => {
    const targetCard = cards.find((c) => c.id === proposalData.cardId);
    if (!targetCard) return;

    // Mark card as applied
    setCards((prev) =>
      prev.map((c) =>
        c.id === proposalData.cardId
          ? { ...c, hasApplied: true, applicantsCount: c.applicantsCount + 1 }
          : c
      )
    );

    // Create new proposal
    const newProposal: TeamProposal = {
      ...proposalData,
      id: `prop-${Date.now()}`,
      submittedAt: 'Только что',
      status: 'pending',
    };

    setProposals([newProposal, ...proposals]);
    showToast(`Предложение команды успешно отправлено на рассмотрение бизнесу!`);
  };

  const handlePublishNewCard = (newCard: TaskCard) => {
    setCards([newCard, ...cards]);
    showToast(`Задача успешно опубликована в каталоге с рейтингом ${newCard.readinessScore} б.!`);
  };

  const handleAcceptProposal = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId ? { ...p, status: 'accepted', awardedScore: 85 } : p
      )
    );
    showToast('Команда выбрана к выполнению этапа! Начислено +85 баллов прогресса.');
  };

  const handleRejectProposal = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' } : p))
    );
    showToast('Предложение команды отклонено');
  };

  const handleJoinTeam = (teamId: string) => {
    showToast('Заявка на вступление в команду отправлена');
  };

  const handleCreateTeam = (newTeam: TeamSquad) => {
    setTeams([newTeam, ...teams]);
    showToast('Новая команда создана');
  };

  const savedCount = cards.filter((c) => c.saved).length;
  const appliedCount = cards.filter((c) => c.hasApplied).length;

  return (
    <div className="min-h-screen bg-[#111216] text-[#F3F4F6] flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1C1E29] border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          setActiveTab('cards');
        }}
        activeCardsCount={cards.length}
        onOpenAiCreator={() => setIsConstructorOpen(true)}
      />

      {/* Desktop Layout Frame (Sidebar + Main Content Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          studentProfile={studentProfile}
          businessProfile={businessProfile}
          onOpenAiCreator={() => setIsConstructorOpen(true)}
          savedCount={savedCount}
          appliedCount={appliedCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Business View */}
            {currentRole === 'business' ? (
              <BusinessDashboard
                businessProfile={businessProfile}
                cards={cards}
                proposals={proposals}
                activeTab={activeTab}
                onOpenConstructor={() => setIsConstructorOpen(true)}
                onAcceptProposal={handleAcceptProposal}
                onRejectProposal={handleRejectProposal}
                onViewCardDetails={handleViewDetails}
              />
            ) : (
              /* Student View */
              <>
                {activeTab === 'team' ? (
                  <TeamView
                    teams={teams}
                    onCreateTeam={handleCreateTeam}
                    onJoinTeam={handleJoinTeam}
                    studentName={studentProfile.name}
                  />
                ) : (
                  /* Cards Feed (Все Карты / Мои отклики / Сохраненные) */
                  <div>
                    {/* Top title header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                          <span>
                            {activeTab === 'applied'
                              ? 'Мои отправленные предложения'
                              : activeTab === 'saved'
                              ? 'Сохраненные задачи'
                              : 'Открытый каталог практических задач'}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-mono border border-orange-500/30">
                            Ранжирование по ТЗ
                          </span>
                        </h1>
                        <p className="text-xs text-neutral-400 mt-1">
                          Задачи с рейтингом ≥40 б. доступны для откликов; задачи с рейтингом 90–100 б. выделены в топе
                        </p>
                      </div>

                      {/* Quick switch to Business banner if needed */}
                      <button
                        onClick={() => setCurrentRole('business')}
                        className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-neutral-300 border border-white/[0.06] transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                        <span>Режим Бизнеса (создать ТЗ)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    </div>

                    {/* Filters & Search Toolbar */}
                    <TaskFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      selectedReadinessLevel={selectedReadinessLevel}
                      onReadinessLevelChange={setSelectedReadinessLevel}
                      sortBy={sortBy}
                      onSortByChange={setSortBy}
                      totalCardsCount={cards.length}
                      filteredCount={filteredAndSortedCards.length}
                    />

                    {/* Cards Grid: 2 columns format */}
                    {filteredAndSortedCards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredAndSortedCards.map((card) => (
                          <TaskCardItem
                            key={card.id}
                            card={card}
                            onApply={handleApplyClick}
                            onToggleSave={handleToggleSave}
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center rounded-3xl bg-[#161720] border border-white/[0.06] space-y-3">
                        <Layers className="w-12 h-12 text-neutral-600 mx-auto" />
                        <h3 className="text-base font-bold text-white">
                          По вашему фильтру не найдено задач
                        </h3>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                          Попробуйте сбросить фильтры уровня готовности или ввести другие ключевые слова.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedReadinessLevel('all');
                            setSortBy('rating');
                          }}
                          className="px-4 py-2 rounded-xl bg-white/[0.06] text-xs font-semibold text-amber-300 hover:bg-white/[0.1] transition-colors"
                        >
                          Сбросить фильтры
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      {/* 1. Task Details Modal */}
      <TaskDetailsModal
        card={selectedCardForDetails}
        isOpen={!!selectedCardForDetails}
        onClose={() => setSelectedCardForDetails(null)}
        onApply={(card) => {
          setSelectedCardForDetails(null);
          setSelectedCardForApply(card);
        }}
        onToggleSave={handleToggleSave}
      />

      {/* 2. Team Proposal Apply Modal */}
      <ApplyModal
        card={selectedCardForApply}
        student={studentProfile}
        isOpen={!!selectedCardForApply}
        onClose={() => setSelectedCardForApply(null)}
        onSubmitProposal={handleSubmitProposal}
      />

      {/* 3. Task Constructor Modal (Сквозной сценарий хакатона: Черновик -> Уточнения ИИ -> Карточка -> Рейтинг -> Публикация) */}
      <TaskConstructorModal
        isOpen={isConstructorOpen}
        onClose={() => setIsConstructorOpen(false)}
        onPublishCard={handlePublishNewCard}
        defaultCompany={businessProfile.company}
      />
    </div>
  );
}
