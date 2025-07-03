import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/admin/UserManagement';
import CommitteeManagement from './components/admin/CommitteeManagement';
import SportsManagement from './components/admin/SportsManagement';
import TeamsManagement from './components/teams/TeamsManagement';
import PlayersManagement from './components/players/PlayersManagement';
import EventsManagement from './components/events/EventsManagement';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';
import MyTeams from './components/coach/MyTeams';
import MyPlayers from './components/coach/MyPlayers';
import CoachEvents from './components/coach/CoachEvents';
import Schedule from './components/schedule/Schedule';
import Performance from './components/performance/Performance';
import CoachPerformance from './components/coach/Performance';
import Profile from './components/player/Profile';
import Achievements from './components/player/Achievements';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginForm /> : <Navigate to="/dashboard" replace />} 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><UserManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/committee" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><CommitteeManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/sports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><SportsManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><Analytics /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Admin & Committee Routes */}
      <Route path="/teams" element={
        <ProtectedRoute allowedRoles={['admin', 'committee']}>
          <Layout><TeamsManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/players" element={
        <ProtectedRoute allowedRoles={['admin', 'committee']}>
          <Layout><PlayersManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/events" element={
        <ProtectedRoute allowedRoles={['admin', 'committee']}>
          <Layout><EventsManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['committee']}>
          <Layout><Analytics /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Coach Routes */}
      <Route path="/my-teams" element={
        <ProtectedRoute allowedRoles={['coach']}>
          <Layout><MyTeams /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/my-players" element={
        <ProtectedRoute allowedRoles={['coach']}>
          <Layout><MyPlayers /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/my-events" element={
        <ProtectedRoute allowedRoles={['coach']}>
          <Layout><CoachEvents /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/performance" element={
        <ProtectedRoute allowedRoles={['coach']}>
          <Layout><CoachPerformance /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Player Routes */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['player']}>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/my-performance" element={
        <ProtectedRoute allowedRoles={['player']}>
          <Layout><Performance /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/achievements" element={
        <ProtectedRoute allowedRoles={['player']}>
          <Layout><Achievements /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Shared Routes */}
      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={['coach', 'player']}>
          <Layout><Schedule /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;