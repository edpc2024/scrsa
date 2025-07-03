import React from 'react';
import { Users, Trophy, Calendar, TrendingUp, Target, Award, Zap, Activity } from 'lucide-react';
import { useSupabaseUsers, useSupabaseTeams, useSupabasePlayers, useSupabaseEvents } from '../../hooks/useSupabase';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: string;
  description?: string;
  isLoading?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  description,
  isLoading = false 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className={`p-2 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{trend}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardCards: React.FC<{ userRole: string }> = ({ userRole }) => {
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { teams, loading: teamsLoading } = useSupabaseTeams();
  const { players, loading: playersLoading } = useSupabasePlayers();
  const { events, loading: eventsLoading } = useSupabaseEvents();

  const isLoading = usersLoading || teamsLoading || playersLoading || eventsLoading;

  const getCards = () => {
    const activeUsers = users.filter(u => u.is_active).length;
    const activeTeams = teams.filter(t => t.is_active).length;
    const activePlayers = players.filter(p => p.is_active).length;
    const upcomingEvents = events.filter(e => e.status === 'scheduled').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const totalMatches = teams.reduce((sum, t) => sum + t.wins + t.losses + t.draws, 0);
    const totalWins = teams.reduce((sum, t) => sum + t.wins, 0);
    const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    switch (userRole) {
      case 'admin':
        return [
          { 
            title: 'Total Users', 
            value: users.length, 
            icon: Users, 
            color: 'bg-blue-500', 
            trend: `${activeUsers} active`,
            description: 'Registered members'
          },
          { 
            title: 'Active Teams', 
            value: activeTeams, 
            icon: Trophy, 
            color: 'bg-green-500', 
            trend: `${teams.length} total`,
            description: 'Competing teams'
          },
          { 
            title: 'Upcoming Events', 
            value: upcomingEvents, 
            icon: Calendar, 
            color: 'bg-orange-500',
            description: 'Scheduled events'
          },
          { 
            title: 'System Health', 
            value: '98%', 
            icon: Activity, 
            color: 'bg-purple-500',
            description: 'Platform uptime'
          },
        ];
      case 'committee':
        return [
          { 
            title: 'Teams Managed', 
            value: activeTeams, 
            icon: Trophy, 
            color: 'bg-blue-500',
            description: 'Active teams'
          },
          { 
            title: 'Active Players', 
            value: activePlayers, 
            icon: Users, 
            color: 'bg-green-500',
            description: 'Registered players'
          },
          { 
            title: 'Events This Month', 
            value: upcomingEvents, 
            icon: Calendar, 
            color: 'bg-orange-500',
            description: 'Scheduled events'
          },
          { 
            title: 'Overall Win Rate', 
            value: `${winRate}%`, 
            icon: TrendingUp, 
            color: 'bg-purple-500',
            description: 'Across all teams'
          },
        ];
      case 'coach':
        const coachTeams = Math.min(activeTeams, 3); // Simplified for demo
        const coachPlayers = Math.floor(activePlayers / 2); // Simplified for demo
        return [
          { 
            title: 'My Teams', 
            value: coachTeams, 
            icon: Trophy, 
            color: 'bg-blue-500',
            description: 'Teams coached'
          },
          { 
            title: 'My Players', 
            value: coachPlayers, 
            icon: Users, 
            color: 'bg-green-500',
            description: 'Under coaching'
          },
          { 
            title: 'Training Sessions', 
            value: 12, 
            icon: Target, 
            color: 'bg-orange-500',
            description: 'This month'
          },
          { 
            title: 'Team Win Rate', 
            value: `${winRate}%`, 
            icon: TrendingUp, 
            color: 'bg-purple-500',
            description: 'Average performance'
          },
        ];
      case 'player':
        const playerMatches = totalMatches > 0 ? Math.floor(totalMatches / Math.max(activePlayers, 1)) : 0;
        return [
          { 
            title: 'Teams Joined', 
            value: 2, 
            icon: Trophy, 
            color: 'bg-blue-500',
            description: 'Active memberships'
          },
          { 
            title: 'Matches Played', 
            value: playerMatches, 
            icon: Calendar, 
            color: 'bg-green-500',
            description: 'This season'
          },
          { 
            title: 'Win Rate', 
            value: `${winRate}%`, 
            icon: TrendingUp, 
            color: 'bg-orange-500',
            description: 'Personal performance'
          },
          { 
            title: 'Achievements', 
            value: 5, 
            icon: Award, 
            color: 'bg-purple-500',
            description: 'Earned badges'
          },
        ];
      default:
        return [];
    }
  };

  const cards = getCards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <DashboardCard key={index} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default DashboardCards;