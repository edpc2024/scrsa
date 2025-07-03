import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Calendar, 
  Trophy, 
  BarChart3, 
  UserPlus, 
  Target,
  Settings,
  FileText,
  Award
} from 'lucide-react';

interface QuickActionsProps {
  userRole: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ userRole }) => {
  const getQuickActions = () => {
    switch (userRole) {
      case 'admin':
        return [
          { icon: UserPlus, label: 'Add User', path: '/users', color: 'bg-blue-500 hover:bg-blue-600' },
          { icon: Trophy, label: 'Create Team', path: '/teams', color: 'bg-green-500 hover:bg-green-600' },
          { icon: Calendar, label: 'Schedule Event', path: '/events', color: 'bg-orange-500 hover:bg-orange-600' },
          { icon: BarChart3, label: 'View Analytics', path: '/analytics', color: 'bg-purple-500 hover:bg-purple-600' },
          { icon: Settings, label: 'System Settings', path: '/settings', color: 'bg-gray-500 hover:bg-gray-600' },
        ];
      case 'committee':
        return [
          { icon: Trophy, label: 'Manage Teams', path: '/teams', color: 'bg-blue-500 hover:bg-blue-600' },
          { icon: Users, label: 'Manage Players', path: '/players', color: 'bg-green-500 hover:bg-green-600' },
          { icon: Calendar, label: 'Create Event', path: '/events', color: 'bg-orange-500 hover:bg-orange-600' },
          { icon: FileText, label: 'View Reports', path: '/reports', color: 'bg-purple-500 hover:bg-purple-600' },
        ];
      case 'coach':
        return [
          { icon: Trophy, label: 'My Teams', path: '/my-teams', color: 'bg-blue-500 hover:bg-blue-600' },
          { icon: Users, label: 'My Players', path: '/my-players', color: 'bg-green-500 hover:bg-green-600' },
          { icon: Target, label: 'Performance', path: '/performance', color: 'bg-orange-500 hover:bg-orange-600' },
          { icon: Calendar, label: 'Schedule', path: '/schedule', color: 'bg-purple-500 hover:bg-purple-600' },
        ];
      case 'player':
        return [
          { icon: Users, label: 'My Profile', path: '/profile', color: 'bg-blue-500 hover:bg-blue-600' },
          { icon: Calendar, label: 'My Schedule', path: '/schedule', color: 'bg-green-500 hover:bg-green-600' },
          { icon: Target, label: 'Performance', path: '/my-performance', color: 'bg-orange-500 hover:bg-orange-600' },
          { icon: Award, label: 'Achievements', path: '/achievements', color: 'bg-purple-500 hover:bg-purple-600' },
        ];
      default:
        return [];
    }
  };

  const actions = getQuickActions();

  if (actions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Plus className="h-5 w-5 mr-2 text-blue-600" />
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className={`${action.color} text-white p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
          >
            <div className="flex flex-col items-center text-center">
              <action.icon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;