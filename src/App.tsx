import React, { useState, useMemo, useEffect, useRef } from 'react';
import { errorMessage, projectApi } from './api';
import {
  UserRole,
  TaskCard,
  TaskCategory,
  UrgencyFilter,
  ReadinessLevel,
  StudentProfile,
  BusinessProfile,
  TeamProposal,
  TeamSquad,
  UserProfile,
  ProfileInput,
  AppNotification,
} from './types';
import { INITIAL_TEAMS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskFilters } from './components/TaskFilters';
import { TaskCardItem } from './components/TaskCardItem';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { ApplyModal } from './components/ApplyModal';
import { TaskConstructorModal } from './components/TaskConstructorModal';
import { TeamView } from './components/TeamView';
import { BusinessDashboard } from './components/BusinessDashboard';
import { ProfileManager } from './components/ProfileManager';
import { NotificationsPanel } from './components/NotificationsPanel';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Award,
  ArrowRight
} from 'lucide-react';

const SELECTION_KEY = 'startcard.profile-selection.v1';
function readSelection(): { role: UserRole; student: string; business: string } {
  try {
    const value = JSON.parse(localStorage.getItem(SELECTION_KEY) || '{}');
    return { role: value.role === 'business' ? 'business' : 'student', student: typeof value.student === 'string' ? value.student : '', business: typeof value.business === 'string' ? value.business : '' };
  } catch { return { role: 'student', student: '', business: '' }; }
}
const EMPTY_STUDENT: StudentProfile = { id: '', name: 'Выберите профиль', teamName: '', avatar: '', university: '', specialization: '', rating: 0, completedTasks: 0, skills: [], github: '', telegram: '' };
const EMPTY_BUSINESS: BusinessProfile = { id: '', name: 'Выберите профиль', company: '', roleTitle: '', avatar: '', verified: false, activeCardsCount: 0 };

