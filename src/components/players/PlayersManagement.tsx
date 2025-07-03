import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, Trophy, Target, Calendar, X } from 'lucide-react';
import { useSupabasePlayers, useSupabaseUsers, useSupabaseTeams, SupabasePlayer } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';

interface PlayerFormData {
  user_id: string;
  position: string;
  jersey_number: number;
  date_joined: string;
  team_ids: string[];
}

const PlayersManagement: React.FC = () => {
  const { players, loading, error, addPlayer, updatePlayer, deletePlayer } = useSupabasePlayers();
  const { users } = useSupabaseUsers();
  const { teams } = useSupabaseTeams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<SupabasePlayer | null>(null);
  const [formData, setFormData] = useState<PlayerFormData>({
    user_id: '',
    position: '',
    jersey_number: 1,
    date_joined: new Date().toISOString().split('T')[0],
    team_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerTeams, setPlayerTeams] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const availableUsers = users.filter(user => user.role === 'player');

  // Fetch player-team relationships
  useEffect(() => {
    const fetchPlayerTeams = async () => {
      try {
        console.log('🔍 Fetching player-team relationships...');
        const { data, error } = await supabase
          .from('player_teams')
          .select(`
            player_id,
            team_id,
            is_active,
            teams(id, name, sports(name))
          `);
        
        if (error) {
          console.error('❌ Error fetching player-teams:', error);
          setDebugInfo(`Error fetching player-teams: ${error.message}`);
        } else {
          console.log('✅ Player-team relationships loaded:', data?.length || 0);
          setPlayerTeams(data || []);
          setDebugInfo(`Loaded ${data?.length || 0} player-team relationships`);
        }
      } catch (err) {
        console.error('❌ Exception fetching player-teams:', err);
        setDebugInfo(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    fetchPlayerTeams();
  }, []);

  const filteredPlayers = players.filter(player => {
    const userName = player.users?.name || '';
    const userEmail = player.users?.email || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && player.is_active) ||
                         (selectedStatus === 'inactive' && !player.is_active);
    
    // Filter by team
    let matchesTeam = selectedTeam === 'all';
    if (selectedTeam !== 'all') {
      const playerTeamIds = playerTeams
        .filter(pt => pt.player_id === player.id && pt.is_active)
        .map(pt => pt.team_id);
      matchesTeam = playerTeamIds.includes(selectedTeam);
    }
    
    return matchesSearch && matchesStatus && matchesTeam;
  });

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Starting player creation process...');
      console.log('📊 Form data:', formData);
      
      // Validate required fields
      if (!formData.user_id || !formData.date_joined) {
        throw new Error('User and date joined are required');
      }
      
      if (formData.team_ids.length === 0) {
        throw new Error('At least one team must be selected');
      }
      
      // Step 1: Create the player
      console.log('👤 Creating player record...');
      const newPlayer = await addPlayer({
        user_id: formData.user_id,
        position: formData.position || null,
        jersey_number: formData.jersey_number || null,
        date_joined: formData.date_joined,
        is_active: true,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        personal_best: null,
      });

      if (!newPlayer) {
        throw new Error('Failed to create player record');
      }

      console.log('✅ Player created successfully:', newPlayer.id);

      // Step 2: Create player-team relationships
      console.log('🔗 Creating player-team relationships...');
      console.log('📊 Selected teams:', formData.team_ids);
      
      const playerTeamInserts = formData.team_ids.map(team_id => ({
        player_id: newPlayer.id,
        team_id: team_id,
        joined_date: formData.date_joined,
        is_active: true,
      }));

      console.log('📊 Player-team inserts:', playerTeamInserts);

      const { data: insertedRelations, error: relationError } = await supabase
        .from('player_teams')
        .insert(playerTeamInserts)
        .select(`
          id,
          player_id,
          team_id,
          is_active,
          teams(name, sports(name))
        `);

      if (relationError) {
        console.error('❌ Error creating player-team relationships:', relationError);
        // Try to clean up the player record if team assignment fails
        await supabase.from('players').delete().eq('id', newPlayer.id);
        throw new Error(`Failed to assign player to teams: ${relationError.message}`);
      }

      console.log('✅ Player-team relationships created:', insertedRelations);

      // Step 3: Refresh player-team data
      console.log('🔄 Refreshing player-team data...');
      const { data: updatedPlayerTeams, error: refreshError } = await supabase
        .from('player_teams')
        .select(`
          player_id,
          team_id,
          is_active,
          teams(id, name, sports(name))
        `);
      
      if (refreshError) {
        console.error('⚠️ Error refreshing player-teams:', refreshError);
      } else {
        setPlayerTeams(updatedPlayerTeams || []);
        console.log('✅ Player-team data refreshed');
      }

      // Step 4: Show success message
      const teamNames = formData.team_ids
        .map(teamId => teams.find(t => t.id === teamId)?.name)
        .filter(Boolean)
        .join(', ');
      
      setDebugInfo(`✅ Successfully created player and assigned to teams: ${teamNames}`);
      
      // Reset form and close modal
      setFormData({
        user_id: '',
        position: '',
        jersey_number: 1,
        date_joined: new Date().toISOString().split('T')[0],
        team_ids: [],
      });
      setShowAddModal(false);
      
    } catch (err) {
      console.error('❌ Failed to add player:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setDebugInfo(`❌ Error: ${errorMessage}`);
      alert(`Failed to add player: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    
    setIsSubmitting(true);
    
    try {
      await updatePlayer(selectedPlayer.id, {
        user_id: formData.user_id,
        position: formData.position,
        jersey_number: formData.jersey_number,
        date_joined: formData.date_joined,
      });
      
      setFormData({
        user_id: '',
        position: '',
        jersey_number: 1,
        date_joined: new Date().toISOString().split('T')[0],
        team_ids: [],
      });
      setShowEditModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Failed to update player:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;
    
    setIsSubmitting(true);
    
    try {
      await deletePlayer(selectedPlayer.id);
      setShowDeleteModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Failed to delete player:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlayerStatus = async (playerId: string, currentStatus: boolean) => {
    try {
      await updatePlayer(playerId, { is_active: !currentStatus });
    } catch (err) {
      console.error('Failed to toggle player status:', err);
    }
  };

  const openEditModal = (player: SupabasePlayer) => {
    setSelectedPlayer(player);
    setFormData({
      user_id: player.user_id,
      position: player.position || '',
      jersey_number: player.jersey_number || 1,
      date_joined: player.date_joined,
      team_ids: [],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (player: SupabasePlayer) => {
    setSelectedPlayer(player);
    setShowDeleteModal(true);
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getPlayerTeams = (playerId: string) => {
    return playerTeams
      .filter(pt => pt.player_id === playerId && pt.is_active)
      .map(pt => pt.teams?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getPlayerTeamCount = (playerId: string) => {
    return playerTeams.filter(pt => pt.player_id === playerId && pt.is_active).length;
  };

  const PlayerModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Player' : 'Add New Player'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setFormData({
                user_id: '',
                position: '',
                jersey_number: 1,
                date_joined: new Date().toISOString().split('T')[0],
                team_ids: [],
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Debug Information */}
        {debugInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">{debugInfo}</p>
          </div>
        )}
        
        <form onSubmit={isEdit ? handleEditPlayer : handleAddPlayer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No users with 'player' role found. Create users first.</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Batsman, Forward, Spiker"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jersey Number
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.jersey_number}
              onChange={(e) => setFormData({ ...formData, jersey_number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Joined <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date_joined}
              onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teams <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                required
                value={formData.team_ids}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  team_ids: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={Math.min(teams.length, 6)}
              >
                {teams.filter(team => team.is_active).map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.sports?.name || 'Unknown Sport'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple teams. <strong>You must select at least one team.</strong>
              </p>
              {teams.filter(team => team.is_active).length === 0 && (
                <p className="text-xs text-red-500 mt-1">No active teams available. Create teams first in Teams Management.</p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                Available teams: {teams.filter(team => team.is_active).length}
              </p>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({
                  user_id: '',
                  position: '',
                  jersey_number: 1,
                  date_joined: new Date().toISOString().split('T')[0],
                  team_ids: [],
                });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEdit && formData.team_ids.length === 0)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Player' : 'Add Player')}
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
          <h3 className="text-lg font-semibold text-gray-900">Delete Player</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{selectedPlayer?.users?.name}</strong>? This action cannot be undone and will remove all associated performance data.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeletePlayer}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Player'}
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
        <p className="text-red-600">Error loading players: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players Management</h1>
          <p className="text-gray-600 mt-1">Manage players and their performance across all teams</p>
          {debugInfo && (
            <p className="text-sm text-blue-600 mt-1">{debugInfo}</p>
          )}
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Player</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {(player.users?.name || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {player.jersey_number && (
                    <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                      #{player.jersey_number}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => togglePlayerStatus(player.id, player.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      player.is_active 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openEditModal(player)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(player)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{player.users?.name}</h3>
                  <p className="text-sm text-gray-500">{player.users?.email}</p>
                  {player.position && (
                    <p className="text-sm text-blue-600 font-medium">{player.position}</p>
                  )}
                </div>
                
                {getPlayerTeams(player.id) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-xs text-blue-700 font-medium">Teams ({getPlayerTeamCount(player.id)})</p>
                    <p className="text-sm text-blue-800">{getPlayerTeams(player.id)}</p>
                  </div>
                )}
                
                {!getPlayerTeams(player.id) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-xs text-yellow-700 font-medium">⚠️ No Teams Assigned</p>
                    <p className="text-xs text-yellow-600">This player is not assigned to any team</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>{player.matches_played} matches</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Target className="h-4 w-4 mr-1" />
                    <span>{getWinRate(player.wins, player.losses)}% win rate</span>
                  </div>
                </div>
                
                {player.personal_best && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-xs text-yellow-700 font-medium">Personal Best</p>
                    <p className="text-sm text-yellow-800">{player.personal_best}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {new Date(player.date_joined).toLocaleDateString()}</span>
                  </div>
                  <div className={`flex items-center ${player.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`h-2 w-2 rounded-full mr-2 ${player.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs">{player.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{players.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Players</p>
              <p className="text-2xl font-bold text-gray-900">
                {players.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Players</p>
              <p className="text-2xl font-bold text-gray-900">
                {players.filter(p => getPlayerTeamCount(p.id) > 0).length}
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
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">
                {players.reduce((sum, p) => sum + p.matches_played, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <PlayerModal />}
      {showEditModal && <PlayerModal isEdit />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default PlayersManagement;