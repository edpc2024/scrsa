import React from 'react';
import { Calendar, MapPin, Users, Clock, Trophy, Target, Zap, AlertTriangle } from 'lucide-react';
import { useSupabaseEvents } from '../../hooks/useSupabase';

interface ProcessedEvent {
  id: string;
  name: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  teams: string[];
  type: 'tournament' | 'league' | 'friendly' | 'training';
  priority: 'high' | 'medium' | 'low';
  daysUntil: number;
  status: string;
}

const UpcomingEvents: React.FC = () => {
  const { events, loading } = useSupabaseEvents();

  const processEvents = (): ProcessedEvent[] => {
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    return events
      .filter(event => {
        // Only show scheduled events
        if (event.status !== 'scheduled') return false;
        
        // Only show events within the next 2 weeks
        const eventDate = new Date(event.event_date);
        return eventDate >= now && eventDate <= twoWeeksFromNow;
      })
      .map(event => {
        const eventDate = new Date(event.event_date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine priority based on days until event
        let priority: 'high' | 'medium' | 'low' = 'low';
        if (daysUntil <= 3) priority = 'high';
        else if (daysUntil <= 7) priority = 'medium';

        // Get team names
        const teamNames = event.event_teams?.map(et => et.teams?.name).filter(Boolean) || [];

        return {
          id: event.id,
          name: event.name,
          sport: event.sports?.name || 'Unknown Sport',
          date: eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          }),
          time: event.event_time,
          location: event.location,
          teams: teamNames,
          type: event.type,
          priority,
          daysUntil,
          status: event.status,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil) // Sort by closest first
      .slice(0, 4); // Limit to 4 upcoming events
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'league':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'friendly':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'training':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return Trophy;
      case 'league':
        return Target;
      case 'friendly':
        return Users;
      case 'training':
        return Zap;
      default:
        return Calendar;
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      default:
        return 'border-l-4 border-l-green-500';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'volleyball': return '🏐';
      case 'football': return '⚽';
      case 'handball': return '🤾';
      case 'athletics': return '🏃';
      case 'gymnastics': return '🤸';
      default: return '🏆';
    }
  };

  const processedEvents = processEvents();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Upcoming Events
          </h3>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Upcoming Events
        </h3>
        <span className="text-sm text-gray-500">Next 2 weeks</span>
      </div>

      <div className="space-y-4">
        {processedEvents.length > 0 ? (
          processedEvents.map((event) => {
            const TypeIcon = getTypeIcon(event.type);
            
            return (
              <div key={event.id} className="group">
                <div className={`border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${getPriorityBorder(event.priority)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getSportIcon(event.sport)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.name}
                        </h4>
                        <p className="text-sm text-gray-500">{event.sport}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getTypeColor(event.type)}`}>
                        <TypeIcon className="h-3 w-3 inline mr-1" />
                        {event.type}
                      </span>
                      {event.daysUntil <= 5 && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                          {event.daysUntil}d
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{event.date} at {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{event.location}</span>
                    </div>
                    {event.teams.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>{event.teams.join(' vs ')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-600">No teams assigned</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar for upcoming events */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Days until event</span>
                      <span className="font-medium">
                        {event.daysUntil === 0 ? 'Today' : 
                         event.daysUntil === 1 ? 'Tomorrow' : 
                         `${event.daysUntil} days`}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          event.daysUntil <= 3 ? 'bg-red-500' :
                          event.daysUntil <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.max(10, 100 - (event.daysUntil * 5))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No upcoming events</p>
            <p className="text-sm text-gray-400">Events scheduled for the next 2 weeks will appear here</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
          View All Events
        </button>
      </div>
    </div>
  );
};

export default UpcomingEvents;