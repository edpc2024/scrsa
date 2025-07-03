import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, Target, Star, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface CoachEvent {
  id: string;
  name: string;
  sport_id: string;
  event_date: string;
  event_time: string;
  location: string;
  type: 'tournament' | 'league' | 'friendly' | 'training';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  result?: string;
  sports?: { name: string };
  event_teams?: Array<{
    teams: {
      id: string;
      name: string;
    };
  }>;
  event_players?: Array<{
    player_id: string;
    players: {
      id: string;
      users: {
        name: string;
      };
    };
  }>;
  performance_captured?: boolean;
}

interface PlayerPerformance {
  player_id: string;
  rating: number;
  notes: string;
}

const CoachEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CoachEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CoachEvent | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [playerPerformances, setPlayerPerformances] = useState<Record<string, PlayerPerformance>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCoachEvents();
    }
  }, [user?.id]);

  const fetchCoachEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching events for coach:', user?.id);

      // Get teams coached by this user
      const { data: coachTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (teamsError) {
        throw teamsError;
      }

      if (!coachTeams || coachTeams.length === 0) {
        console.log('ℹ️ No teams found for coach');
        setEvents([]);
        setLoading(false);
        return;
      }

      const teamIds = coachTeams.map(t => t.id);
      console.log('📊 Coach teams:', teamIds);

      // Get events where coach's teams are participating
      const { data: eventTeams, error: eventTeamsError } = await supabase
        .from('event_teams')
        .select('event_id')
        .in('team_id', teamIds);

      if (eventTeamsError) {
        throw eventTeamsError;
      }

      const eventIds = eventTeams?.map(et => et.event_id) || [];
      console.log('📊 Event IDs:', eventIds);

      if (eventIds.length === 0) {
        console.log('ℹ️ No events found for coach teams');
        setEvents([]);
        setLoading(false);
        return;
      }

      // Get event details
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          sport_id,
          event_date,
          event_time,
          location,
          type,
          status,
          result,
          sports(name),
          event_teams(
            teams(id, name)
          ),
          event_players(
            player_id,
            players(
              id,
              users(name)
            )
          )
        `)
        .in('id', eventIds)
        .order('event_date', { ascending: true });

      if (eventsError) {
        throw eventsError;
      }

      console.log('✅ Events loaded:', eventsData?.length || 0);

      // Check which events have performance data captured
      const eventsWithPerformance = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: performances } = await supabase
            .from('performances')
            .select('id')
            .eq('event_id', event.id)
            .limit(1);

          return {
            ...event,
            performance_captured: (performances?.length || 0) > 0
          };
        })
      );

      setEvents(eventsWithPerformance);

    } catch (err) {
      console.error('❌ Error fetching coach events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openPerformanceModal = async (event: CoachEvent) => {
    setSelectedEvent(event);
    
    // Initialize player performances
    const initialPerformances: Record<string, PlayerPerformance> = {};
    
    if (event.event_players) {
      // Fetch existing performance data
      const { data: existingPerformances } = await supabase
        .from('performances')
        .select('player_id, score, notes, metrics')
        .eq('event_id', event.id);

      event.event_players.forEach(ep => {
        const existing = existingPerformances?.find(p => p.player_id === ep.player_id);
        initialPerformances[ep.player_id] = {
          player_id: ep.player_id,
          rating: existing?.score || 3,
          notes: existing?.notes || ''
        };
      });
    }

    setPlayerPerformances(initialPerformances);
    setShowPerformanceModal(true);
  };

  const updatePlayerPerformance = (playerId: string, field: 'rating' | 'notes', value: number | string) => {
    setPlayerPerformances(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const savePerformances = async () => {
    if (!selectedEvent) return;

    try {
      setSaving(true);

      // Delete existing performances for this event
      await supabase
        .from('performances')
        .delete()
        .eq('event_id', selectedEvent.id);

      // Insert new performances
      const performanceInserts = Object.values(playerPerformances).map(perf => ({
        event_id: selectedEvent.id,
        player_id: perf.player_id,
        team_id: null, // We'll set this based on the player's team
        score: perf.rating,
        position: null,
        notes: perf.notes,
        metrics: { coach_rating: perf.rating }
      }));

      if (performanceInserts.length > 0) {
        const { error } = await supabase
          .from('performances')
          .insert(performanceInserts);

        if (error) throw error;
      }

      // Update event status to completed if it was ongoing
      if (selectedEvent.status === 'ongoing') {
        await supabase
          .from('events')
          .update({ status: 'completed' })
          .eq('id', selectedEvent.id);
      }

      // Refresh events data
      await fetchCoachEvents();
      
      setShowPerformanceModal(false);
      setSelectedEvent(null);
      
    } catch (err) {
      console.error('Error saving performances:', err);
      alert('Failed to save performances. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'ongoing': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tournament': return 'bg-red-100 text-red-700';
      case 'league': return 'bg-blue-100 text-blue-700';
      case 'friendly': return 'bg-green-100 text-green-700';
      case 'training': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName?.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'volleyball': return '🏐';
      case 'football': return '⚽';
      case 'handball': return '🤾';
      case 'athletics': return '🏃';
      case 'gymnastics': return '🤸';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'swimming': return '🏊';
      default: return '🏆';
    }
  };

  const StarRating: React.FC<{ rating: number; onChange?: (rating: number) => void; readonly?: boolean }> = ({ 
    rating, 
    onChange, 
    readonly = false 
  }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange && onChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading events: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <p className="text-gray-600 mt-1">Events where your teams are participating</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600 mb-4">
            No events are scheduled for your teams yet.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-800 mb-2">To see events here:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Ensure you are assigned as a coach to teams</li>
              <li>Events must be created and your teams assigned to them</li>
              <li>Events will appear here once they're scheduled</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDate = new Date(event.event_date);
            const isUpcoming = eventDate > new Date();
            const canCapturePerformance = event.status === 'ongoing' || event.status === 'completed';

            return (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getSportIcon(event.sports?.name || '')}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-500">{event.sports?.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getEventStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{eventDate.toLocaleDateString()} at {event.event_time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  {event.event_teams && event.event_teams.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{event.event_teams.map(et => et.teams.name).join(' vs ')}</span>
                    </div>
                  )}
                  {event.event_players && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>{event.event_players.length} players selected</span>
                    </div>
                  )}
                </div>

                {/* Performance Section */}
                <div className="border-t pt-4">
                  {event.performance_captured ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <Target className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Performance Captured</span>
                      </div>
                      <button
                        onClick={() => openPerformanceModal(event)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View/Edit
                      </button>
                    </div>
                  ) : canCapturePerformance ? (
                    <button
                      onClick={() => openPerformanceModal(event)}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Target className="h-4 w-4" />
                      <span>Capture Performance</span>
                    </button>
                  ) : event.event_players && event.event_players.length === 0 ? (
                    <div className="flex items-center text-orange-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">No players selected</span>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Clock className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-sm">
                        {isUpcoming ? 'Performance capture available after event' : 'Waiting for event to start'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Capture Modal */}
      {showPerformanceModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Capture Performance</h3>
                <p className="text-sm text-gray-500">{selectedEvent.name}</p>
              </div>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedEvent.event_players && selectedEvent.event_players.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.event_players.map((ep) => {
                    const performance = playerPerformances[ep.player_id] || { rating: 3, notes: '' };
                    
                    return (
                      <div key={ep.player_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {ep.players.users.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{ep.players.users.name}</h4>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Performance Rating
                            </label>
                            <StarRating
                              rating={performance.rating}
                              onChange={(rating) => updatePlayerPerformance(ep.player_id, 'rating', rating)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={performance.notes}
                              onChange={(e) => updatePlayerPerformance(ep.player_id, 'notes', e.target.value)}
                              placeholder="Add performance notes..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No players selected for this event</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePerformances}
                disabled={saving || !selectedEvent.event_players || selectedEvent.event_players.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Performance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachEvents;