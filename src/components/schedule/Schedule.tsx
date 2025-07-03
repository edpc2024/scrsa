import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const Schedule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-1">Your upcoming events and training sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Cricket Training</h4>
                  <p className="text-sm text-gray-500">Team Practice Session</p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Training</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Today at 5:00 PM</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Practice Ground</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Inter-Club Championship</h4>
                  <p className="text-sm text-gray-500">Cricket Match</p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Tournament</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>March 15 at 10:00 AM</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Central Sports Ground</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>SCRSA vs City Club</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Week</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Training</h4>
                  <p className="text-sm text-gray-500">Regular Practice</p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Training</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>March 18 at 6:00 PM</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Indoor Sports Hall</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Football Friendly</h4>
                  <p className="text-sm text-gray-500">Friendly Match</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Friendly</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>March 20 at 4:00 PM</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>University Ground</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>SCRSA vs University FC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calendar View</h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          <div className="font-medium text-gray-500 py-2">Sun</div>
          <div className="font-medium text-gray-500 py-2">Mon</div>
          <div className="font-medium text-gray-500 py-2">Tue</div>
          <div className="font-medium text-gray-500 py-2">Wed</div>
          <div className="font-medium text-gray-500 py-2">Thu</div>
          <div className="font-medium text-gray-500 py-2">Fri</div>
          <div className="font-medium text-gray-500 py-2">Sat</div>
          
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 6;
            const isToday = day === 12;
            const hasEvent = [15, 18, 20].includes(day);
            
            return (
              <div
                key={i}
                className={`py-2 rounded ${
                  day < 1 || day > 31
                    ? 'text-gray-300'
                    : isToday
                    ? 'bg-blue-600 text-white'
                    : hasEvent
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day > 0 && day <= 31 ? day : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Schedule;