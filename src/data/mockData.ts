import { Sport, Team, Player, Event, Performance, CommitteeMember } from '../types';

export const sports: Sport[] = [
  { id: '1', name: 'Cricket', category: 'team', icon: 'Trophy' },
  { id: '2', name: 'Volleyball', category: 'team', icon: 'Circle' },
  { id: '3', name: 'Football', category: 'team', icon: 'Target' },
  { id: '4', name: 'Handball', category: 'team', icon: 'Hand' },
  { id: '5', name: 'Athletics', category: 'individual', icon: 'Zap' },
  { id: '6', name: 'Gymnastics', category: 'individual', icon: 'Star' },
];

export const teams: Team[] = [
  {
    id: '1',
    name: 'SCRSA Cricket Men',
    sportId: '1',
    gender: 'men',
    coachId: '3',
    isActive: true,
    foundedYear: 2020,
  },
  {
    id: '2',
    name: 'SCRSA Cricket Women',
    sportId: '1',
    gender: 'women',
    coachId: '3',
    isActive: true,
    foundedYear: 2021,
  },
  {
    id: '3',
    name: 'SCRSA Volleyball Men',
    sportId: '2',
    gender: 'men',
    coachId: '3',
    isActive: true,
    foundedYear: 2019,
  },
];

export const players: Player[] = [
  {
    id: '1',
    userId: '4',
    teams: ['1'],
    position: 'Batsman',
    jerseyNumber: 10,
    dateJoined: '2024-01-15',
    isActive: true,
    stats: {
      matchesPlayed: 25,
      wins: 18,
      losses: 7,
      draws: 0,
      personalBests: { runs: 95, average: 45.2 },
    },
  },
];

export const events: Event[] = [
  {
    id: '1',
    name: 'Inter-Club Cricket Championship',
    sportId: '1',
    date: '2024-03-15',
    location: 'Central Sports Ground',
    type: 'tournament',
    teams: ['1'],
    status: 'scheduled',
  },
  {
    id: '2',
    name: 'Monthly Volleyball Tournament',
    sportId: '2',
    date: '2024-02-20',
    location: 'Indoor Sports Hall',
    type: 'tournament',
    teams: ['3'],
    status: 'completed',
  },
];

export const performances: Performance[] = [
  {
    id: '1',
    eventId: '2',
    teamId: '3',
    position: 2,
    score: 85,
    notes: 'Strong performance in semifinals',
    metrics: { setsWon: 3, setsLost: 1, points: 75 },
  },
];

export const committeeMembers: CommitteeMember[] = [
  {
    id: '1',
    userId: '2',
    position: 'president',
    startDate: '2024-01-01',
    isActive: true,
  },
];