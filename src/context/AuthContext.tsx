import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Profile } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

// Mock profiles for instant 2-user/multi-user live testing in sandbox
export const SEED_PROFILES: Profile[] = [
  {
    id: 'user-pulse-1',
    phone_number: '+1 (555) 019-2834',
    username: 'alex_mercer',
    display_name: 'Alex Mercer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    about: 'Design Systems & Realtime Audio/Video 🚀',
    last_seen: new Date().toISOString(),
    is_online: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-pulse-2',
    phone_number: '+1 (555) 482-9102',
    username: 'elena_rostova',
    display_name: 'Elena Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    about: 'Product Architect @ PulseFlow. Coding from Tokyo 🌸',
    last_seen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    is_online: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-pulse-3',
    phone_number: '+1 (555) 891-3041',
    username: 'marcus_vance',
    display_name: 'Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    about: 'Building resilient peer-to-peer protocols.',
    last_seen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_online: false,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface AuthContextType {
  currentUser: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (email: string, pass: string, displayName: string, username: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrPhone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  switchDemoUser: (userId: string) => void;
  availableDemoUsers: Profile[];
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'pulseflow_current_user';
const LOCAL_ALL_USERS_KEY = 'pulseflow_sandbox_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());

  // Initialize sandbox users pool in localStorage
  const getSandboxUsers = useCallback((): Profile[] => {
    try {
      const stored = localStorage.getItem(LOCAL_ALL_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    localStorage.setItem(LOCAL_ALL_USERS_KEY, JSON.stringify(SEED_PROFILES));
    return SEED_PROFILES;
  }, []);

  const saveSandboxUsers = (users: Profile[]) => {
    localStorage.setItem(LOCAL_ALL_USERS_KEY, JSON.stringify(users));
  };

  // Fetch or sync profile from Supabase
  const syncSupabaseProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching Supabase profile:', error.message);
      }

      if (data) {
        // Update online status
        await supabase
          .from('profiles')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', userId);
        return data as Profile;
      }
    } catch (err) {
      console.warn('Supabase profile sync error:', err);
    }
    return null;
  }, []);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsConfigured(configured);

      const supabase = getSupabaseClient();

      if (configured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await syncSupabaseProfile(session.user.id);
            if (profile) {
              setCurrentUser(profile);
              setLoading(false);
              return;
            } else {
              // Create profile if missing
              const newProf: Profile = {
                id: session.user.id,
                phone_number: session.user.phone || null,
                username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 6)}`,
                display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
                about: 'Hey there! I am using PulseFlow.',
                last_seen: new Date().toISOString(),
                is_online: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              await supabase.from('profiles').upsert(newProf);
              setCurrentUser(newProf);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase auth session error:', err);
        }
      }

      // Fallback: check stored local session
      try {
        const storedUser = localStorage.getItem(LOCAL_USER_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      // Default to first seed user in sandbox mode so app is immediately exploreable and functional
      const defaultUser = getSandboxUsers()[0];
      setCurrentUser(defaultUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultUser));
      setLoading(false);
    };

    initAuth();

    // Listen to Supabase auth state changes if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const prof = await syncSupabaseProfile(session.user.id);
          if (prof) setCurrentUser(prof);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [syncSupabaseProfile, getSandboxUsers]);

  // Periodic heartbeat / online presence
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const supabase = getSupabaseClient();
      if (supabase && currentUser) {
        supabase
          .from('profiles')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', currentUser.id)
          .then(() => {});
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const signUp = async (
    email: string,
    pass: string,
    displayName: string,
    username: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              display_name: displayName,
              username,
              phone_number: phone || null,
            },
          },
        });

        if (error) return { success: false, error: error.message };
        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            phone_number: phone || null,
            username,
            display_name: displayName,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
            about: 'Hey there! I am using PulseFlow.',
            last_seen: new Date().toISOString(),
            is_online: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase.from('profiles').upsert(newProfile);
          setCurrentUser(newProfile);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
          return { success: true };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown signup error';
        return { success: false, error: message };
      }
    }

    // Local / Sandbox mode signup
    const newId = `user-local-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      phone_number: phone || '+1 (555) ' + Math.floor(1000000 + Math.random() * 9000000),
      username: username.toLowerCase().replace(/\s+/g, '_'),
      display_name: displayName,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      about: 'Hey there! I am using PulseFlow.',
      last_seen: new Date().toISOString(),
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentUsers = getSandboxUsers();
    saveSandboxUsers([...currentUsers, newProfile]);
    setCurrentUser(newProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
    return { success: true };
  };

  const login = async (emailOrPhone: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrPhone,
          password: pass,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const prof = await syncSupabaseProfile(data.user.id);
          if (prof) {
            setCurrentUser(prof);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(prof));
            return { success: true };
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown login error';
        return { success: false, error: message };
      }
    }

    // Local / Sandbox mode login
    const all = getSandboxUsers();
    const found = all.find(
      (u) =>
        u.username.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone_number?.includes(emailOrPhone) ||
        u.display_name.toLowerCase().includes(emailOrPhone.toLowerCase())
    );

    if (found) {
      const updated = { ...found, is_online: true, last_seen: new Date().toISOString() };
      setCurrentUser(updated);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      return { success: true };
    }

    // Allow instant entry if any name typed
    const quickUser: Profile = {
      id: `user-${Date.now()}`,
      username: emailOrPhone.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      display_name: emailOrPhone,
      phone_number: '+1 (555) 392-1849',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${emailOrPhone}`,
      about: 'Hey there! I am using PulseFlow.',
      last_seen: new Date().toISOString(),
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveSandboxUsers([...all, quickUser]);
    setCurrentUser(quickUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(quickUser));
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', currentUser.id);
      }
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!currentUser) return false;
    const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    // Update in sandbox list
    const all = getSandboxUsers();
    const newAll = all.map((u) => (u.id === updated.id ? updated : u));
    saveSandboxUsers(newAll);

    // Update in Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      } catch (err) {
        console.warn('Failed to update profile in Supabase:', err);
      }
    }
    return true;
  };

  const switchDemoUser = (userId: string) => {
    const all = getSandboxUsers();
    const user = all.find((u) => u.id === userId);
    if (user) {
      const activeUser = { ...user, is_online: true, last_seen: new Date().toISOString() };
      setCurrentUser(activeUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(activeUser));
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      const prof = await syncSupabaseProfile(currentUser.id);
      if (prof) setCurrentUser(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        isConfigured,
        signUp,
        login,
        logout,
        updateProfile,
        switchDemoUser,
        availableDemoUsers: getSandboxUsers(),
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
