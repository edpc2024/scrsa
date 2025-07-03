import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, UserCheck, UserX, X, Trophy } from 'lucide-react';
import { useSupabaseUsers, useSupabaseTeams, SupabaseUser } from '../../hooks/useSupabase';

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'committee' | 'coach' | 'player';
  team_ids: string[]; // For coaches - which teams they coach
}

const UserManagement: React.FC = () => {
  const { users, loading, error, addUser, updateUser, deleteUser } = useSupabaseUsers();
  const { teams } = useSupabaseTeams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'player',
    team_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newUser = await addUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: true,
      });

      // If user is a coach and teams are selected, assign them to those teams
      if (formData.role === 'coach' && formData.team_ids.length > 0 && newUser) {
        const { supabase } = await import('../../lib/supabase');
        
        // Update the teams to assign this coach
        for (const teamId of formData.team_ids) {
          await supabase
            .from('teams')
            .update({ coach_id: newUser.id })
            .eq('id', teamId);
        }
      }
      
      setFormData({ name: '', email: '', role: 'player', team_ids: [] });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await updateUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      // If user is a coach, update team assignments
      if (formData.role === 'coach') {
        const { supabase } = await import('../../lib/supabase');
        
        // First, remove this coach from all teams
        await supabase
          .from('teams')
          .update({ coach_id: null })
          .eq('coach_id', selectedUser.id);

        // Then assign to selected teams
        for (const teamId of formData.team_ids) {
          await supabase
            .from('teams')
            .update({ coach_id: selectedUser.id })
            .eq('id', teamId);
        }
      }
      
      setFormData({ name: '', email: '', role: 'player', team_ids: [] });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      // If user is a coach, remove them from teams first
      if (selectedUser.role === 'coach') {
        const { supabase } = await import('../../lib/supabase');
        await supabase
          .from('teams')
          .update({ coach_id: null })
          .eq('coach_id', selectedUser.id);
      }

      await deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser(userId, { is_active: !currentStatus });
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const openEditModal = async (user: SupabaseUser) => {
    setSelectedUser(user);
    
    // If user is a coach, get their current team assignments
    let currentTeamIds: string[] = [];
    if (user.role === 'coach') {
      const { supabase } = await import('../../lib/supabase');
      const { data: coachTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', user.id);
      
      currentTeamIds = coachTeams?.map(t => t.id) || [];
    }

    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      team_ids: currentTeamIds,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: SupabaseUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'committee': return 'bg-blue-100 text-blue-700';
      case 'coach': return 'bg-green-100 text-green-700';
      case 'player': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const UserModal: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setFormData({ name: '', email: '', role: 'player', team_ids: [] });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={isEdit ? handleEditUser : handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any, team_ids: [] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="committee">Committee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Team Assignment for Coaches */}
          {formData.role === 'coach' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Assign Teams to Coach</span>
                </div>
              </label>
              <select
                multiple
                value={formData.team_ids}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  team_ids: Array.from(e.target.selectedOptions, option => option.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={Math.min(teams.length, 6)}
              >
                {teams.filter(team => team.is_active).map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.sports?.name || 'Unknown Sport'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple teams. This coach will be assigned to manage these teams.
              </p>
              {teams.filter(team => team.is_active).length === 0 && (
                <p className="text-xs text-red-500 mt-1">No active teams available. Create teams first in Teams Management.</p>
              )}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({ name: '', email: '', role: 'player', team_ids: [] });
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
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update User' : 'Add User')}
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
          <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          {selectedUser?.role === 'coach' && (
            <span className="block mt-2 text-orange-600 text-sm">
              ⚠️ This coach will be removed from all assigned teams.
            </span>
          )}
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete User'}
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
        <p className="text-red-600">Error loading users: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="committee">Committee</option>
              <option value="coach">Coach</option>
              <option value="player">Player</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active ? (
                        <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <UserX className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className={`text-sm ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Statistics</h3>
            <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
              <span>Total Users: {users.length}</span>
              <span>Active: {users.filter(u => u.is_active).length}</span>
              <span>Coaches: {users.filter(u => u.role === 'coach').length}</span>
              <span>Players: {users.filter(u => u.role === 'player').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <UserModal />}
      {showEditModal && <UserModal isEdit />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default UserManagement;