import React, { useState } from 'react';
import { Shield, Plus, Search, Edit, Trash2, Calendar, User, X } from 'lucide-react';
import { useSupabaseCommitteeMembers, useSupabaseUsers, SupabaseCommitteeMember } from '../../hooks/useSupabase';

interface CommitteeFormData {
  user_id: string;
  position: 'president' | 'secretary' | 'treasurer' | 'executive' | 'sports_officer';
  start_date: string;
  end_date?: string;
}

const CommitteeManagement: React.FC = () => {
  const { members, loading, error, addMember, updateMember, deleteMember } = useSupabaseCommitteeMembers();
  const { users } = useSupabaseUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SupabaseCommitteeMember | null>(null);
  const [formData, setFormData] = useState<CommitteeFormData>({
    user_id: '',
    position: 'executive',
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMembers = members.filter(member => {
    const userName = member.users?.name || '';
    const userEmail = member.users?.email || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'all' || member.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addMember({
        user_id: formData.user_id,
        position: formData.position,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        is_active: true,
      });
      
      setFormData({
        user_id: '',
        position: 'executive',
        start_date: '',
        end_date: '',
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    
    try {
      await updateMember(selectedMember.id, {
        user_id: formData.user_id,
        position: formData.position,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
      });
      
      setFormData({
        user_id: '',
        position: 'executive',
        start_date: '',
        end_date: '',
      });
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Failed to update member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteMember(selectedMember.id);
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (member: SupabaseCommitteeMember) => {
    setSelectedMember(member);
    setFormData({
      user_id: member.user_id,
      position: member.position,
      start_date: member.start_date,
      end_date: member.end_date || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: SupabaseCommitteeMember) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'president': return 'bg-red-100 text-red-700';
      case 'secretary': return 'bg-blue-100 text-blue-700';
      case 'treasurer': return 'bg-green-100 text-green-700';
      case 'sports_officer': return 'bg-orange-100 text-orange-700';
      case 'executive': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'president': return '👑';
      case 'secretary': return '📝';
      case 'treasurer': return '💰';
      case 'sports_officer': return '🏆';
      case 'executive': return '⚡';
      default: return '👤';
    }
  };

  const getPositionDisplayName = (position: string) => {
    switch (position) {
      case 'sports_officer': return 'Sports Officer';
      default: return position.charAt(0).toUpperCase() + position.slice(1);
    }
  };

  const MemberModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Committee Member' : 'Add Committee Member'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setFormData({
                user_id: '',
                position: 'executive',
                start_date: '',
                end_date: '',
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={isEdit ? handleEditMember : handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              required
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="executive">Executive</option>
              <option value="sports_officer">Sports Officer</option>
              <option value="treasurer">Treasurer</option>
              <option value="secretary">Secretary</option>
              <option value="president">President</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({
                  user_id: '',
                  position: 'executive',
                  start_date: '',
                  end_date: '',
                });
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
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Member' : 'Add Member')}
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
          <h3 className="text-lg font-semibold text-gray-900">Remove Committee Member</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove <strong>{selectedMember?.users?.name}</strong> from the committee? This action cannot be undone.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteMember}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Removing...' : 'Remove Member'}
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
        <p className="text-red-600">Error loading committee members: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committee Management</h1>
          <p className="text-gray-600 mt-1">Manage organizing committee members and their positions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search committee members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="president">President</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="sports_officer">Sports Officer</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">{getPositionIcon(member.position)}</div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditModal(member)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(member)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{member.users?.name}</h3>
                  <p className="text-sm text-gray-500">{member.users?.email}</p>
                </div>
                
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPositionBadgeColor(member.position)}`}>
                  {getPositionDisplayName(member.position)}
                </span>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Since {new Date(member.start_date).toLocaleDateString()}</span>
                </div>
                
                <div className={`flex items-center text-sm ${member.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`h-2 w-2 rounded-full mr-2 ${member.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{member.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">President</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.position === 'president' && m.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Secretary</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.position === 'secretary' && m.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Treasurer</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.position === 'treasurer' && m.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sports Officer</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.position === 'sports_officer' && m.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Executive</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.position === 'executive' && m.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <MemberModal />}
      {showEditModal && <MemberModal isEdit />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default CommitteeManagement;