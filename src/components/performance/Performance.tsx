import React from 'react';
import { Target, TrendingUp, Trophy, BarChart3 } from 'lucide-react';

const Performance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-600 mt-1">Track and analyze performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Matches Played</p>
              <p className="text-2xl font-bold text-gray-900">25</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">72%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-gray-900">8.2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Improvement</p>
              <p className="text-2xl font-bold text-gray-900">+15%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">vs City Club</p>
                <p className="text-sm text-gray-500">March 10, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">Won</p>
                <p className="text-sm text-gray-500">85 runs</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">vs University</p>
                <p className="text-sm text-gray-500">March 5, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">Won</p>
                <p className="text-sm text-gray-500">67 runs</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">vs Sports Club</p>
                <p className="text-sm text-gray-500">February 28, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">Lost</p>
                <p className="text-sm text-gray-500">23 runs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Batting Average</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm font-medium">45.2</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Strike Rate</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-sm font-medium">128.5</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Consistency</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Bests</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h4 className="font-semibold text-gray-900">Highest Score</h4>
            <p className="text-2xl font-bold text-yellow-600 mt-1">95</p>
            <p className="text-sm text-gray-500">vs Regional Club</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-900">Best Strike Rate</h4>
            <p className="text-2xl font-bold text-blue-600 mt-1">156.8</p>
            <p className="text-sm text-gray-500">vs City Club</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-900">Most Boundaries</h4>
            <p className="text-2xl font-bold text-green-600 mt-1">12</p>
            <p className="text-sm text-gray-500">vs University</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;