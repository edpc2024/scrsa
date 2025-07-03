import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthStateChange(session);
      } else {
        // Check for stored demo user
        const storedUser = localStorage.getItem('scrsa_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('scrsa_user');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (session) {
        await handleAuthStateChange(session);
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('scrsa_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (session: Session) => {
    try {
      console.log('🔍 Fetching user profile for:', session.user.email);
      
      // Fetch user profile from our users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .eq('is_active', true)
        .single();

      if (error || !userProfile) {
        console.error('❌ User profile not found:', error);
        // If user doesn't exist in our users table, sign them out
        await supabase.auth.signOut();
        return;
      }

      console.log('✅ User profile loaded:', userProfile);

      const userData: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isActive: userProfile.is_active,
        createdAt: userProfile.created_at,
      };

      localStorage.setItem('scrsa_user', JSON.stringify(userData));
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('❌ Error handling auth state change:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 Attempting login for:', email);
      
      // First, try to find the user in our database
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (userError || !userProfile) {
        console.error('❌ User not found in database:', userError);
        return false;
      }

      // For demo purposes, accept 'password' as the password
      if (password !== 'password') {
        console.log('❌ Invalid password');
        return false;
      }

      console.log('✅ Demo login successful for user:', userProfile);

      // Create a mock session for demo purposes
      // In production, you would use proper Supabase Auth
      const userData: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isActive: userProfile.is_active,
        createdAt: userProfile.created_at,
      };

      // Set up a mock session in Supabase for RLS to work
      // This is a workaround for demo purposes
      await supabase.auth.setSession({
        access_token: `demo-token-${userProfile.id}`,
        refresh_token: `demo-refresh-${userProfile.id}`,
      });

      localStorage.setItem('scrsa_user', JSON.stringify(userData));
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 Logging out...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase logout error:', error);
      }
      
      // Clear local storage and state
      localStorage.removeItem('scrsa_user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear state even if Supabase logout fails
      localStorage.removeItem('scrsa_user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      console.log('🔍 Attempting registration for:', userData.email);
      
      if (!userData.email || !userData.name || !userData.role) {
        throw new Error('Email, name, and role are required');
      }

      // Create user in our users table
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email.toLowerCase().trim(),
          name: userData.name.trim(),
          role: userData.role,
          is_active: true,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Registration error:', error);
        throw error;
      }

      console.log('✅ Registration successful:', newUser);

      // Auto-login the new user
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at,
      };

      localStorage.setItem('scrsa_user', JSON.stringify(user));
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔍 Attempting password reset for:', email);

      // Check if user exists in our database first
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('email, is_active')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (userError || !userProfile) {
        console.log('❌ User not found in database');
        return {
          success: false,
          message: 'No account found with this email address.'
        };
      }

      // For production, you would use Supabase's password reset:
      // const { error } = await supabase.auth.resetPasswordForEmail(email, {
      //   redirectTo: `${window.location.origin}/reset-password`,
      // });

      // For demo purposes, simulate the password reset process
      console.log('✅ Demo password reset initiated for:', email);
      
      return {
        success: true,
        message: 'Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.'
      };

    } catch (error) {
      console.error('❌ Password reset error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};