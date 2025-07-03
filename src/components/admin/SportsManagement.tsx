import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Sport {
  id: string;
  name: string;
  category: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

interface SportFormData {
  name: string;
  category: string;
  icon: string;
}

// Comprehensive sports icons mapping
const SPORTS_ICONS = {
  // Ball Sports
  'football': '⚽',
  'soccer': '⚽',
  'basketball': '🏀',
  'volleyball': '🏐',
  'tennis': '🎾',
  'baseball': '⚾',
  'softball': '🥎',
  'cricket': '🏏',
  'rugby': '🏉',
  'american_football': '🏈',
  'ping_pong': '🏓',
  'table_tennis': '🏓',
  'badminton': '🏸',
  'handball': '🤾',
  'water_polo': '🤽',
  'golf': '⛳',
  
  // Olympic Sports
  'swimming': '🏊',
  'diving': '🤿',
  'surfing': '🏄',
  'rowing': '🚣',
  'sailing': '⛵',
  'kayaking': '🛶',
  'canoeing': '🛶',
  'cycling': '🚴',
  'mountain_biking': '🚵',
  'running': '🏃',
  'marathon': '🏃',
  'athletics': '🏃',
  'track_field': '🏃',
  'hurdles': '🏃',
  'long_jump': '🏃',
  'high_jump': '🏃',
  'pole_vault': '🏃',
  'shot_put': '🏃',
  'discus': '🏃',
  'javelin': '🏃',
  'hammer_throw': '🏃',
  'decathlon': '🏃',
  'heptathlon': '🏃',
  'triathlon': '🏃',
  
  // Gymnastics & Acrobatics
  'gymnastics': '🤸',
  'artistic_gymnastics': '🤸',
  'rhythmic_gymnastics': '🤸',
  'trampoline': '🤸',
  'acrobatics': '🤸',
  'cheerleading': '🤸',
  'parkour': '🤸',
  
  // Combat Sports
  'boxing': '🥊',
  'wrestling': '🤼',
  'judo': '🥋',
  'karate': '🥋',
  'taekwondo': '🥋',
  'kung_fu': '🥋',
  'martial_arts': '🥋',
  'kickboxing': '🥊',
  'mma': '🥊',
  'fencing': '🤺',
  'kendo': '🥋',
  'aikido': '🥋',
  'brazilian_jiu_jitsu': '🥋',
  'muay_thai': '🥊',
  
  // Winter Sports
  'skiing': '⛷️',
  'snowboarding': '🏂',
  'ice_skating': '⛸️',
  'figure_skating': '⛸️',
  'speed_skating': '⛸️',
  'ice_hockey': '🏒',
  'curling': '🥌',
  'bobsled': '🛷',
  'luge': '🛷',
  'skeleton': '🛷',
  'biathlon': '⛷️',
  'cross_country_skiing': '⛷️',
  'alpine_skiing': '⛷️',
  'ski_jumping': '⛷️',
  'freestyle_skiing': '⛷️',
  'snowboard_cross': '🏂',
  
  // Equestrian
  'horse_racing': '🏇',
  'equestrian': '🏇',
  'dressage': '🏇',
  'show_jumping': '🏇',
  'eventing': '🏇',
  'polo': '🏇',
  
  // Motor Sports
  'formula_1': '🏎️',
  'racing': '🏎️',
  'motocross': '🏍️',
  'motorcycle_racing': '🏍️',
  'rally': '🏎️',
  'go_karting': '🏎️',
  'nascar': '🏎️',
  
  // Extreme Sports
  'skateboarding': '🛹',
  'bmx': '🚴',
  'rock_climbing': '🧗',
  'mountaineering': '🧗',
  'bouldering': '🧗',
  'base_jumping': '🪂',
  'skydiving': '🪂',
  'paragliding': '🪂',
  'hang_gliding': '🪂',
  'bungee_jumping': '🪂',
  'wingsuit_flying': '🪂',
  
  // Target Sports
  'archery': '🏹',
  'shooting': '🎯',
  'darts': '🎯',
  'billiards': '🎱',
  'pool': '🎱',
  'snooker': '🎱',
  'bowling': '🎳',
  
  // Strength Sports
  'weightlifting': '🏋️',
  'powerlifting': '🏋️',
  'bodybuilding': '🏋️',
  'strongman': '🏋️',
  'crossfit': '🏋️',
  
  // Dance & Performance
  'dance': '💃',
  'ballroom_dance': '💃',
  'latin_dance': '💃',
  'ballet': '💃',
  'hip_hop': '💃',
  'breakdancing': '💃',
  'contemporary': '💃',
  'jazz_dance': '💃',
  'tap_dance': '💃',
  
  // Mind Sports
  'chess': '♟️',
  'checkers': '♟️',
  'go': '♟️',
  'poker': '🃏',
  'bridge': '🃏',
  'esports': '🎮',
  'video_games': '🎮',
  
  // Adventure Sports
  'hiking': '🥾',
  'trekking': '🥾',
  'orienteering': '🧭',
  'geocaching': '🧭',
  'camping': '🏕️',
  'fishing': '🎣',
  'hunting': '🏹',
  
  // Water Sports
  'water_skiing': '🎿',
  'wakeboarding': '🏄',
  'jet_skiing': '🏄',
  'windsurfing': '🏄',
  'kitesurfing': '🪁',
  'stand_up_paddle': '🏄',
  'scuba_diving': '🤿',
  'snorkeling': '🤿',
  'synchronized_swimming': '🏊',
  'open_water_swimming': '🏊',
  
  // Team Sports
  'lacrosse': '🥍',
  'field_hockey': '🏑',
  'ice_hockey': '🏒',
  'floorball': '🏑',
  'bandy': '🏒',
  'netball': '🏀',
  'korfball': '🏀',
  'ultimate_frisbee': '🥏',
  'disc_golf': '🥏',
  'quidditch': '🧙',
  
  // Traditional Sports
  'sumo': '🤼',
  'kabaddi': '🤼',
  'sepak_takraw': '🏐',
  'hurling': '🏑',
  'gaelic_football': '⚽',
  'australian_football': '🏉',
  'capoeira': '🤸',
  
  // Fitness & Wellness
  'yoga': '🧘',
  'pilates': '🧘',
  'meditation': '🧘',
  'tai_chi': '🧘',
  'qigong': '🧘',
  'aerobics': '🤸',
  'zumba': '💃',
  'spinning': '🚴',
  
  // Default/Generic
  'trophy': '🏆',
  'medal': '🏅',
  'sports': '⚽',
  'competition': '🏆',
  'championship': '🏆',
  'tournament': '🏆',
  'league': '🏆',
  'olympics': '🏅',
  'paralympics': '🏅',
};

const SportsManagement: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState<SportFormData>({
    name: '',
    category: 'team',
    icon: 'trophy',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('sports')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }
      
      setSports(data || []);
    } catch (err) {
      console.error('Error fetching sports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sports');
    } finally {
      setLoading(false);
    }
  };

  const filteredSports = sports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sport.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredIcons = Object.entries(SPORTS_ICONS).filter(([key, value]) => {
    if (!iconSearchTerm) return true;
    return key.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
           value.includes(iconSearchTerm);
  });

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error: insertError } = await supabase
        .from('sports')
        .insert([{
          name: formData.name.trim(),
          category: formData.category,
          icon: formData.icon,
          is_active: true,
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      
      if (data) {
        setSports(prev => [data, ...prev]);
        setFormData({ name: '', category: 'team', icon: 'trophy' });
        setShowAddModal(false);
        setIconSearchTerm('');
      }
    } catch (err) {
      console.error('Failed to add sport:', err);
      alert('Failed to add sport. Please check if the sport name already exists.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error: updateError } = await supabase
        .from('sports')
        .update({
          name: formData.name.trim(),
          category: formData.category,
          icon: formData.icon,
        })
        .eq('id', selectedSport.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      if (data) {
        setSports(prev => prev.map(sport => sport.id === selectedSport.id ? data : sport));
        setFormData({ name: '', category: 'team', icon: 'trophy' });
        setShowEditModal(false);
        setSelectedSport(null);
        setIconSearchTerm('');
      }
    } catch (err) {
      console.error('Failed to update sport:', err);
      alert('Failed to update sport. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSport = async () => {
    if (!selectedSport) return;
    
    setIsSubmitting(true);
    
    try {
      const { error: deleteError } = await supabase
        .from('sports')
        .delete()
        .eq('id', selectedSport.id);

      if (deleteError) {
        throw deleteError;
      }
      
      setSports(prev => prev.filter(sport => sport.id !== selectedSport.id));
      setShowDeleteModal(false);
      setSelectedSport(null);
    } catch (err) {
      console.error('Failed to delete sport:', err);
      alert('Failed to delete sport. This sport may be in use by teams.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSportStatus = async (sportId: string, currentStatus: boolean) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sports')
        .update({ is_active: !currentStatus })
        .eq('id', sportId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      if (data) {
        setSports(prev => prev.map(sport => sport.id === sportId ? data : sport));
      }
    } catch (err) {
      console.error('Failed to toggle sport status:', err);
      alert('Failed to update sport status.');
    }
  };

  const openEditModal = (sport: Sport) => {
    setSelectedSport(sport);
    setFormData({
      name: sport.name,
      category: sport.category,
      icon: sport.icon,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (sport: Sport) => {
    setSelectedSport(sport);
    setShowDeleteModal(true);
  };

  const getSportIcon = (iconKey: string) => {
    return SPORTS_ICONS[iconKey.toLowerCase() as keyof typeof SPORTS_ICONS] || SPORTS_ICONS.trophy;
  };

  const getIconDisplayName = (iconKey: string) => {
    return iconKey.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const SportModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Sport' : 'Add New Sport'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setFormData({ name: '', category: 'team', icon: 'trophy' });
              setIconSearchTerm('');
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={isEdit ? handleEditSport : handleAddSport} className="flex flex-col h-full">
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter sport name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="team">Team Sport</option>
                <option value="individual">Individual Sport</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-2xl">{getSportIcon(formData.icon)}</span>
                  <span className="font-medium text-gray-900">{getIconDisplayName(formData.icon)}</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search icons..."
                    value={iconSearchTerm}
                    onChange={(e) => setIconSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Icon Selection Grid */}
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64">
              {filteredIcons.map(([key, emoji]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: key })}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.icon === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={getIconDisplayName(key)}
                >
                  <span className="text-xl">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({ name: '', category: 'team', icon: 'trophy' });
                setIconSearchTerm('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Sport' : 'Add Sport')}
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
          <h3 className="text-lg font-semibold text-gray-900">Delete Sport</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{selectedSport?.name}</strong>? This action cannot be undone and may affect existing teams.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteSport}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Sport'}
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
        <p className="text-red-600">Error loading sports: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sports Management</h1>
          <p className="text-gray-600 mt-1">Manage available sports and their categories</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Sport</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="team">Team Sports</option>
              <option value="individual">Individual Sports</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredSports.map((sport) => (
            <div key={sport.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{getSportIcon(sport.icon)}</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleSportStatus(sport.id, sport.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      sport.is_active 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={sport.is_active ? 'Deactivate sport' : 'Activate sport'}
                  >
                    {sport.is_active ? '🔴' : '🟢'}
                  </button>
                  <button 
                    onClick={() => openEditModal(sport)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(sport)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{sport.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{sport.category} Sport</p>
                </div>
                
                <div className={`flex items-center text-sm ${sport.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`h-2 w-2 rounded-full mr-2 ${sport.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{sport.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sports</p>
              <p className="text-2xl font-bold text-gray-900">{sports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-xl">🏐</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Team Sports</p>
              <p className="text-2xl font-bold text-gray-900">
                {sports.filter(s => s.category === 'team').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-xl">🏃</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Individual Sports</p>
              <p className="text-2xl font-bold text-gray-900">
                {sports.filter(s => s.category === 'individual').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <SportModal />}
      {showEditModal && <SportModal isEdit />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default SportsManagement;