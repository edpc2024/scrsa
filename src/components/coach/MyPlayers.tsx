import React, { useState, useEffect } from 'react';
import { UserCheck, Trophy, Target, TrendingUp, Star, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface CoachPlayer {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  date_joined: string;
  is_active: boolean;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  personal_best?: string;
  users?: {
    name: string;
    email: string;
  };
  teams: Array<{
    id: string;
    name: string;
    sports?: { name: string };
  }>;
  coach_rating?: number;
  coach_notes?: string;
}

interface PlayerRating {
  player_id: string;
  rating: number;
  notes: string;
}

const MyPlayers: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<CoachPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCoachPlayers();
    }
  }, [user?.id]);

  const fetchCoachPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get teams coached by this user
      const { data: coachTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, sports(name)')
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (teamsError) {
        throw teamsError;
      }

      if (!coachTeams || coachTeams.length === 0) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const teamIds = coachTeams.map(team => team.id);

      // Get players from those teams
      const { data: playerTeamsData, error: playerTeamsError } = await supabase
        .from('player_teams')
        .select(`
          player_id,
          team_id,
          players!inner(
            id,
            user_id,
            position,
            jersey_number,
            date_joined,
            is_active,
            matches_played,
            wins,
            losses,
            draws,
            personal_best,
            users(name, email)
          ),
          teams!inner(id, name, sports(name))
        `)
        .in('team_id', teamIds)
        .eq('is_active', true)
        .eq('players.is_active', true);

      if (playerTeamsError) {
        throw playerTeamsError;
      }

      // Group players by player_id and collect their teams
      const playersMap = new Map<string, CoachPlayer>();

      playerTeamsData?.forEach(pt => {
        const player = pt.players;
        const team = pt.teams;

        if (!playersMap.has(player.id)) {
          playersMap.set(player.id, {
            ...player,
            teams: []
          });
        }

        const existingPlayer = playersMap.get(player.id)!;
        if (!existingPlayer.teams.find(t => t.id === team.id)) {
          existingPlayer.teams.push(team);
        }
      });

      const uniquePlayers = Array.from(playersMap.values());

      // Fetch existing ratings for these players
      const { data: ratingsData } = await supabase
        .from('player_stats')
        .select('player_id, stats')
        .in('player_id', uniquePlayers.map(p => p.id))
        .eq('season_year', new Date().getFullYear());

      // Initialize ratings state
      const initialRatings: Record<string, PlayerRating> = {};
      uniquePlayers.forEach(player => {
        const existingRating = ratingsData?.find(r => r.player_id === player.id);
        const stats = existingRating?.stats as any;
        
        initialRatings[player.id] = {
          player_id: player.id,
          rating: stats?.coach_rating || 0,
          notes: stats?.coach_notes || ''
        };
      });

      setRatings(initialRatings);
      setPlayers(uniquePlayers);
    } catch (err) {
      console.error('Error fetching coach players:', err);
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (playerId: string, field: 'rating' | 'notes', value: number | string) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const savePlayerRating = async (playerId: string) => {
    try {
      setSaving(playerId);
      const rating = ratings[playerId];

      // Check if player_stats record exists for this year
      const { data: existingStats, error: fetchError } = await supabase
        .from('player_stats')
        .select('id, stats')
        .eq('player_id', playerId)
        .eq('season_year', new Date().getFullYear())
        .single();

      const updatedStats = {
        ...(existingStats?.stats || {}),
        coach_rating: rating.rating,
        coach_notes: rating.notes,
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
        // Create new record
        const player = players.find(p => p.id === playerId);
        const teamSportId = player?.teams[0]?.id; // Use first team's sport

        if (!teamSportId) {
          throw new Error('Unable to determine sport for player');
        }

        // Get sport_id from team
        const { data: teamData } = await supabase
          .from('teams')
          .select('sport_id')
          .eq('id', teamSportId)
          .single();

        const { error: insertError } = await supabase
          .from('player_stats')
          .insert({
            player_id: playerId,
            sport_id: teamData?.sport_id,
            season_year: new Date().getFullYear(),
            stats: updatedStats
          });

        if (insertError) throw insertError;
      }

      setEditingPlayer(null);
    } catch (err) {
      console.error('Error saving player rating:', err);
      alert('Failed to save rating. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    if (rating >= 2) return 'text-orange-600';
    if (rating >= 1) return 'text-red-600';
    return 'text-gray-400';
  };

  const StarRating: React.FC<{ rating: number; onChange?: (rating: number) => void; readonly?: boolean }> = ({ 
    rating, 
    onChange, 
    readonly = false 
  }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange && onChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
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
        <p className="text-red-600">Error loading players: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Players</h1>
          <p className="text-gray-600 mt-1">Players under your coaching</p>
        </div>
        <div className="text-sm text-gray-500">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <UserCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Found</h3>
          <p className="text-gray-600 mb-4">
            No players are assigned to your teams yet.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-800 mb-2">To see players here:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Ensure you are assigned as a coach to teams</li>
              <li>Players must be assigned to your teams</li>
              <li>Both you and the players must be marked as "Active"</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const isEditing = editingPlayer === player.id;
            const isSaving = saving === player.id;
            const currentRating = ratings[player.id] || { rating: 0, notes: '' };

            return (
              <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {(player.users?.name || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{player.users?.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {player.position && <span>{player.position}</span>}
                      {player.jersey_number && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          #{player.jersey_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingPlayer(isEditing ? null : player.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    disabled={isSaving}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </button>
                </div>

                {/* Teams */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Teams</p>
                  <div className="flex flex-wrap gap-1">
                    {player.teams.map(team => (
                      <span key={team.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {team.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matches:</span>
                    <span className="font-medium">{player.matches_played}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-medium text-green-600">
                      {getWinRate(player.wins, player.losses)}%
                    </span>
                  </div>
                  {player.personal_best && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best:</span>
                      <span className="font-medium text-blue-600">{player.personal_best}</span>
                    </div>
                  )}
                </div>

                {/* Coach Rating Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Coach Rating</span>
                    {isEditing && (
                      <button
                        onClick={() => savePlayerRating(player.id)}
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
                      rating={currentRating.rating}
                      onChange={isEditing ? (rating) => handleRatingChange(player.id, 'rating', rating) : undefined}
                      readonly={!isEditing}
                    />

                    {isEditing ? (
                      <textarea
                        value={currentRating.notes}
                        onChange={(e) => handleRatingChange(player.id, 'notes', e.target.value)}
                        placeholder="Add notes about player performance..."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                    ) : currentRating.notes ? (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {currentRating.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No notes yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Development Summary */}
      {players.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Player Development Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {players.filter(p => getWinRate(p.wins, p.losses) >= 60).length}
              </div>
              <div className="text-sm text-gray-600">High Performers</div>
              <div className="text-xs text-gray-500">60%+ win rate</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(ratings).filter(r => r.rating >= 4).length}
              </div>
              <div className="text-sm text-gray-600">Top Rated</div>
              <div className="text-xs text-gray-500">4+ stars</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(players.reduce((sum, p) => sum + p.matches_played, 0) / players.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Matches</div>
              <div className="text-xs text-gray-500">per player</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPlayers;