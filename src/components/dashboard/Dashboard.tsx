import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardCards from './DashboardCards';
import RecentActivity from './RecentActivity';
import UpcomingEvents from './UpcomingEvents';
import QuickActions from './QuickActions';
import PerformanceOverview from './PerformanceOverview';
import TeamSpotlight from './TeamSpotlight';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'committee':
        return 'Committee Dashboard';
      case 'coach':
        return 'Coach Dashboard';
      case 'player':
        return 'Player Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';
    
    return `${greeting}, ${user?.name}!`;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 transform translate-x-16 -translate-y-8">
          <div className="w-64 h-64 bg-white opacity-5 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-16 translate-y-8">
          <div className="w-48 h-48 bg-white opacity-5 rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getDashboardTitle()}</h1>
            <p className="text-blue-100 text-lg">{getWelcomeMessage()}</p>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-blue-200">Your Role</p>
              <p className="text-xl font-semibold capitalize">{user?.role}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions userRole={user?.role || ''} />

      {/* Main Stats Cards */}
      <DashboardCards userRole={user?.role || ''} />

      {/* Performance Overview for Admins/Committee */}
      {(user?.role === 'admin' || user?.role === 'committee') && (
        <PerformanceOverview />
      )}

      {/* Team Spotlight for Coaches/Players */}
      {(user?.role === 'coach' || user?.role === 'player') && (
        <TeamSpotlight userRole={user?.role} />
      )}

      {/* Activity and Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <UpcomingEvents />
      </div>
    </div>
  );
};

export default Dashboard;