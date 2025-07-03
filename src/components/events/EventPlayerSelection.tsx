import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Check, Search, AlertTriangle, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Player {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  users?: {
    name: string;
    email: string;
  };
}

interface EventPlayerSelectionProps {
  eventId: string;
  eventName: string;
  teamIds: string[];
  onClose: () => void;
}

const EventPlayerSelection: React.FC<EventPlayerSelectionProps> = ({
  eventId,
  eventName,
  teamIds,
  onClose
}) => {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);

  useEffect(() => {
    fetchEventDetailsAndPlayers();
  }, [eventId, teamIds]);

  const fetchEventDetailsAndPlayers = async () => {
    try {
      setLoading(true);
      setDebugInfo('🔍 Loading event details and players...');
      
      console.log('🔍 Fetching event details for:', eventId);

      if (!eventId) {
        throw new Error('Event ID is required');
      }

      // Step 1: Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          sport_id,
          sports(name),
          event_teams(
            team_id,
            teams(id, name, sports(name))
          )
        `)
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('❌ Error fetching event:', eventError);
        throw new Error(`Failed to fetch event details: ${eventError.message}`);
      }

      console.log('📊 Event details:', event);
      setEventDetails(event);

      // Check if event has teams assigned
      const eventTeamIds = event.event_teams?.map(et => et.team_id) || [];
      console.log('📊 Event team IDs from database:', eventTeamIds);
      console.log('📊 Team IDs from props:', teamIds);

      // Use team IDs from the database if available, otherwise use props
      const teamsToUse = eventTeamIds.length > 0 ? eventTeamIds : teamIds;

      if (!teamsToUse || teamsToUse.length === 0) {
        setDebugInfo('❌ No teams assigned to this event. Please assign teams first in Events Management.');
        setAvailablePlayers([]);
        setSelectedPlayers([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Using team IDs:', teamsToUse);

      // Step 2: Get all players from the specified teams
      console.log('🔍 Fetching players from teams...');
      const { data: playerTeamsData, error: playerTeamsError } = await supabase
        .from('player_teams')
        .select(`
          player_id,
          team_id,
          is_active,
          players!inner(
            id,
            user_id,
            position,
            jersey_number,
            is_active,
            users(name, email)
          ),
          teams!inner(id, name, sports(name))
        `)
        .in('team_id', teamsToUse)
        .eq('is_active', true)
        .eq('players.is_active', true);

      if (playerTeamsError) {
        console.error('❌ Error fetching player-teams:', playerTeamsError);
        throw new Error(`Failed to fetch players: ${playerTeamsError.message}`);
      }

      console.log('📊 Player-team data found:', playerTeamsData?.length || 0);

      // Step 3: Extract unique players
      const uniquePlayers: Player[] = [];
      const seenPlayerIds = new Set<string>();

      playerTeamsData?.forEach(pt => {
        if (pt.players && !seenPlayerIds.has(pt.players.id)) {
          seenPlayerIds.add(pt.players.id);
          uniquePlayers.push({
            id: pt.players.id,
            user_id: pt.players.user_id,
            position: pt.players.position,
            jersey_number: pt.players.jersey_number,
            users: pt.players.users
          });
        }
      });

      console.log('✅ Unique players found:', uniquePlayers.length);
      setAvailablePlayers(uniquePlayers);

      // Step 4: Get currently selected players for this event
      console.log('🔍 Fetching current player selections...');
      const { data: currentSelections, error: selectionsError } = await supabase
        .from('event_players')
        .select('player_id')
        .eq('event_id', eventId);

      if (selectionsError) {
        console.error('❌ Error fetching current selections:', selectionsError);
        console.log('⚠️ Continuing without current selections...');
        setSelectedPlayers([]);
      } else {
        const currentPlayerIds = currentSelections?.map(ep => ep.player_id) || [];
        console.log('📊 Currently selected players:', currentPlayerIds.length);
        setSelectedPlayers(currentPlayerIds);
      }

      if (uniquePlayers.length === 0) {
        setDebugInfo(`⚠️ No players found in the assigned teams. Teams may not have players assigned yet.`);
      } else {
        setDebugInfo(`✅ Found ${uniquePlayers.length} players from ${teamsToUse.length} teams. ${currentSelections?.length || 0} currently selected.`);
      }

    } catch (error) {
      console.error('❌ Error in fetchEventDetailsAndPlayers:', error);
      setDebugInfo(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      console.log('💾 Starting save process...');
      console.log('📊 Event ID:', eventId);
      console.log('📊 Selected players:', selectedPlayers);

      // Step 1: Delete all existing selections for this event
      console.log('🗑️ Removing existing player selections...');
      const { error: deleteError } = await supabase
        .from('event_players')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw new Error(`Failed to clear existing selections: ${deleteError.message}`);
      }

      console.log('✅ Existing selections cleared');

      // Step 2: Insert new selections (if any)
      if (selectedPlayers.length > 0) {
        console.log('➕ Adding new player selections...');
        
        const eventPlayerInserts = selectedPlayers.map(playerId => ({
          event_id: eventId,
          player_id: playerId,
        }));

        console.log('📊 Inserting:', eventPlayerInserts);

        const { data: insertedData, error: insertError } = await supabase
          .from('event_players')
          .insert(eventPlayerInserts)
          .select('id, event_id, player_id');

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          console.error('Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          throw new Error(`Failed to save player selections: ${insertError.message}`);
        }

        console.log('✅ Player selections saved:', insertedData?.length || 0);
        setDebugInfo(`✅ Successfully saved ${selectedPlayers.length} player selections`);
      } else {
        console.log('ℹ️ No players selected, only cleared existing selections');
        setDebugInfo('✅ Successfully cleared all player selections');
      }

      setSaveSuccess(true);
      
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDebugInfo(`❌ Save failed: ${errorMessage}`);
      alert(`Failed to save player selections: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredPlayers = availablePlayers.filter(player =>
    player.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Loading players...</p>
          <p className="text-center text-sm text-gray-500 mt-2">{debugInfo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Select Players</h3>
            <p className="text-sm text-gray-500">{eventName}</p>
            {eventDetails && (
              <p className="text-xs text-blue-600 mt-1">
                Sport: {eventDetails.sports?.name} • Teams: {eventDetails.event_teams?.length || 0}
              </p>
            )}
            {debugInfo && (
              <p className={`text-xs mt-1 ${
                debugInfo.startsWith('✅') ? 'text-green-600' : 
                debugInfo.startsWith('❌') || debugInfo.startsWith('⚠️') ? 'text-red-600' : 'text-blue-600'
              }`}>
                {debugInfo}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchEventDetailsAndPlayers}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* No Teams Assigned - Show Fix Instructions */}
        {(!eventDetails?.event_teams || eventDetails.event_teams.length === 0) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertTriangle className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Assigned</h3>
              <p className="text-gray-600 mb-6">
                This event doesn't have any teams assigned yet. You need to assign teams before you can select players.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <h4 className="font-medium text-blue-800 mb-3">🔧 How to fix this:</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Close this dialog</li>
                  <li>Click the "Edit" button on the event card</li>
                  <li>In the "Teams" section, select one or more teams for this event</li>
                  <li>Save the event</li>
                  <li>Then try selecting players again</li>
                </ol>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Go Back to Fix Event</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Assigned but No Players */}
        {eventDetails?.event_teams && eventDetails.event_teams.length > 0 && availablePlayers.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Available</h3>
              <p className="text-gray-600 mb-6">
                The teams assigned to this event don't have any players yet.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
                <h4 className="font-medium text-yellow-800 mb-3">🔧 How to add players:</h4>
                <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
                  <li>Go to Players Management</li>
                  <li>Add new players or edit existing ones</li>
                  <li>Assign players to the teams used in this event:
                    <ul className="mt-2 ml-4 space-y-1">
                      {eventDetails.event_teams.map((et: any, index: number) => (
                        <li key={index} className="text-xs">• {et.teams?.name}</li>
                      ))}
                    </ul>
                  </li>
                  <li>Return here to select players</li>
                </ol>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={fetchEventDetailsAndPlayers}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Players Available - Show Selection Interface */}
        {availablePlayers.length > 0 && (
          <>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlayers.includes(player.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handlePlayerToggle(player.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {player.users?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{player.users?.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {player.position && <span>{player.position}</span>}
                          {player.jersey_number && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              #{player.jersey_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedPlayers.includes(player.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlayers.includes(player.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saveSuccess}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    saveSuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Selection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventPlayerSelection;