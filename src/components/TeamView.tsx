import React, { useState } from 'react';
import { TeamSquad } from '../types';
import { Users, Plus, UserCheck, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react';

interface TeamViewProps {
  teams: TeamSquad[];
  onCreateTeam: (newTeam: TeamSquad) => void;
  onJoinTeam: (teamId: string) => void;
  studentName: string;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teams,
  onCreateTeam,
  onJoinTeam,
  studentName,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetCardTitle, setTargetCardTitle] = useState('ИИ для систем управления картами (NVIDIA)');
  const [neededRolesStr, setNeededRolesStr] = useState('Frontend (React), DevOps');
  const [description, setDescription] = useState('');
  const [joinedTeamIds, setJoinedTeamIds] = useState<string[]>([]);

  const handleJoin = (teamId: string) => {
    setJoinedTeamIds([...joinedTeamIds, teamId]);
    onJoinTeam(teamId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTeam: TeamSquad = {
      id: `team-${Date.now()}`,
      title,
      targetCardTitle,
      targetCompany: 'StartCard Partner',
      leader: {
        name: studentName,
        role: 'Team Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        id: '12345'
      },
      members: [
        {
          name: studentName,
          role: 'Team Lead / Developer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        }
      ],
      neededRoles: neededRolesStr.split(',').map(s => s.trim()).filter(Boolean),
      description: description || 'Формируем команду для совместного решения кейса на максимальный результат.',
      status: 'recruiting'
    };

    onCreateTeam(newTeam);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1E202B] via-[#1A1C25] to-[#251E18] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">
              Команды & Хакатон-скводы
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-xl">
            Объединяйтесь со студентами других специальностей для решения сложных кейсов StartCard.ai (ML + Frontend + Backend + Design)
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Собрать команду</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => {
          const isJoined = joinedTeamIds.includes(team.id);
          return (
            <div
              key={team.id}
              className="p-5 rounded-2xl bg-[#191A23] border border-white/[0.08] hover:border-amber-400/30 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Team Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {team.title}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-mono mt-0.5">
                      Кейс: {team.targetCardTitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    Идет набор
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  {team.description}
                </p>

                {/* Current Members */}
                <div className="mb-3">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase mb-2">
                    Участники ({team.members.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-200"
                      >
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{m.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({m.role})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needed Roles */}
                {team.neededRoles && team.neededRoles.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[11px] font-mono text-orange-400 uppercase mb-1.5 font-bold">
                      Ищут в команду:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {team.neededRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-mono"
                        >
                          + {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Лидер: {team.leader.name}
                </span>

                {isJoined ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Заявка отправлена</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(team.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-bold border border-white/[0.1] transition-all"
                  >
                    <span>Вступить</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#161720] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white">
              Создать команду для решения StartCard
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Название команды
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bauman AI Squad, CyberCard..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1E202B] text-sm text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Целевой кейс / задача
                </label>
                <input
                  type="text"
                  value={targetCardTitle}
                  onChange={(e) => setTargetCardTitle(e.target.value)}
                  className="w-full bg-[#1E202B] text-sm text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Кого ищете (через запятую)
                </label>
                <input
                  type="text"
                  value={neededRolesStr}
                  onChange={(e) => setNeededRolesStr(e.target.value)}
                  placeholder="Frontend, ML Engineer, Designer"
                  className="w-full bg-[#1E202B] text-sm text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">
                  Краткое описание планов
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите ваши цели и опыт..."
                  className="w-full bg-[#1E202B] text-xs text-white p-2.5 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-orange-500/20"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
