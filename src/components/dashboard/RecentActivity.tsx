import React from 'react';
import { Clock, Trophy, Users, Calendar, TrendingUp, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useSupabaseEvents, useSupabaseTeams, useSupabasePlayers, useSupabaseUsers } from '../../hooks/useSupabase';

interface Activity {
  id: string;
  type: 'event' | 'team' | 'player' | 'performance' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  color: string;
  priority: 'high' | 'medium' | 'low';
  relativeTime: string;
}

const RecentActivity: React.FC = () => {
  const { events, loading: eventsLoading } = useSupabaseEvents();
  const { teams, loading: teamsLoading } = useSupabaseTeams();
  const { players, loading: playersLoading } = useSupabasePlayers();
  const { users, loading: usersLoading } = useSupabaseUsers();

  const isLoading = eventsLoading || teamsLoading || playersLoading || usersLoading;

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const generateActivities = (): Activity[] => {
    const activities: Activity[] = [];

    // Recent events (scheduled or completed)
    const recentEvents = events
      .filter(event => {
        const eventDate = new Date(event.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return eventDate >= weekAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    recentEvents.forEach(event => {
      const isCompleted = event.status === 'completed';
      const isUpcoming = event.status === 'scheduled';
      
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        title: isCompleted ? 'Match Completed' : isUpcoming ? 'Event Scheduled' : 'Event Updated',
        description: `${event.name} - ${event.sports?.name || 'Unknown Sport'}`,
        timestamp: event.created_at,
        icon: isCompleted ? CheckCircle : Calendar,
        color: isCompleted ? 'bg-green-100 text-green-600 border-green-200' : 'bg-blue-100 text-blue-600 border-blue-200',
        priority: isUpcoming ? 'high' : 'medium',
        relativeTime: getRelativeTime(event.created_at),
      });
    });

    // Recent teams
    const recentTeams = teams
      .filter(team => {
        const teamDate = new Date(team.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return teamDate >= weekAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);

    recentTeams.forEach(team => {
      activities.push({
        id: `team-${team.id}`,
        type: 'team',
        title: 'New Team Created',
        description: `${team.name} (${team.sports?.name || 'Unknown Sport'}) - ${team.gender}`,
        timestamp: team.created_at,
        icon: Trophy,
        color: 'bg-green-100 text-green-600 border-green-200',
        priority: 'medium',
        relativeTime: getRelativeTime(team.created_at),
      });
    });

    // Recent players
    const recentPlayers = players
      .filter(player => {
        const playerDate = new Date(player.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return playerDate >= weekAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);

    recentPlayers.forEach(player => {
      activities.push({
        id: `player-${player.id}`,
        type: 'player',
        title: 'Player Registration',
        description: `${player.users?.name || 'Unknown Player'} joined the club`,
        timestamp: player.created_at,
        icon: Users,
        color: 'bg-purple-100 text-purple-600 border-purple-200',
        priority: 'medium',
        relativeTime: getRelativeTime(player.created_at),
      });
    });

    // Recent users
    const recentUsers = users
      .filter(user => {
        const userDate = new Date(user.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return userDate >= weekAgo && user.role !== 'admin'; // Exclude admin users from activity
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'player',
        title: 'New Member Joined',
        description: `${user.name} registered as ${user.role}`,
        timestamp: user.created_at,
        icon: Plus,
        color: 'bg-blue-100 text-blue-600 border-blue-200',
        priority: 'low',
        relativeTime: getRelativeTime(user.created_at),
      });
    });

    // Performance achievements (based on team win rates)
    const highPerformingTeams = teams
      .filter(team => {
        const totalMatches = team.wins + team.losses + team.draws;
        const winRate = totalMatches > 0 ? (team.wins / totalMatches) * 100 : 0;
        return winRate >= 70 && totalMatches >= 3; // Teams with 70%+ win rate and at least 3 matches
      })
      .slice(0, 1);

    highPerformingTeams.forEach(team => {
      const totalMatches = team.wins + team.losses + team.draws;
      const winRate = Math.round((team.wins / totalMatches) * 100);
      
      activities.push({
        id: `achievement-${team.id}`,
        type: 'achievement',
        title: 'Team Achievement',
        description: `${team.name} reached ${winRate}% win rate milestone`,
        timestamp: team.updated_at,
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
        priority: 'medium',
        relativeTime: getRelativeTime(team.updated_at),
      });
    });

    // Sort all activities by timestamp (most recent first)
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Limit to 5 most recent activities
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
  };

  const activities = generateActivities();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </h3>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-4 p-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Recent Activity
        </h3>
        <span className="text-sm text-gray-500">Last 7 days</span>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="group">
              <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200">
                <div className={`p-2 rounded-xl border ${activity.color} group-hover:scale-110 transition-transform`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getPriorityIcon(activity.priority)}
                      <span className="text-xs text-gray-400">{activity.relativeTime}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No recent activity</p>
            <p className="text-sm text-gray-400">Activity will appear here as you use the system</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;