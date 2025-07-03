import React from 'react';
import { Trophy, Star, TrendingUp, Users, Target } from 'lucide-react';
import { useSupabaseTeams } from '../../hooks/useSupabase';

interface TeamSpotlightProps {
  userRole: string;
}

const TeamSpotlight: React.FC<TeamSpotlightProps> = ({ userRole }) => {
  const { teams } = useSupabaseTeams();

  // Calculate team performance and get top performers
  const teamsWithPerformance = teams.map(team => {
    const totalMatches = team.wins + team.losses + team.draws;
    const winRate = totalMatches > 0 ? Math.round((team.wins / totalMatches) * 100) : 0;
    return { ...team, totalMatches, winRate };
  }).sort((a, b) => b.winRate - a.winRate);

  const topTeam = teamsWithPerformance[0];
  const featuredTeams = teamsWithPerformance.slice(0, 3);

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

  if (!topTeam) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-600" />
          Team Spotlight
        </h3>
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No teams available yet</p>
          <p className="text-sm text-gray-400">Teams will appear here once they're created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Star className="h-5 w-5 mr-2 text-yellow-600" />
        Team Spotlight
      </h3>

      {/* Featured Team */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">{getSportIcon(topTeam.sports?.name || '')}</div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{topTeam.name}</h4>
              <p className="text-sm text-gray-600">Top Performing Team</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-600 mb-1">
              <Trophy className="h-5 w-5 mr-1" />
              <span className="font-bold text-lg">{topTeam.winRate}%</span>
            </div>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{topTeam.wins}</p>
            <p className="text-xs text-gray-600">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{topTeam.losses}</p>
            <p className="text-xs text-gray-600">Losses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{topTeam.draws}</p>
            <p className="text-xs text-gray-600">Draws</p>
          </div>
        </div>
      </div>

      {/* Other Top Teams */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
          Top Performers
        </h4>
        <div className="space-y-3">
          {featuredTeams.map((team, index) => (
            <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-200">
                  <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                </div>
                <div className="text-2xl">{getSportIcon(team.sports?.name || '')}</div>
                <div>
                  <p className="font-medium text-gray-900">{team.name}</p>
                  <p className="text-xs text-gray-500">{team.sports?.name} • {team.gender}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.winRate >= 70 ? 'bg-green-100 text-green-700' :
                    team.winRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {team.winRate}% Win Rate
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {team.wins}W - {team.losses}L - {team.draws}D
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Tip */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-2">
          <Target className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-800">Performance Tip</span>
        </div>
        <p className="text-xs text-blue-700">
          {userRole === 'coach' 
            ? "Focus on consistent training and team coordination to improve win rates. Regular practice sessions show significant impact on performance."
            : "Teams with regular training schedules and active player participation tend to have higher win rates and better team cohesion."
          }
        </p>
      </div>
    </div>
  );
};

export default TeamSpotlight;