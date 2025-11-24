import { supabase } from '../../config/supabase';
import { Session, AuthError } from '@supabase/supabase-js';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  // Add additional fields as needed
}

export interface AuthResult {
  session: Session | null;
  error: AuthError | null;
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(
    credentials: SignInCredentials
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      return {
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      return {
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google, Apple, etc.)
   * For React Native, use the signInWithOAuthProvider helper from oauthHelper.ts
   */
  async signInWithOAuth(provider: 'google' | 'apple'): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'lingoscope://auth/callback',
        },
      });

      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return supabase.auth.getUser();
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lingoscope://auth/reset-password',
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }
}

export const authService = new AuthService();


