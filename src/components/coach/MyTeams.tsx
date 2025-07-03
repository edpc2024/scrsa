import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Target, TrendingUp, Star, Plus, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface CoachTeam {
  id: string;
  name: string;
  sport_id: string;
  gender: 'men' | 'women' | 'mixed';
  founded_year: number;
  is_active: boolean;
  wins: number;
  losses: number;
  draws: number;
  sports?: { name: string };
  player_count: number;
  recent_performance: string;
}

const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCoachTeams();
    }
  }, [user?.id]);

  const fetchCoachTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teams where the current user is the coach
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          sport_id,
          gender,
          founded_year,
          is_active,
          wins,
          losses,
          draws,
          sports(name)
        `)
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (teamsError) {
        throw teamsError;
      }

      // For each team, get player count
      const teamsWithPlayerCount = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('player_teams')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);

          // Calculate recent performance trend
          const totalMatches = team.wins + team.losses + team.draws;
          const winRate = totalMatches > 0 ? Math.round((team.wins / totalMatches) * 100) : 0;
          
          let recentPerformance = 'No matches';
          if (totalMatches > 0) {
            if (winRate >= 70) recentPerformance = 'Excellent';
            else if (winRate >= 50) recentPerformance = 'Good';
            else if (winRate >= 30) recentPerformance = 'Average';
            else recentPerformance = 'Needs Improvement';
          }

          return {
            ...team,
            player_count: count || 0,
            recent_performance: recentPerformance
          };
        })
      );

      setTeams(teamsWithPlayerCount);
    } catch (err) {
      console.error('Error fetching coach teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
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

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'men': return 'bg-blue-100 text-blue-700';
      case 'women': return 'bg-pink-100 text-pink-700';
      case 'mixed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600 bg-green-50';
      case 'Good': return 'text-blue-600 bg-blue-50';
      case 'Average': return 'text-yellow-600 bg-yellow-50';
      case 'Needs Improvement': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
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
        <p className="text-red-600">Error loading teams: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
          <p className="text-gray-600 mt-1">Teams under your coaching</p>
        </div>
        <div className="text-sm text-gray-500">
          {teams.length} team{teams.length !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Assigned</h3>
          <p className="text-gray-600 mb-4">
            You haven't been assigned to coach any teams yet. Contact your administrator to get assigned to teams.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-800 mb-2">How to get assigned to teams:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Contact your club administrator</li>
              <li>Ask them to edit existing teams in Teams Management</li>
              <li>Request to be assigned as the coach for specific teams</li>
              <li>Once assigned, your teams will appear here</li>
            </ol>
          </div>
        </div>
      ) : (
        <>
          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{getSportIcon(team.sports?.name || '')}</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getGenderColor(team.gender)}`}>
                    {team.gender}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.sports?.name} • Founded {team.founded_year}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span className={team.player_count > 0 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {team.player_count} player{team.player_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{getWinRate(team.wins, team.losses, team.draws)}% win rate</span>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-lg text-center ${getPerformanceColor(team.recent_performance)}`}>
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{team.recent_performance}</span>
                    </div>
                  </div>
                  
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
                </div>
              </div>
            ))}
          </div>

          {/* Team Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Overall Coaching Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
                <div className="text-sm text-gray-600">Teams Coached</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {teams.reduce((sum, team) => sum + team.player_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {teams.reduce((sum, team) => sum + team.wins, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Wins</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {teams.length > 0 ? Math.round(
                    teams.reduce((sum, team) => {
                      const total = team.wins + team.losses + team.draws;
                      return sum + (total > 0 ? (team.wins / total) * 100 : 0);
                    }, 0) / teams.length
                  ) : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Win Rate</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyTeams;