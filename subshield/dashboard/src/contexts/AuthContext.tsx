'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import type { Database, SubscriptionTier, SubscriptionStatus } from '@/lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subData) {
        setSubscription(subData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create user profile
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        full_name: fullName || null,
      } as never);

      // Create free subscription
      await supabase.from('subscriptions').insert({
        user_id: data.user.id,
        tier: 'free',
        status: 'active',
        contracts_limit: 1,
        contracts_used_this_month: 0,
      } as never);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
  };

  const refreshSubscription = async () => {
    if (!user) return;

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subData) {
      setSubscription(subData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
