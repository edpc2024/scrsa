import React from 'react';
import { BarChart3, TrendingUp, Trophy, Users, Calendar, Target, Award, Star } from 'lucide-react';
import { useSupabaseTeams, useSupabasePlayers, useSupabaseEvents } from '../../hooks/useSupabase';

const Analytics: React.FC = () => {
  const { teams } = useSupabaseTeams();
  const { players } = useSupabasePlayers();
  const { events } = useSupabaseEvents();

  // Calculate real statistics
  const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
  const totalLosses = teams.reduce((sum, team) => sum + team.losses, 0);
  const totalDraws = teams.reduce((sum, team) => sum + team.draws, 0);
  const totalMatches = totalWins + totalLosses + totalDraws;
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  
  const activePlayers = players.filter(p => p.is_active).length;
  const upcomingEvents = events.filter(e => e.status === 'scheduled').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;

  // Calculate team performance data
  const teamPerformance = teams.map(team => {
    const totalTeamMatches = team.wins + team.losses + team.draws;
    const winRate = totalTeamMatches > 0 ? Math.round((team.wins / totalTeamMatches) * 100) : 0;
    return {
      ...team,
      totalMatches: totalTeamMatches,
      winRate
    };
  }).sort((a, b) => b.winRate - a.winRate);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">Performance insights and statistical analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wins</p>
              <p className="text-2xl font-bold text-gray-900">{totalWins}</p>
              <p className="text-xs text-green-600 mt-1">{overallWinRate}% win rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Players</p>
              <p className="text-2xl font-bold text-gray-900">{activePlayers}</p>
              <p className="text-xs text-green-600 mt-1">{players.length} total players</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Events This Month</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              <p className="text-xs text-blue-600 mt-1">{upcomingEvents} upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{overallWinRate}%</p>
              <p className="text-xs text-green-600 mt-1">Across all teams</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {teamPerformance.slice(0, 5).map((team) => (
              <div key={team.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSportIcon(team.sports?.name || '')}</span>
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-500">{team.wins}W - {team.losses}L - {team.draws}D</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${team.winRate >= 60 ? 'text-green-600' : team.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {team.winRate}% Win Rate
                  </p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${team.winRate >= 60 ? 'bg-green-500' : team.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${team.winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            
            {teamPerformance.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No team performance data available yet.</p>
                <p className="text-sm">Teams will appear here once they start playing matches.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Player Registrations</p>
                <p className="text-sm text-gray-500">New members joined</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">+{players.length}</p>
                <p className="text-xs text-green-600">↑ Total registered</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Events Completed</p>
                <p className="text-sm text-gray-500">This period</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{completedEvents}</p>
                <p className="text-xs text-blue-600">↑ Events finished</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Teams</p>
                <p className="text-sm text-gray-500">Currently competing</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{teams.filter(t => t.is_active).length}</p>
                <p className="text-xs text-orange-600">↑ Teams active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Rating System</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-4xl mb-2">🏆</div>
            <h4 className="font-semibold text-gray-900">Excellent</h4>
            <p className="text-sm text-gray-500 mb-2">Win Rate: 70%+</p>
            <div className="flex items-center justify-center space-x-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg font-bold text-yellow-600 mt-2">5 Stars</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-4xl mb-2">🥈</div>
            <h4 className="font-semibold text-gray-900">Good</h4>
            <p className="text-sm text-gray-500 mb-2">Win Rate: 50-69%</p>
            <div className="flex items-center justify-center space-x-1">
              {[1,2,3,4].map(i => (
                <Star key={i} className="h-4 w-4 fill-blue-400 text-blue-400" />
              ))}
              <Star className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-blue-600 mt-2">4 Stars</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-4xl mb-2">🥉</div>
            <h4 className="font-semibold text-gray-900">Average</h4>
            <p className="text-sm text-gray-500 mb-2">Win Rate: 30-49%</p>
            <div className="flex items-center justify-center space-x-1">
              {[1,2,3].map(i => (
                <Star key={i} className="h-4 w-4 fill-green-400 text-green-400" />
              ))}
              {[4,5].map(i => (
                <Star key={i} className="h-4 w-4 text-gray-300" />
              ))}
            </div>
            <p className="text-lg font-bold text-green-600 mt-2">3 Stars</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">How Win Percentage is Calculated</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-2">Formula:</p>
              <code className="bg-white px-2 py-1 rounded border">
                Win Rate = (Wins ÷ Total Matches) × 100
              </code>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-2">Example:</p>
              <p className="text-gray-600">
                Team with 15 wins out of 20 matches = (15 ÷ 20) × 100 = 75% win rate
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <Award className="h-4 w-4 inline mr-1" />
              <strong>Current Overall Win Rate:</strong> {overallWinRate}% across all {teams.length} teams
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;