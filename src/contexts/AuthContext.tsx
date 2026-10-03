import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  mobile: string | null;
  address: string | null;
  college: string | null;
  created_at: string;
  updated_at: string;
}

interface User extends UserProfile {
  email: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string, adminOnly?: boolean) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>;
  register: (userData: { name: string; email: string; password: string; mobile: string; address: string; college: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // loading stays true until we know the session AND (if signed in) the profile/role
  const [loading, setLoading] = useState(true);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          if (event === 'TOKEN_REFRESHED' && currentUserId.current === session.user.id) return;
          setLoading(true);
          // Defer profile fetching to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          currentUserId.current = null;
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        currentUserId.current = authUser.id;
        // Role comes from the database only (profiles.is_admin) - single admin account
        setUser({
          ...profile,
          email: authUser.email || '',
          isAdmin: profile.is_admin === true
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    adminOnly: boolean = false
  ): Promise<{ success: boolean; isAdmin?: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Login failed' };
      }

      // Ask the database whether this account is the admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .maybeSingle();
      const isAdmin = profile?.is_admin === true;

      // Admin page only lets the admin account in
      if (adminOnly && !isAdmin) {
        await supabase.auth.signOut();
        return { success: false, error: 'This account does not have admin access' };
      }

      return { success: true, isAdmin };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    mobile: string; 
    address: string; 
    college: string 
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.name,
            mobile: userData.mobile,
            address: userData.address,
            college: userData.college
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      currentUserId.current = null;
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    login,
    register,
    logout,
    isAuthenticated: !!session?.user,
    isAdmin: !!user?.isAdmin,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};