export default function App() {
  const [selection, setSelection] = useState(readSelection);
  const currentRole = selection.role;
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesReady, setProfilesReady] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [profileReloadVersion, setProfileReloadVersion] = useState(0);
  const profileRequestGeneration = useRef(0);
  const studentProfile = profiles.find((profile): profile is StudentProfile & { role: 'student' } => profile.role === 'student' && profile.id === selection.student)
    || profiles.find((profile): profile is StudentProfile & { role: 'student' } => profile.role === 'student') || EMPTY_STUDENT;
  const businessProfile = profiles.find((profile): profile is BusinessProfile & { role: 'business' } => profile.role === 'business' && profile.id === selection.business)
    || profiles.find((profile): profile is BusinessProfile & { role: 'business' } => profile.role === 'business') || EMPTY_BUSINESS;
  const activeProfile = currentRole === 'student' ? studentProfile : businessProfile;
  const activeProfileId = activeProfile.id;
  const activeProfileRef = useRef(activeProfileId);
  activeProfileRef.current = activeProfileId;

  useEffect(() => {
    const controller = new AbortController();
    const generation = ++profileRequestGeneration.current;
    projectApi.profiles(controller.signal).then(({ profiles: next }) => {
      if (controller.signal.aborted || generation !== profileRequestGeneration.current) return;
      setProfiles(next); setProfilesReady(true); setProfileLoadError('');
    }).catch((error) => { if (!controller.signal.aborted && generation === profileRequestGeneration.current) setProfileLoadError(errorMessage(error)); });
    return () => controller.abort();
  }, [profileReloadVersion]);
  useEffect(() => {
    if (!profilesReady) return;
    try { localStorage.setItem(SELECTION_KEY, JSON.stringify({ role: currentRole, student: studentProfile.id, business: businessProfile.id })); } catch { /* Profile selection also works when browser storage is disabled. */ }
  }, [profilesReady, currentRole, studentProfile.id, businessProfile.id]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('cards');

  // State collections
  const [cards, setCards] = useState<TaskCard[]>([]);
  const [proposals, setProposals] = useState<TeamProposal[]>([]);
  const [teams, setTeams] = useState<TeamSquad[]>(INITIAL_TEAMS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [selectionError, setSelectionError] = useState('');
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);
  const selectionRequests = useRef(new Set<string>());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [stateProfileId, setStateProfileId] = useState('');
  const requestGeneration = useRef(0);
  const savedByProfile = useRef(new Map<string, Set<string>>());

  useEffect(() => {
    if (!activeProfileId) return;
    const controller = new AbortController();
    let pending = false;
    const load = async (initial = false) => {
      if (pending) return;
      pending = true;
      const generation = ++requestGeneration.current;
      if (initial && stateProfileId !== activeProfileId) setIsLoading(true);
      try {
        const state = await projectApi.state(activeProfileId, controller.signal);
        if (controller.signal.aborted || generation !== requestGeneration.current || activeProfileRef.current !== activeProfileId) return;
        if (!Array.isArray(state.cards) || !Array.isArray(state.proposals)) {
          throw new Error('Сервер вернул неверный формат каталога.');
        }
        setCards(state.cards.map((card) => ({
          ...card,
          saved: savedByProfile.current.get(activeProfileId)?.has(card.id) || false,
          hasApplied: state.proposals.some((proposal) =>
            proposal.cardId === card.id && proposal.studentId === studentProfile.id),
        })));
        setProposals(state.proposals);
        setNotifications(state.notifications);
        setStateProfileId(activeProfileId);
        setLoadError('');
      } catch (error) {
        if (!controller.signal.aborted && generation === requestGeneration.current) setLoadError(errorMessage(error));
      } finally {
        pending = false;
        if (!controller.signal.aborted && generation === requestGeneration.current) setIsLoading(false);
      }
    };
    void load(true);
    const interval = window.setInterval(() => { if (!document.hidden) void load(); }, 10000);
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [reloadVersion, activeProfileId]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [selectedReadinessLevel, setSelectedReadinessLevel] = useState<ReadinessLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'deadline' | 'newest'>('rating');

  // Modals
  const [selectedCardForApply, setSelectedCardForApply] = useState<TaskCard | null>(null);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState<TaskCard | null>(null);
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [focusedProposalId, setFocusedProposalId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const closeWorkModals = () => {
    setSelectedCardForApply(null); setSelectedCardForDetails(null); setIsConstructorOpen(false);
    setIsNotificationsOpen(false); setSelectionError(''); setFocusedProposalId(null);
  };
  const switchRole = (role: UserRole) => {
    if (role === currentRole) return;
    closeWorkModals(); setActiveTab('cards');
    setSelection((previous) => ({ ...previous, role }));
  };
  const selectProfile = (profile: UserProfile) => {
    closeWorkModals(); setIsProfileManagerOpen(false); setActiveTab('cards');
    setSelection((previous) => ({ ...previous, role: profile.role, [profile.role]: profile.id }));
  };
  const saveProfile = async (input: ProfileInput, id?: string) => {
    const { profile } = id ? await projectApi.updateProfile(id, input) : await projectApi.createProfile(input);
    profileRequestGeneration.current += 1;
    setProfiles((previous) => [...previous.filter((item) => item.id !== profile.id), profile]);
    setProfilesReady(true); setProfileLoadError(''); selectProfile(profile);
    showToast(id ? 'Изменения профиля сохранены.' : 'Профиль создан и выбран.');
  };
  const openProfiles = () => {
    setProfileReloadVersion((value) => value + 1); setIsProfileManagerOpen(true);
  };
  const refreshState = () => {
    requestGeneration.current += 1;
    setReloadVersion((value) => value + 1);
  };
  const readAllNotifications = async () => {
    const profileId = activeProfileId;
    await projectApi.readAllNotifications(profileId);
    if (activeProfileRef.current !== profileId) return;
    setNotifications((previous) => previous.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    refreshState();
  };
  const openNotification = async (notification: AppNotification) => {
    const profileId = activeProfileId;
    if (!notification.readAt) await projectApi.readNotification(profileId, notification.id);
    if (activeProfileRef.current !== profileId) return;
    setNotifications((previous) => previous.map((item) => item.id === notification.id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
    setIsNotificationsOpen(false); setFocusedProposalId(notification.proposalId);
    setSearchQuery(''); setSelectedCategory('all'); setSelectedReadinessLevel('all');
    setActiveTab(currentRole === 'business' ? 'applicants' : 'applied');
    showToast(notification.message);
    refreshState();
  };

  const openConstructor = () => {
    if (!activeProfileId || isLoading || loadError || stateProfileId !== activeProfileId) {
      showToast('Дождитесь загрузки каталога или повторите подключение к серверу.');
      return;
    }
    setIsConstructorOpen(true);
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
    const saved = new Set(savedByProfile.current.get(activeProfileId) || []);
    if (saved.has(cardId)) saved.delete(cardId); else saved.add(cardId);
    savedByProfile.current.set(activeProfileId, saved);
    showToast(saved.has(cardId) ? 'Кейс добавлен в сохраненные' : 'Кейс удален из сохраненных');
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, saved: saved.has(cardId) };
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

  const handleSubmitProposal = async (
    proposalData: Omit<TeamProposal, 'id' | 'submittedAt' | 'status'>
  ) => {
    const targetCard = cards.find((c) => c.id === proposalData.cardId);
    if (!targetCard) throw new Error('Задача не найдена в каталоге. Обновите страницу.');

    const profileId = activeProfileId;
    const { proposal: newProposal } = await projectApi.submitProposal(profileId, proposalData);
    if (activeProfileRef.current !== profileId) return;

    // Mark card as applied
    setCards((prev) =>
      prev.map((c) =>
        c.id === proposalData.cardId
          ? { ...c, hasApplied: true, applicantsCount: c.applicantsCount + 1 }
          : c
      )
    );

    setProposals((previous) => [newProposal, ...previous]);
    refreshState();
    showToast(`Предложение команды успешно отправлено на рассмотрение бизнесу!`);
  };

  const handlePublishNewCard = async (newCard: TaskCard) => {
    const profileId = activeProfileId;
    const { card } = await projectApi.publishCard(profileId, { ...newCard, businessId: profileId });
    if (activeProfileRef.current !== profileId) return;
    setCards((previous) => [card, ...previous]);
    refreshState();
    showToast(`Задача сохранена на сервере и опубликована с рейтингом ${card.readinessScore} б.!`);
  };

  const handleSelection = async (proposalId: string, action: 'accept' | 'reject') => {
    if (selectionRequests.current.has(proposalId)) return;
    selectionRequests.current.add(proposalId);
    setPendingSelections([...selectionRequests.current]);
    setSelectionError('');
    const profileId = activeProfileId;
    try {
      const { proposal } = await projectApi.selectProposal(profileId, proposalId, action);
      if (activeProfileRef.current !== profileId) return;
      setProposals((previous) => previous.map((item) => item.id === proposalId ? proposal : item));
      refreshState();
      showToast(action === 'accept' ? 'Выбор команды сохранён на сервере.' : 'Отклонение предложения сохранено на сервере.');
    } catch (error) {
      if (activeProfileRef.current === profileId) setSelectionError(errorMessage(error));
    } finally {
      selectionRequests.current.delete(proposalId);
      setPendingSelections([...selectionRequests.current]);
    }
  };

  const handleJoinTeam = (teamId: string) => {
    showToast('Демонстрация: заявка на вступление не отправляется на сервер.');
  };

  const handleCreateTeam = (newTeam: TeamSquad) => {
    setTeams([newTeam, ...teams]);
    showToast('Демо-команда создана только в текущей вкладке.');
  };

  const savedCount = cards.filter((c) => c.saved).length;
  const appliedCount = cards.filter((c) => c.hasApplied).length;
  const currentNotifications = stateProfileId === activeProfileId ? notifications : [];
  const unreadCount = currentNotifications.filter((item) => !item.readAt).length;
  const visibleError = profileLoadError || loadError;

  return (
    <div className="min-h-screen bg-[#111216] text-[#F3F4F6] flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 left-4 sm:left-auto right-4 sm:right-6 max-w-lg z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1C1E29] border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={switchRole}
        activeCardsCount={cards.length}
        onOpenAiCreator={openConstructor}
        onOpenProfiles={openProfiles}
        profileName={activeProfile.name}
        unreadCount={unreadCount}
        onOpenNotifications={() => { if (activeProfileId) { setIsNotificationsOpen(true); refreshState(); } else openProfiles(); }}
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
          onOpenAiCreator={openConstructor}
          savedCount={savedCount}
          appliedCount={appliedCount}
          onOpenProfiles={openProfiles}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <p className="text-xs text-neutral-400 rounded-xl border border-white/[0.08] p-3">
              Демо без паролей: любой посетитель может выбрать профиль. Профили, задачи, отклики и уведомления сохраняются на сервере. Команды и закладки — демонстрационные.
            </p>
            <nav aria-label="Навигация на мобильном" className="md:hidden flex gap-2 overflow-x-auto pb-1">
              {(currentRole === 'student' ? [['cards', 'Карты'], ['applied', 'Мои отклики'], ['saved', 'Сохранённые'], ['team', 'Команда']] : [['cards', 'Мои карты'], ['applicants', 'Отклики студентов']]).map(([id, title]) => <button key={id} onClick={() => setActiveTab(id)} className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border ${activeTab === id ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : 'text-neutral-400 border-white/10'}`}>{title}</button>)}
            </nav>
            {(isLoading || !profilesReady || stateProfileId !== activeProfileId) && !visibleError && <p role="status" className="text-sm text-amber-300">Загружаем данные профиля…</p>}
            {visibleError && (
              <div role="alert" className="p-4 rounded-xl border border-red-500/30 text-red-300 text-sm">
                {visibleError}
                <button onClick={() => { setProfileReloadVersion((value) => value + 1); refreshState(); }} className="ml-3 underline">Повторить загрузку</button>
              </div>
            )}
            {selectionError && <p role="alert" className="text-sm text-red-300">{selectionError}</p>}
            {/* Business View */}
            {profilesReady && !isLoading && !visibleError && stateProfileId === activeProfileId && (currentRole === 'business' ? (
              <BusinessDashboard
                key={activeProfileId}
                businessProfile={businessProfile}
                cards={cards.filter((card) => card.businessId === businessProfile.id)}
                proposals={proposals}
                activeTab={activeTab}
                onOpenConstructor={openConstructor}
                onAcceptProposal={(id) => { void handleSelection(id, 'accept'); }}
                onRejectProposal={(id) => { void handleSelection(id, 'reject'); }}
                pendingSelections={pendingSelections}
                onViewCardDetails={handleViewDetails}
                focusedProposalId={focusedProposalId}
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
                          Рейтинг показывает полноту задачи; задачи с рейтингом 90–100 б. выделены в топе
                        </p>
                      </div>

                      {/* Quick switch to Business banner if needed */}
                      <button
                        onClick={() => switchRole('business')}
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
                          <div key={card.id} className="space-y-2">
                          {activeTab === 'applied' && <p className="text-xs text-amber-300 px-1">Статус отклика: {proposals.find((proposal) => proposal.cardId === card.id)?.status === 'accepted' ? 'Команда выбрана бизнесом' : proposals.find((proposal) => proposal.cardId === card.id)?.status === 'rejected' ? 'Предложение отклонено' : 'Ожидает решения бизнеса'}</p>}
                          <TaskCardItem
                            card={card}
                            onApply={handleApplyClick}
                            onToggleSave={handleToggleSave}
                            onViewDetails={handleViewDetails}
                          />
                          </div>
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
            ))}
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      {isProfileManagerOpen && <ProfileManager role={currentRole} profiles={profiles.filter((profile) => profile.role === currentRole)} currentId={activeProfileId} onSelect={selectProfile} onSave={saveProfile} onClose={() => setIsProfileManagerOpen(false)} />}
      {isNotificationsOpen && <NotificationsPanel notifications={currentNotifications} profileName={activeProfile.name} loadError={visibleError} onClose={() => setIsNotificationsOpen(false)} onOpen={openNotification} onReadAll={readAllNotifications} onRefresh={refreshState} />}
      {/* 1. Task Details Modal */}
      <TaskDetailsModal
        studentActions={currentRole === 'student'}
        card={cards.find((card) => card.id === selectedCardForDetails?.id) || selectedCardForDetails}
        isOpen={!!selectedCardForDetails}
        onClose={() => setSelectedCardForDetails(null)}
        onApply={(card) => {
          setSelectedCardForDetails(null);
          setSelectedCardForApply(card);
        }}
        onToggleSave={handleToggleSave}
      />

      {/* 2. Team Proposal Apply Modal */}
      {selectedCardForApply && <ApplyModal
        key={`${studentProfile.id}:${selectedCardForApply.id}`}
        card={selectedCardForApply}
        student={studentProfile}
        isOpen={!!selectedCardForApply}
        onClose={() => setSelectedCardForApply(null)}
        onSubmitProposal={handleSubmitProposal}
      />}

      {/* 3. Task Constructor Modal (Сквозной сценарий хакатона: Черновик -> Уточнения ИИ -> Карточка -> Рейтинг -> Публикация) */}
      {isConstructorOpen && <TaskConstructorModal
        isOpen={isConstructorOpen}
        onClose={() => setIsConstructorOpen(false)}
        onPublishCard={handlePublishNewCard}
        defaultCompany={businessProfile.company}
      />}
    </div>
  );
}
