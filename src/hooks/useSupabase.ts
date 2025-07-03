import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'committee' | 'coach' | 'player';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTeam {
  id: string;
  name: string;
  sport_id: string;
  gender: 'men' | 'women' | 'mixed';
  coach_id: string;
  founded_year: number;
  is_active: boolean;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
  sports?: { name: string };
  users?: { name: string };
}

export interface SupabasePlayer {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  date_joined: string;
  is_active: boolean;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  personal_best?: string;
  created_at: string;
  updated_at: string;
  users?: { name: string; email: string };
  player_teams?: { teams: { name: string } }[];
}

export interface SupabaseEvent {
  id: string;
  name: string;
  sport_id: string;
  event_date: string;
  event_time: string;
  location: string;
  type: 'tournament' | 'league' | 'friendly' | 'training';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  result?: string;
  created_at: string;
  updated_at: string;
  sports?: { name: string };
  event_teams?: { teams: { name: string } }[];
}

export interface SupabaseCommitteeMember {
  id: string;
  user_id: string;
  position: 'president' | 'secretary' | 'treasurer' | 'executive' | 'sports_officer';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: { name: string; email: string };
}

export const useSupabaseUsers = () => {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching users...');
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }
      
      console.log('✅ Users fetched successfully:', data?.length || 0, 'users');
      setUsers(data || []);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<SupabaseUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      // Validate required fields
      if (!userData.name || !userData.email || !userData.role) {
        throw new Error('Name, email, and role are required');
      }

      console.log('🔍 Adding user with data:', userData);

      // Check if user already exists - use maybeSingle() instead of single()
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      const insertData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        role: userData.role,
        is_active: userData.is_active ?? true,
        avatar_url: userData.avatar_url || null,
      };

      console.log('🔍 Insert data:', insertData);

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      if (data) {
        setUsers(prev => [data, ...prev]);
        console.log('✅ User added successfully:', data);
        return data;
      }
    } catch (err) {
      console.error('❌ Error adding user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = async (id: string, updates: Partial<SupabaseUser>) => {
    try {
      setError(null);
      
      console.log('🔍 Updating user:', id, updates);
      
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }
      
      if (data) {
        setUsers(prev => prev.map(user => user.id === id ? data : user));
        console.log('✅ User updated successfully:', data);
        return data;
      }
    } catch (err) {
      console.error('❌ Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setError(null);
      
      console.log('🔍 Deleting user:', id);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        throw deleteError;
      }
      
      setUsers(prev => prev.filter(user => user.id !== id));
      console.log('✅ User deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
};

export const useSupabaseTeams = () => {
  const [teams, setTeams] = useState<SupabaseTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select(`
          *,
          sports(name),
          users(name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch teams error:', fetchError);
        throw fetchError;
      }
      
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching teams');
    } finally {
      setLoading(false);
    }
  };

  const addTeam = async (teamData: Omit<SupabaseTeam, 'id' | 'created_at' | 'updated_at' | 'sports' | 'users'>) => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('teams')
        .insert([teamData])
        .select(`
          *,
          sports(name),
          users(name)
        `)
        .single();

      if (insertError) {
        console.error('Insert team error:', insertError);
        throw insertError;
      }
      
      if (data) {
        setTeams(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error adding team:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTeam = async (id: string, updates: Partial<SupabaseTeam>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          sports(name),
          users(name)
        `)
        .single();

      if (updateError) {
        console.error('Update team error:', updateError);
        throw updateError;
      }
      
      if (data) {
        setTeams(prev => prev.map(team => team.id === id ? data : team));
        return data;
      }
    } catch (err) {
      console.error('Error updating team:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete team error:', deleteError);
        throw deleteError;
      }
      
      setTeams(prev => prev.filter(team => team.id !== id));
    } catch (err) {
      console.error('Error deleting team:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    loading,
    error,
    addTeam,
    updateTeam,
    deleteTeam,
    refetch: fetchTeams,
  };
};

export const useSupabasePlayers = () => {
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('players')
        .select(`
          *,
          users(name, email),
          player_teams(teams(name))
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch players error:', fetchError);
        throw fetchError;
      }
      
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching players');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (playerData: Omit<SupabasePlayer, 'id' | 'created_at' | 'updated_at' | 'users' | 'player_teams'>) => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('players')
        .insert([playerData])
        .select(`
          *,
          users(name, email),
          player_teams(teams(name))
        `)
        .single();

      if (insertError) {
        console.error('Insert player error:', insertError);
        throw insertError;
      }
      
      if (data) {
        setPlayers(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error adding player:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add player';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePlayer = async (id: string, updates: Partial<SupabasePlayer>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          users(name, email),
          player_teams(teams(name))
        `)
        .single();

      if (updateError) {
        console.error('Update player error:', updateError);
        throw updateError;
      }
      
      if (data) {
        setPlayers(prev => prev.map(player => player.id === id ? data : player));
        return data;
      }
    } catch (err) {
      console.error('Error updating player:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update player';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete player error:', deleteError);
        throw deleteError;
      }
      
      setPlayers(prev => prev.filter(player => player.id !== id));
    } catch (err) {
      console.error('Error deleting player:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete player';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return {
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers,
  };
};

export const useSupabaseEvents = () => {
  const [events, setEvents] = useState<SupabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          sports(name),
          event_teams(teams(name))
        `)
        .order('event_date', { ascending: false });

      if (fetchError) {
        console.error('Fetch events error:', fetchError);
        throw fetchError;
      }
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching events');
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: Omit<SupabaseEvent, 'id' | 'created_at' | 'updated_at' | 'sports' | 'event_teams'>) => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select(`
          *,
          sports(name),
          event_teams(teams(name))
        `)
        .single();

      if (insertError) {
        console.error('Insert event error:', insertError);
        throw insertError;
      }
      
      if (data) {
        setEvents(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error adding event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateEvent = async (id: string, updates: Partial<SupabaseEvent>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          sports(name),
          event_teams(teams(name))
        `)
        .single();

      if (updateError) {
        console.error('Update event error:', updateError);
        throw updateError;
      }
      
      if (data) {
        setEvents(prev => prev.map(event => event.id === id ? data : event));
        return data;
      }
    } catch (err) {
      console.error('Error updating event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete event error:', deleteError);
        throw deleteError;
      }
      
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};

export const useSupabaseCommitteeMembers = () => {
  const [members, setMembers] = useState<SupabaseCommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('committee_members')
        .select(`
          *,
          users(name, email)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch committee members error:', fetchError);
        throw fetchError;
      }
      
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching committee members:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching committee members');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (memberData: Omit<SupabaseCommitteeMember, 'id' | 'created_at' | 'updated_at' | 'users'>) => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('committee_members')
        .insert([memberData])
        .select(`
          *,
          users(name, email)
        `)
        .single();

      if (insertError) {
        console.error('Insert committee member error:', insertError);
        throw insertError;
      }
      
      if (data) {
        setMembers(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error('Error adding committee member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add committee member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMember = async (id: string, updates: Partial<SupabaseCommitteeMember>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('committee_members')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          users(name, email)
        `)
        .single();

      if (updateError) {
        console.error('Update committee member error:', updateError);
        throw updateError;
      }
      
      if (data) {
        setMembers(prev => prev.map(member => member.id === id ? data : member));
        return data;
      }
    } catch (err) {
      console.error('Error updating committee member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update committee member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('committee_members')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete committee member error:', deleteError);
        throw deleteError;
      }
      
      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (err) {
      console.error('Error deleting committee member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete committee member';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    refetch: fetchMembers,
  };
};