import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { authService } from '../services/auth';
import { userService } from '../services/user';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  onboardingCompleted: boolean | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const completed = await userService.hasCompletedOnboarding(userId);
      setOnboardingCompleted(completed);
    } catch (error) {
      setOnboardingCompleted(false);
    }
  };

  useEffect(() => {
    // Get initial session
    authService.getSession().then(async (session) => {
      setSession(session);
      if (session?.user?.id) {
        await checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (session) => {
      setSession(session);
      if (session?.user?.id) {
        await checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setOnboardingCompleted(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, onboardingCompleted, signOut }}>
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


