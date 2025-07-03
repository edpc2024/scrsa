export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'committee' | 'coach' | 'player';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CommitteeMember {
  id: string;
  userId: string;
  position: 'president' | 'secretary' | 'treasurer' | 'executive';
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Sport {
  id: string;
  name: string;
  category: 'team' | 'individual';
  icon: string;
}

export interface Team {
  id: string;
  name: string;
  sportId: string;
  gender: 'men' | 'women' | 'mixed';
  coachId: string;
  isActive: boolean;
  foundedYear: number;
}

export interface Player {
  id: string;
  userId: string;
  teams: string[];
  position?: string;
  jerseyNumber?: number;
  dateJoined: string;
  isActive: boolean;
  stats?: PlayerStats;
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  personalBests: Record<string, number>;
}

export interface Event {
  id: string;
  name: string;
  sportId: string;
  date: string;
  location: string;
  type: 'league' | 'tournament' | 'friendly' | 'training';
  teams: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Performance {
  id: string;
  eventId: string;
  teamId: string;
  playerId?: string;
  position: number;
  score?: number;
  notes?: string;
  metrics: Record<string, number>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}