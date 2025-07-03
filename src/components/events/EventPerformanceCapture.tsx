import React, { useState, useEffect } from 'react';
import { Trophy, Target, Star, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Player {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  users?: {
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface PerformanceData {
  player_id: string;
  score?: number;
  position?: number;
  notes?: string;
  metrics: Record<string, any>;
}

interface EventPerformanceCaptureProps {
  eventId: string;
  eventName: string;
  teams: Team[];
  onClose: () => void;
}

const EventPerformanceCapture: React.FC<EventPerformanceCaptureProps> = ({
  eventId,
  eventName,
  teams,
  onClose
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [performances, setPerformances] = useState<Record<string, PerformanceData>>({});
  const [teamPerformances, setTeamPerformances] = useState<Record<string, { position: number; score: number; notes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEventPlayers();
    fetchExistingPerformances();
  }, [eventId]);

  const fetchEventPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('event_players')
        .select(`
          player_id,
          players!inner(
            id,
            user_id,
            position,
            jersey_number,
            users(name)
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const playersList = data?.map(ep => ep.players) || [];
      setPlayers(playersList);

      // Initialize performance data for each player
      const initialPerformances: Record<string, PerformanceData> = {};
      playersList.forEach(player => {
        initialPerformances[player.id] = {
          player_id: player.id,
          score: undefined,
          position: undefined,
          notes: '',
          metrics: {}
        };
      });
      setPerformances(initialPerformances);

      // Initialize team performance data
      const initialTeamPerformances: Record<string, any> = {};
      teams.forEach(team => {
        initialTeamPerformances[team.id] = {
          position: undefined,
          score: undefined,
          notes: ''
        };
      });
      setTeamPerformances(initialTeamPerformances);

    } catch (error) {
      console.error('Error fetching event players:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPerformances = async () => {
    try {
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      const existingPerformances: Record<string, PerformanceData> = {};
      const existingTeamPerformances: Record<string, any> = {};

      data?.forEach(perf => {
        if (perf.player_id) {
          existingPerformances[perf.player_id] = {
            player_id: perf.player_id,
            score: perf.score,
            position: perf.position,
            notes: perf.notes || '',
            metrics: perf.metrics || {}
          };
        }
        if (perf.team_id && !perf.player_id) {
          existingTeamPerformances[perf.team_id] = {
            position: perf.position,
            score: perf.score,
            notes: perf.notes || ''
          };
        }
      });

      setPerformances(prev => ({ ...prev, ...existingPerformances }));
      setTeamPerformances(prev => ({ ...prev, ...existingTeamPerformances }));
    } catch (error) {
      console.error('Error fetching existing performances:', error);
    }
  };

  const updatePlayerPerformance = (playerId: string, field: keyof PerformanceData, value: any) => {
    setPerformances(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const updateTeamPerformance = (teamId: string, field: string, value: any) => {
    setTeamPerformances(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing performances for this event
      await supabase
        .from('performances')
        .delete()
        .eq('event_id', eventId);

      const performanceInserts = [];

      // Add player performances
      Object.values(performances).forEach(perf => {
        if (perf.score !== undefined || perf.position !== undefined || perf.notes) {
          performanceInserts.push({
            event_id: eventId,
            player_id: perf.player_id,
            team_id: null,
            score: perf.score || null,
            position: perf.position || null,
            notes: perf.notes || null,
            metrics: perf.metrics || {}
          });
        }
      });

      // Add team performances
      Object.entries(teamPerformances).forEach(([teamId, teamPerf]) => {
        if (teamPerf.score !== undefined || teamPerf.position !== undefined || teamPerf.notes) {
          performanceInserts.push({
            event_id: eventId,
            player_id: null,
            team_id: teamId,
            score: teamPerf.score || null,
            position: teamPerf.position || null,
            notes: teamPerf.notes || null,
            metrics: {}
          });
        }
      });

      if (performanceInserts.length > 0) {
        const { error } = await supabase
          .from('performances')
          .insert(performanceInserts);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving performances:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Capture Performance</h3>
            <p className="text-sm text-gray-500">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Team Performance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-blue-600" />
              Team Performance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">{team.name}</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={teamPerformances[team.id]?.position || ''}
                        onChange={(e) => updateTeamPerformance(team.id, 'position', parseInt(e.target.value) || undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="1st, 2nd..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        value={teamPerformances[team.id]?.score || ''}
                        onChange={(e) => updateTeamPerformance(team.id, 'score', parseFloat(e.target.value) || undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Points/Goals"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={teamPerformances[team.id]?.notes || ''}
                      onChange={(e) => updateTeamPerformance(team.id, 'notes', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={2}
                      placeholder="Team performance notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Player Performance */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-green-600" />
              Individual Player Performance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(player => (
                <div key={player.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {player.users?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{player.users?.name}</p>
                      <p className="text-xs text-gray-500">
                        {player.position} {player.jersey_number && `#${player.jersey_number}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        value={performances[player.id]?.score || ''}
                        onChange={(e) => updatePlayerPerformance(player.id, 'score', parseFloat(e.target.value) || undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Points"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={performances[player.id]?.position || ''}
                        onChange={(e) => updatePlayerPerformance(player.id, 'position', parseInt(e.target.value) || undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Rank"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={performances[player.id]?.notes || ''}
                      onChange={(e) => updatePlayerPerformance(player.id, 'notes', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={2}
                      placeholder="Performance notes..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {players.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No players selected for this event</p>
                <p className="text-sm">Select players first to capture their performance.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Performance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPerformanceCapture;