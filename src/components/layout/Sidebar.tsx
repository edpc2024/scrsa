import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Trophy, Calendar, BarChart3, Settings, 
  LogOut, Shield, UserCheck, Gamepad2, Target, Menu, X, Zap 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true); // Changed to true (collapsed by default)

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: Users, label: 'User Management', path: '/users' },
          { icon: Shield, label: 'Committee', path: '/committee' },
          { icon: Zap, label: 'Sports', path: '/sports' },
          { icon: Trophy, label: 'Teams', path: '/teams' },
          { icon: UserCheck, label: 'Players', path: '/players' },
          { icon: Calendar, label: 'Events', path: '/events' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ];
      case 'committee':
        return [
          ...baseItems,
          { icon: Trophy, label: 'Teams', path: '/teams' },
          { icon: UserCheck, label: 'Players', path: '/players' },
          { icon: Calendar, label: 'Events', path: '/events' },
          { icon: BarChart3, label: 'Reports', path: '/reports' },
        ];
      case 'coach':
        return [
          ...baseItems,
          { icon: Trophy, label: 'My Teams', path: '/my-teams' },
          { icon: UserCheck, label: 'My Players', path: '/my-players' },
          { icon: Calendar, label: 'My Events', path: '/my-events' },
          { icon: Target, label: 'Performance', path: '/performance' },
        ];
      case 'player':
        return [
          ...baseItems,
          { icon: Gamepad2, label: 'My Profile', path: '/profile' },
          { icon: Calendar, label: 'Schedule', path: '/schedule' },
          { icon: Target, label: 'Performance', path: '/my-performance' },
          { icon: Trophy, label: 'Achievements', path: '/achievements' },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`bg-white min-h-screen shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header with Toggle Button */}
      <div className={`p-6 border-b border-gray-200 ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCRSA</h1>
                <p className="text-sm text-gray-500">Sports Club</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-600" />
            ) : (
              <X className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-blue-600">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${
                isActive(item.path) ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
              }`} />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={logout}
          className={`w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-red-600" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>

      {/* Collapse Indicator */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;