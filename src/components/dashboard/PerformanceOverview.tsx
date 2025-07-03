import React from 'react';
import { TrendingUp, Trophy, Users, Target, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { useSupabaseTeams, useSupabasePlayers, useSupabaseEvents } from '../../hooks/useSupabase';

const PerformanceOverview: React.FC = () => {
  const { teams } = useSupabaseTeams();
  const { players } = useSupabasePlayers();
  const { events } = useSupabaseEvents();

  // Calculate performance metrics
  const totalMatches = teams.reduce((sum, team) => sum + team.wins + team.losses + team.draws, 0);
  const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const activePlayers = players.filter(p => p.is_active).length;
  const upcomingEvents = events.filter(e => e.status === 'scheduled').length;

  // Mock trend data (in a real app, this would come from historical data)
  const trends = {
    winRate: { value: overallWinRate, change: 5, isPositive: true },
    activePlayers: { value: activePlayers, change: 8, isPositive: true },
    events: { value: upcomingEvents, change: -2, isPositive: false },
    engagement: { value: 87, change: 12, isPositive: true }
  };

  const performanceMetrics = [
    {
      title: 'Overall Win Rate',
      value: `${trends.winRate.value}%`,
      change: trends.winRate.change,
      isPositive: trends.winRate.isPositive,
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Across all teams'
    },
    {
      title: 'Active Players',
      value: trends.activePlayers.value,
      change: trends.activePlayers.change,
      isPositive: trends.activePlayers.isPositive,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Currently registered'
    },
    {
      title: 'Upcoming Events',
      value: trends.events.value,
      change: trends.events.change,
      isPositive: trends.events.isPositive,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'This month'
    },
    {
      title: 'Engagement Score',
      value: `${trends.engagement.value}%`,
      change: trends.engagement.change,
      isPositive: trends.engagement.isPositive,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Player participation'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Performance Overview
        </h3>
        <span className="text-sm text-gray-500">Last 30 days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="relative group">
            <div className={`${metric.bgColor} rounded-xl p-4 transition-all duration-200 group-hover:scale-105`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  metric.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.isPositive ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm font-medium text-gray-700 mb-1">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">Strong Performance</span>
            </div>
            <p className="text-xs text-green-700">
              Win rate has improved by {trends.winRate.change}% this month, indicating strong team performance across all sports.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-blue-800">Growing Community</span>
            </div>
            <p className="text-xs text-blue-700">
              Player registration has increased by {trends.activePlayers.change}%, showing growing interest in club activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;