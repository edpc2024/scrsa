import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Search, Edit, Trash2, Users, Calendar, Target, X } from 'lucide-react';
import { useSupabaseTeams, useSupabaseUsers, SupabaseTeam } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';

interface TeamFormData {
  name: string;
  sport_id: string;
  gender: 'men' | 'women' | 'mixed';
  coach_id: string;
  founded_year: number;
}

interface Sport {
  id: string;
  name: string;
}

const TeamsManagement: React.FC = () => {
  const { teams, loading, error, addTeam, updateTeam, deleteTeam } = useSupabaseTeams();
  const { users } = useSupabaseUsers();
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SupabaseTeam | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    sport_id: '',
    gender: 'men',
    coach_id: '',
    founded_year: new Date().getFullYear(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamPlayerCounts, setTeamPlayerCounts] = useState<Record<string, number>>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Fetch sports
  useEffect(() => {
    const fetchSports = async () => {
      const { data } = await supabase.from('sports').select('id, name');
      setSports(data || []);
    };
    fetchSports();
  }, []);

  // Fetch team player counts
  useEffect(() => {
    const fetchTeamPlayerCounts = async () => {
      try {
        console.log('🔍 Fetching team player counts...');
        
        const { data: playerTeamData, error } = await supabase
          .from('player_teams')
          .select(`
            team_id,
            player_id,
            is_active,
            players!inner(is_active),
            teams!inner(name)
          `)
          .eq('is_active', true)
          .eq('players.is_active', true);

        if (error) {
          console.error('❌ Error fetching team player counts:', error);
          setDebugInfo(`Error fetching player counts: ${error.message}`);
          return;
        }

        console.log('📊 Player-team data:', playerTeamData);

        // Count players per team
        const counts: Record<string, number> = {};
        playerTeamData?.forEach(pt => {
          if (pt.team_id) {
            counts[pt.team_id] = (counts[pt.team_id] || 0) + 1;
          }
        });

        console.log('📊 Team player counts:', counts);
        setTeamPlayerCounts(counts);
        
        const totalAssignments = Object.values(counts).reduce((sum, count) => sum + count, 0);
        setDebugInfo(`Loaded player counts for ${Object.keys(counts).length} teams. Total player assignments: ${totalAssignments}`);
        
      } catch (err) {
        console.error('❌ Exception fetching team player counts:', err);
        setDebugInfo(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    if (teams.length > 0) {
      fetchTeamPlayerCounts();
    }
  }, [teams]);

  const coaches = users.filter(user => user.role === 'coach');

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (team.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'all' || team.sport_id === selectedSport;
    const matchesGender = selectedGender === 'all' || team.gender === selectedGender;
    return matchesSearch && matchesSport && matchesGender;
  });

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addTeam({
        name: formData.name,
        sport_id: formData.sport_id,
        gender: formData.gender,
        coach_id: formData.coach_id,
        founded_year: formData.founded_year,
        is_active: true,
        wins: 0,
        losses: 0,
        draws: 0,
      });
      
      setFormData({
        name: '',
        sport_id: '',
        gender: 'men',
        coach_id: '',
        founded_year: new Date().getFullYear(),
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add team:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    setIsSubmitting(true);
    
    try {
      await updateTeam(selectedTeam.id, {
        name: formData.name,
        sport_id: formData.sport_id,
        gender: formData.gender,
        coach_id: formData.coach_id,
        founded_year: formData.founded_year,
      });
      
      setFormData({
        name: '',
        sport_id: '',
        gender: 'men',
        coach_id: '',
        founded_year: new Date().getFullYear(),
      });
      setShowEditModal(false);
      setSelectedTeam(null);
    } catch (err) {
      console.error('Failed to update team:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteTeam(selectedTeam.id);
      setShowDeleteModal(false);
      setSelectedTeam(null);
    } catch (err) {
      console.error('Failed to delete team:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (team: SupabaseTeam) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      sport_id: team.sport_id,
      gender: team.gender,
      coach_id: team.coach_id,
      founded_year: team.founded_year,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (team: SupabaseTeam) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName?.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'volleyball': return '🏐';
      case 'football': return '⚽';
      case 'handball': return '🤾';
      case 'athletics': return '🏃';
      case 'gymnastics': return '🤸';
      default: return '🏆';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'men': return 'bg-blue-100 text-blue-700';
      case 'women': return 'bg-pink-100 text-pink-700';
      case 'mixed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getTeamPlayerCount = (teamId: string) => {
    return teamPlayerCounts[teamId] || 0;
  };

  const getTotalPlayers = () => {
    return Object.values(teamPlayerCounts).reduce((sum, count) => sum + count, 0);
  };

  const TeamModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Team' : 'Add New Team'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setFormData({
                name: '',
                sport_id: '',
                gender: 'men',
                coach_id: '',
                founded_year: new Date().getFullYear(),
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={isEdit ? handleEditTeam : handleAddTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              required
              value={formData.sport_id}
              onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a sport</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender Category
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coach
            </label>
            <select
              required
              value={formData.coach_id}
              onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a coach</option>
              {coaches.map(coach => (
                <option key={coach.id} value={coach.id}>{coach.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Founded Year
            </label>
            <input
              type="number"
              required
              min="1900"
              max={new Date().getFullYear()}
              value={formData.founded_year}
              onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({
                  name: '',
                  sport_id: '',
                  gender: 'men',
                  coach_id: '',
                  founded_year: new Date().getFullYear(),
                });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Team' : 'Add Team')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delete Team</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? This action cannot be undone and will remove all associated data.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteTeam}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Team'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading teams: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
          <p className="text-gray-600 mt-1">Manage sports teams and their performance</p>
          {debugInfo && (
            <p className="text-sm text-blue-600 mt-1">{debugInfo}</p>
          )}
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Team</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sports</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredTeams.map((team) => {
            const playerCount = getTeamPlayerCount(team.id);
            return (
              <div key={team.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{getSportIcon(team.sports?.name || '')}</div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(team)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(team)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">Coach: {team.users?.name}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getGenderColor(team.gender)}`}>
                      {team.gender}
                    </span>
                    <span className="text-xs text-gray-500">Founded {team.founded_year}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span className={playerCount > 0 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {playerCount} player{playerCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{getWinRate(team.wins, team.losses, team.draws)}% win rate</span>
                    </div>
                  </div>
                  
                  {playerCount === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-700 font-medium">⚠️ No Players Assigned</p>
                      <p className="text-xs text-yellow-600">Add players in Players Management</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-green-100 text-green-700 py-1 rounded">
                      <div className="font-semibold">{team.wins}</div>
                      <div>Wins</div>
                    </div>
                    <div className="bg-red-100 text-red-700 py-1 rounded">
                      <div className="font-semibold">{team.losses}</div>
                      <div>Losses</div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 py-1 rounded">
                      <div className="font-semibold">{team.draws}</div>
                      <div>Draws</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center text-sm ${team.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`h-2 w-2 rounded-full mr-2 ${team.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{team.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalPlayers()}</p>
              <p className="text-xs text-gray-500">Across all teams</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900">
                {teams.filter(t => t.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sports</p>
              <p className="text-2xl font-bold text-gray-900">{sports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <TeamModal />}
      {showEditModal && <TeamModal isEdit />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default TeamsManagement;