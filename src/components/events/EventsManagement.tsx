import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit, Trash2, MapPin, Clock, Users, Trophy, X, UserPlus, Target } from 'lucide-react';
import { useSupabaseEvents, useSupabaseTeams, SupabaseEvent } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import EventPlayerSelection from './EventPlayerSelection';
import EventPerformanceCapture from './EventPerformanceCapture';

interface EventFormData {
  name: string;
  sport_id: string;
  event_date: string;
  event_time: string;
  location: string;
  type: 'tournament' | 'league' | 'friendly' | 'training';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  result?: string;
  team_ids: string[];
}

interface Sport {
  id: string;
  name: string;
}

const EventsManagement: React.FC = () => {
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useSupabaseEvents();
  const { teams } = useSupabaseTeams();
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [showPerformanceCapture, setShowPerformanceCapture] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SupabaseEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    sport_id: '',
    event_date: '',
    event_time: '',
    location: '',
    type: 'training',
    status: 'scheduled',
    result: '',
    team_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Fetch sports
  useEffect(() => {
    const fetchSports = async () => {
      const { data } = await supabase.from('sports').select('id, name');
      setSports(data || []);
    };
    fetchSports();
  }, []);

  // Get teams filtered by selected sport
  const getTeamsForSport = (sportId: string) => {
    if (!sportId) return teams.filter(team => team.is_active);
    return teams.filter(team => team.sport_id === sportId && team.is_active);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'all' || event.sport_id === selectedSport;
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    return matchesSearch && matchesSport && matchesType && matchesStatus;
  });

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Creating event with data:', formData);
      
      // Validation
      if (!formData.sport_id) {
        throw new Error('Please select a sport');
      }
      
      if (formData.team_ids.length === 0) {
        throw new Error('Please select at least one team');
      }
      
      // Step 1: Create the event
      const newEvent = await addEvent({
        name: formData.name,
        sport_id: formData.sport_id,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        result: formData.result || undefined,
      });

      if (!newEvent) {
        throw new Error('Failed to create event');
      }

      console.log('✅ Event created:', newEvent.id);

      // Step 2: Add event-team relationships
      if (formData.team_ids.length > 0) {
        console.log('🔗 Creating event-team relationships for teams:', formData.team_ids);
        
        const eventTeamInserts = formData.team_ids.map(team_id => ({
          event_id: newEvent.id,
          team_id,
        }));

        console.log('📊 Event-team inserts:', eventTeamInserts);

        const { data: insertedRelations, error: relationError } = await supabase
          .from('event_teams')
          .insert(eventTeamInserts)
          .select(`
            id,
            event_id,
            team_id,
            teams(name, sports(name))
          `);

        if (relationError) {
          console.error('❌ Error creating event-team relationships:', relationError);
          // Clean up the event if team assignment fails
          await supabase.from('events').delete().eq('id', newEvent.id);
          throw new Error(`Failed to assign teams to event: ${relationError.message}`);
        }

        console.log('✅ Event-team relationships created:', insertedRelations);
        
        const teamNames = formData.team_ids
          .map(teamId => teams.find(t => t.id === teamId)?.name)
          .filter(Boolean)
          .join(', ');
        
        setDebugInfo(`✅ Event created and assigned to teams: ${teamNames}`);
      } else {
        setDebugInfo('✅ Event created (no teams assigned)');
      }
      
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error('❌ Failed to add event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setDebugInfo(`❌ Error: ${errorMessage}`);
      alert(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Updating event with data:', formData);
      
      // Step 1: Update the event
      await updateEvent(selectedEvent.id, {
        name: formData.name,
        sport_id: formData.sport_id,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        result: formData.result || undefined,
      });

      // Step 2: Update event-team relationships if teams were selected
      if (formData.team_ids.length > 0) {
        console.log('🔗 Updating event-team relationships...');
        
        // Remove existing relationships
        await supabase
          .from('event_teams')
          .delete()
          .eq('event_id', selectedEvent.id);

        // Add new relationships
        const eventTeamInserts = formData.team_ids.map(team_id => ({
          event_id: selectedEvent.id,
          team_id,
        }));

        const { error: relationError } = await supabase
          .from('event_teams')
          .insert(eventTeamInserts);

        if (relationError) {
          console.error('❌ Error updating event-team relationships:', relationError);
          throw new Error(`Failed to update team assignments: ${relationError.message}`);
        }

        const teamNames = formData.team_ids
          .map(teamId => teams.find(t => t.id === teamId)?.name)
          .filter(Boolean)
          .join(', ');
        
        setDebugInfo(`✅ Event updated and assigned to teams: ${teamNames}`);
      }
      
      resetForm();
      setShowEditModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('❌ Failed to update event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setDebugInfo(`❌ Error: ${errorMessage}`);
      alert(`Failed to update event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteEvent(selectedEvent.id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = async (event: SupabaseEvent) => {
    setSelectedEvent(event);
    
    // Fetch current team assignments for this event
    const { data: eventTeams } = await supabase
      .from('event_teams')
      .select('team_id')
      .eq('event_id', event.id);
    
    const currentTeamIds = eventTeams?.map(et => et.team_id) || [];
    
    setFormData({
      name: event.name,
      sport_id: event.sport_id,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      type: event.type,
      status: event.status,
      result: event.result || '',
      team_ids: currentTeamIds,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (event: SupabaseEvent) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const openPlayerSelection = (event: SupabaseEvent) => {
    setSelectedEvent(event);
    setShowPlayerSelection(true);
  };

  const openPerformanceCapture = (event: SupabaseEvent) => {
    setSelectedEvent(event);
    setShowPerformanceCapture(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sport_id: '',
      event_date: '',
      event_time: '',
      location: '',
      type: 'training',
      status: 'scheduled',
      result: '',
      team_ids: [],
    });
    setDebugInfo('');
  };

  // Function to fix existing events that don't have teams assigned
  const fixEventTeamRelationship = async (eventId: string, eventName: string) => {
    try {
      console.log('🔧 Fixing event-team relationship for:', eventName);
      
      // Get the event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, sports(name)')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        console.error('❌ Error fetching event:', eventError);
        return;
      }

      console.log('📊 Event details:', event);

      // Find teams that match this event's sport
      const matchingTeams = teams.filter(team => team.sport_id === event.sport_id);
      console.log('🏆 Matching teams for sport:', matchingTeams);

      if (matchingTeams.length === 0) {
        alert(`No teams found for sport: ${event.sports?.name}. Please create a team for this sport first.`);
        return;
      }

      // Show a selection dialog for teams
      const teamOptions = matchingTeams.map(team => `${team.name} (${team.gender})`).join('\n');
      const selectedTeamName = prompt(
        `Select a team for event "${eventName}":\n\nAvailable teams for ${event.sports?.name}:\n${teamOptions}\n\nEnter the exact team name:`
      );

      if (!selectedTeamName) return;

      const selectedTeam = matchingTeams.find(team => 
        team.name.toLowerCase() === selectedTeamName.toLowerCase() ||
        `${team.name} (${team.gender})`.toLowerCase() === selectedTeamName.toLowerCase()
      );

      if (!selectedTeam) {
        alert('Team not found. Please enter the exact team name.');
        return;
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('event_teams')
        .select('id')
        .eq('event_id', eventId)
        .eq('team_id', selectedTeam.id)
        .single();

      if (existingRelation) {
        alert('This team is already assigned to this event.');
        return;
      }

      // Create the event-team relationship
      const { error: insertError } = await supabase
        .from('event_teams')
        .insert({
          event_id: eventId,
          team_id: selectedTeam.id,
        });

      if (insertError) {
        console.error('❌ Error creating event-team relationship:', insertError);
        alert(`Failed to assign team: ${insertError.message}`);
        return;
      }

      console.log('✅ Event-team relationship created successfully');
      alert(`Successfully assigned "${selectedTeam.name}" to event "${eventName}"`);
      
      // Refresh the events data
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error fixing event-team relationship:', error);
      alert('An error occurred while fixing the event-team relationship.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'ongoing': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName?.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'volleyball': return '🏐';
      case 'football': return '⚽';
      case 'foot ball': return '⚽';
      case 'handball': return '🤾';
      case 'athletics': return '🏃';
      case 'gymnastics': return '🤸';
      default: return '🏆';
    }
  };

  const EventModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Event' : 'Add New Event'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Debug Information */}
        {debugInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">{debugInfo}</p>
          </div>
        )}
        
        <form onSubmit={isEdit ? handleEditEvent : handleAddEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.sport_id}
              onChange={(e) => setFormData(prev => ({ ...prev, sport_id: e.target.value, team_ids: [] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a sport</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.event_time}
                onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter location"
            />
          </div>
          
          {/* Teams Selection - Always Show */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teams <span className="text-red-500">*</span>
              {formData.sport_id && (
                <span className="text-sm text-gray-500 ml-1">
                  (for {sports.find(s => s.id === formData.sport_id)?.name})
                </span>
              )}
            </label>
            
            {!formData.sport_id ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Please select a sport first to see available teams
              </div>
            ) : getTeamsForSport(formData.sport_id).length === 0 ? (
              <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600">
                No teams available for {sports.find(s => s.id === formData.sport_id)?.name}. 
                <br />
                <span className="text-sm">Create teams first in Teams Management.</span>
              </div>
            ) : (
              <>
                <select
                  multiple
                  required
                  value={formData.team_ids}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    team_ids: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={Math.min(getTeamsForSport(formData.sport_id).length, 4)}
                >
                  {getTeamsForSport(formData.sport_id).map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.gender})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple teams. <strong>You must select at least one team.</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Available teams: {getTeamsForSport(formData.sport_id).length}
                </p>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="training">Training</option>
                <option value="friendly">Friendly</option>
                <option value="league">League</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {formData.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result
              </label>
              <input
                type="text"
                value={formData.result}
                onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter match result"
              />
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEdit && (formData.team_ids.length === 0 || !formData.sport_id))}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Event' : 'Add Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{selectedEvent?.name}</strong>? This action cannot be undone.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteEvent}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-1">Schedule and manage sports events and competitions</p>
          {debugInfo && (
            <p className="text-sm text-blue-600 mt-1">{debugInfo}</p>
          )}
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sports</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="tournament">Tournament</option>
              <option value="league">League</option>
              <option value="friendly">Friendly</option>
              <option value="training">Training</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getSportIcon(event.sports?.name || '')}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-500">{event.sports?.name}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{new Date(event.event_date).toLocaleDateString()} at {event.event_time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
                {event.event_teams && event.event_teams.length > 0 ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{event.event_teams.map(et => et.teams?.name).filter(Boolean).join(' vs ')}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-red-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>No teams assigned</span>
                    <button
                      onClick={() => fixEventTeamRelationship(event.id, event.name)}
                      className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      Fix
                    </button>
                  </div>
                )}
                {event.result && (
                  <div className="flex items-center text-sm text-green-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>{event.result}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {event.event_teams && event.event_teams.length > 0 && (
                    <button 
                      onClick={() => openPlayerSelection(event)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Select Players</span>
                    </button>
                  )}
                  {(event.status === 'completed' || event.status === 'ongoing') && (
                    <button 
                      onClick={() => openPerformanceCapture(event)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <Target className="h-3 w-3" />
                      <span>Performance</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditModal(event)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(event)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'tournament').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <EventModal />}
      {showEditModal && <EventModal isEdit />}
      {showDeleteModal && <DeleteModal />}
      
      {/* Player Selection Modal */}
      {showPlayerSelection && selectedEvent && selectedEvent.event_teams && (
        <EventPlayerSelection
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          teamIds={selectedEvent.event_teams
            .map(et => et.teams?.id)
            .filter((id): id is string => id !== null && id !== undefined)}
          onClose={() => setShowPlayerSelection(false)}
        />
      )}
      
      {/* Performance Capture Modal */}
      {showPerformanceCapture && selectedEvent && selectedEvent.event_teams && (
        <EventPerformanceCapture
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          teams={selectedEvent.event_teams
            .filter(et => et.teams?.id && et.teams?.name)
            .map(et => ({ id: et.teams!.id, name: et.teams!.name }))}
          onClose={() => setShowPerformanceCapture(false)}
        />
      )}
    </div>
  );
};

export default EventsManagement;