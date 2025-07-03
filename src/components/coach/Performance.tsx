import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Trophy, BarChart3, Users, Calendar, Star, Award, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface TeamPerformance {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  player_count: number;
  avg_rating: number;
  team_rating: number; // Coach's rating for the team
  team_notes: string;
  sports?: { name: string };
}

interface PlayerPerformance {
  id: string;
  name: string;
  matches_played: number;
  wins: number;
  losses: number;
  coach_rating: number;
  coach_notes: string;
  team_name: string;
  improvement_trend: 'up' | 'down' | 'stable';
}

const Performance: React.FC = () => {
  const { user } = useAuth();
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<PlayerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPerformanceData();
    }
  }, [user?.id, selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teams coached by this user
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          wins,
          losses,
          draws,
          sports(name)
        `)
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      if (!teams || teams.length === 0) {
        setTeamPerformance([]);
        setPlayerPerformance([]);
        setLoading(false);
        return;
      }

      const teamIds = teams.map(t => t.id);

      // Get player counts and ratings for each team
      const teamsWithPerformance = await Promise.all(
        teams.map(async (team) => {
          // Get player count
          const { count: playerCount } = await supabase
            .from('player_teams')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);

          // Get players for this team
          const { data: teamPlayers } = await supabase
            .from('player_teams')
            .select('player_id')
            .eq('team_id', team.id)
            .eq('is_active', true);

          const playerIds = teamPlayers?.map(tp => tp.player_id) || [];

          // Get player stats and ratings
          const { data: playerStats } = await supabase
            .from('player_stats')
            .select('stats')
            .eq('season_year', new Date().getFullYear())
            .in('player_id', playerIds);

          const ratings = playerStats?.map(ps => (ps.stats as any)?.coach_rating || 0).filter(r => r > 0) || [];
          const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

          // For demo purposes, initialize with default values
          const teamRating = 3; // Default team rating
          const teamNotes = 'Click edit to add performance notes for this team.'; // Default team notes

          return {
            ...team,
            player_count: playerCount || 0,
            avg_rating: Math.round(avgRating * 10) / 10,
            team_rating: teamRating,
            team_notes: teamNotes
          };
        })
      );

      setTeamPerformance(teamsWithPerformance);

      // Fetch individual player performance
      const { data: playerTeamsData } = await supabase
        .from('player_teams')
        .select(`
          player_id,
          team_id,
          players!inner(
            id,
            matches_played,
            wins,
            losses,
            users(name)
          ),
          teams!inner(name)
        `)
        .in('team_id', teamIds)
        .eq('is_active', true)
        .eq('players.is_active', true);

      // Get player ratings
      const playerIds = playerTeamsData?.map(pt => pt.players.id) || [];
      const { data: playerStats } = await supabase
        .from('player_stats')
        .select('player_id, stats')
        .in('player_id', playerIds)
        .eq('season_year', new Date().getFullYear());

      const playersWithPerformance: PlayerPerformance[] = playerTeamsData?.map(pt => {
        const player = pt.players;
        const team = pt.teams;
        const stats = playerStats?.find(ps => ps.player_id === player.id);
        const coachRating = (stats?.stats as any)?.coach_rating || 3; // Default to 3 stars
        const coachNotes = (stats?.stats as any)?.coach_notes || 'Click edit to add performance notes.';

        // Calculate improvement trend (simplified)
        const winRate = player.wins + player.losses > 0 ? player.wins / (player.wins + player.losses) : 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (winRate > 0.6) trend = 'up';
        else if (winRate < 0.4) trend = 'down';

        return {
          id: player.id,
          name: player.users?.name || 'Unknown',
          matches_played: player.matches_played,
          wins: player.wins,
          losses: player.losses,
          coach_rating: coachRating,
          coach_notes: coachNotes,
          team_name: team.name,
          improvement_trend: trend
        };
      }) || [];

      setPlayerPerformance(playersWithPerformance.sort((a, b) => b.coach_rating - a.coach_rating));

    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const updateTeamRating = (teamId: string, rating: number, notes?: string) => {
    setTeamPerformance(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, team_rating: rating, team_notes: notes !== undefined ? notes : team.team_notes }
        : team
    ));
  };

  const updatePlayerRating = (playerId: string, rating: number, notes?: string) => {
    setPlayerPerformance(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, coach_rating: rating, coach_notes: notes !== undefined ? notes : player.coach_notes }
        : player
    ));
  };

  const saveTeamRating = async (teamId: string) => {
    try {
      setSaving(teamId);
      const team = teamPerformance.find(t => t.id === teamId);
      if (!team) return;

      // In a real app, you'd save this to a team_ratings table
      // For now, we'll just simulate saving and show success
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      console.log('Team rating saved:', { teamId, rating: team.team_rating, notes: team.team_notes });
      
      setEditingTeam(null);
    } catch (err) {
      console.error('Error saving team rating:', err);
      alert('Failed to save team rating. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const savePlayerRating = async (playerId: string) => {
    try {
      setSaving(playerId);
      const player = playerPerformance.find(p => p.id === playerId);
      if (!player) return;

      // Check if player_stats record exists for this year
      const { data: existingStats, error: fetchError } = await supabase
        .from('player_stats')
        .select('id, stats')
        .eq('player_id', playerId)
        .eq('season_year', new Date().getFullYear())
        .maybeSingle();

      const updatedStats = {
        ...(existingStats?.stats || {}),
        coach_rating: player.coach_rating,
        coach_notes: player.coach_notes,
        last_updated: new Date().toISOString()
      };

      if (existingStats) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('player_stats')
          .update({ stats: updatedStats })
          .eq('id', existingStats.id);

        if (updateError) throw updateError;
      } else {
        // Create new record - need to get sport_id from player's team
        const { data: playerTeam } = await supabase
          .from('player_teams')
          .select('teams(sport_id)')
          .eq('player_id', playerId)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (playerTeam?.teams?.sport_id) {
          const { error: insertError } = await supabase
            .from('player_stats')
            .insert({
              player_id: playerId,
              sport_id: playerTeam.teams.sport_id,
              season_year: new Date().getFullYear(),
              stats: updatedStats
            });

          if (insertError) throw insertError;
        }
      }

      setEditingPlayer(null);
    } catch (err) {
      console.error('Error saving player rating:', err);
      alert('Failed to save rating. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName?.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'volleyball': return '🏐';
      case 'football': return '⚽';
      case 'handball': return '🤾';
      case 'athletics': return '🏃';
      case 'gymnastics': return '🤸';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'swimming': return '🏊';
      default: return '🏆';
    }
  };

  const StarRating: React.FC<{ 
    rating: number; 
    onChange?: (rating: number) => void; 
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ rating, onChange, readonly = false, size = 'md' }) => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    const handleStarClick = (starValue: number) => {
      if (!readonly && onChange) {
        onChange(starValue);
      }
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleStarClick(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none disabled:cursor-default`}
            tabIndex={readonly ? -1 : 0}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : readonly 
                    ? 'text-gray-300'
                    : 'text-gray-300 hover:text-yellow-300'
              } transition-colors`}
            />
          </button>
        ))}
        {!readonly && (
          <span className="ml-2 text-sm text-gray-500">
            {rating}/5
          </span>
        )}
      </div>
    );
  };

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
        <p className="text-red-600">Error loading performance data: {error}</p>
      </div>
    );
  }

  // Calculate overall metrics
  const totalMatches = teamPerformance.reduce((sum, team) => sum + team.wins + team.losses + team.draws, 0);
  const totalWins = teamPerformance.reduce((sum, team) => sum + team.wins, 0);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const totalPlayers = teamPerformance.reduce((sum, team) => sum + team.player_count, 0);
  const avgTeamRating = teamPerformance.length > 0 
    ? teamPerformance.reduce((sum, team) => sum + team.avg_rating, 0) / teamPerformance.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Track and analyze your teams' performance</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Overall Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{overallWinRate}%</p>
              <p className="text-xs text-gray-500">{totalWins} wins of {totalMatches} matches</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalPlayers}</p>
              <p className="text-xs text-gray-500">Across {teamPerformance.length} teams</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Team Rating</p>
              <p className="text-2xl font-bold text-gray-900">{avgTeamRating.toFixed(1)}</p>
              <div className="mt-1">
                <StarRating rating={Math.round(avgTeamRating)} readonly size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {playerPerformance.filter(p => p.coach_rating >= 4).length}
              </p>
              <p className="text-xs text-gray-500">4+ star players</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Team Performance Rating
        </h3>
        
        {teamPerformance.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No teams assigned</p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator to get assigned to teams</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPerformance.map((team) => {
              const isEditing = editingTeam === team.id;
              const isSaving = saving === team.id;

              return (
                <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getSportIcon(team.sports?.name || '')}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-500">{team.sports?.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingTeam(isEditing ? null : team.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      disabled={isSaving}
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Win Rate:</span>
                      <span className="font-medium text-green-600">
                        {getWinRate(team.wins, team.losses, team.draws)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Players:</span>
                      <span className="font-medium">{team.player_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Player Avg:</span>
                      <div className="flex items-center space-x-1">
                        <StarRating rating={Math.round(team.avg_rating)} readonly size="sm" />
                        <span className="text-xs text-gray-500">({team.avg_rating.toFixed(1)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Rating Section */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Team Rating</span>
                      {isEditing && (
                        <button
                          onClick={() => saveTeamRating(team.id)}
                          disabled={isSaving}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <StarRating
                        rating={team.team_rating}
                        onChange={isEditing ? (rating) => updateTeamRating(team.id, rating) : undefined}
                        readonly={!isEditing}
                      />

                      {isEditing ? (
                        <textarea
                          value={team.team_notes}
                          onChange={(e) => updateTeamRating(team.id, team.team_rating, e.target.value)}
                          placeholder="Add notes about team performance..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                        />
                      ) : (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {team.team_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Players */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" />
          Top Performing Players
        </h3>
        
        {playerPerformance.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No player data available</p>
            <p className="text-sm text-gray-400 mt-2">Players will appear here once they're assigned to your teams</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playerPerformance.slice(0, 10).map((player, index) => {
              const isEditing = editingPlayer === player.id;
              const isSaving = saving === player.id;

              return (
                <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-200">
                      <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{player.name}</p>
                      <p className="text-sm text-gray-500">{player.team_name}</p>
                      <p className="text-xs text-gray-500">
                        {player.wins}W-{player.losses}L ({player.matches_played} matches)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {isEditing ? (
                        <div className="space-y-2 min-w-[200px]">
                          <div className="flex items-center justify-center">
                            <StarRating
                              rating={player.coach_rating}
                              onChange={(rating) => updatePlayerRating(player.id, rating)}
                            />
                          </div>
                          <textarea
                            value={player.coach_notes}
                            onChange={(e) => updatePlayerRating(player.id, player.coach_rating, e.target.value)}
                            placeholder="Add performance notes..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-1 mb-1">
                            <StarRating rating={player.coach_rating} readonly />
                          </div>
                          {player.coach_notes && player.coach_notes !== 'Click edit to add performance notes.' && (
                            <div className="text-xs text-gray-500 max-w-48 text-right">
                              {player.coach_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(player.improvement_trend)}
                      
                      {isEditing ? (
                        <button
                          onClick={() => savePlayerRating(player.id)}
                          disabled={isSaving}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingPlayer(player.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit player rating"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;