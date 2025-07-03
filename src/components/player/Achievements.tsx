import React from 'react';
import { Trophy, Award, Star, Target, Calendar } from 'lucide-react';

const Achievements: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Achievements</h1>
        <p className="text-gray-600 mt-1">Your awards, milestones, and recognition</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="font-semibold text-gray-900 mb-2">Player of the Match</h3>
            <p className="text-sm text-gray-600 mb-3">Outstanding performance vs City Club</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>March 10, 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🥇</div>
            <h3 className="font-semibold text-gray-900 mb-2">Century Maker</h3>
            <p className="text-sm text-gray-600 mb-3">Scored 95 runs in a single match</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>February 28, 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="font-semibold text-gray-900 mb-2">Team Captain</h3>
            <p className="text-sm text-gray-600 mb-3">Led the team to victory in 5 matches</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>January 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Consistent Performer</h3>
            <p className="text-sm text-gray-600 mb-3">Maintained 70%+ win rate for 3 months</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Q1 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="font-semibold text-gray-900 mb-2">Winning Streak</h3>
            <p className="text-sm text-gray-600 mb-3">Won 8 consecutive matches</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>February 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🏅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Most Improved</h3>
            <p className="text-sm text-gray-600 mb-3">15% improvement in batting average</p>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>March 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Matches Played</span>
              <span className="text-sm text-gray-500">25/50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">25 more matches to unlock "Veteran Player" badge</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Career Runs</span>
              <span className="text-sm text-gray-500">1,250/2,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '62.5%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">750 more runs to unlock "Run Machine" badge</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Training Sessions</span>
              <span className="text-sm text-gray-500">45/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">55 more sessions to unlock "Dedicated Trainer" badge</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">6</p>
            <p className="text-sm text-gray-600">Total Awards</p>
          </div>
          <div className="text-center">
            <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-600">Player of Match</p>
          </div>
          <div className="text-center">
            <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">8.2</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
          <div className="text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">72%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;