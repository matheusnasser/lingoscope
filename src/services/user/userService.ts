import { supabase } from '../../config/supabase';

export interface UserProfile {
  id: string;
  username: string | null;
  onboarding_completed: boolean;
  native_language: string | null;
  target_languages: string[] | null;
  proficiency_level: string | null;
  learning_goals: string[] | null;
  interests: string[] | null;
  avatar_url: string | null;
}

export interface OnboardingData {
  native_language: string;
  target_languages: string[];
}

class UserService {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.onboarding_completed ?? false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create or update user profile with onboarding data
   */
  async completeOnboarding(
    userId: string,
    onboardingData: OnboardingData
  ): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      // Update profile (should exist due to trigger, but handle both cases)
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          native_language: onboardingData.native_language,
          target_languages: onboardingData.target_languages,
          onboarding_completed: true,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error: any) {
      return { profile: null, error };
    }
  }

  /**
   * Get user's languages
   */
  async getUserLanguages(userId: string): Promise<{
    nativeLanguage: string | null;
    targetLanguages: string[] | null;
  }> {
    try {
      const profile = await this.getUserProfile(userId);
      return {
        nativeLanguage: profile?.native_language ?? null,
        targetLanguages: profile?.target_languages ?? null,
      };
    } catch (error) {
      return {
        nativeLanguage: null,
        targetLanguages: null,
      };
    }
  }

  /**
   * Update user language preferences
   */
  async updateLanguagePreferences(
    userId: string,
    languageData: OnboardingData
  ): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          native_language: languageData.native_language,
          target_languages: languageData.target_languages,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error: any) {
      return { profile: null, error };
    }
  }
}

export const userService = new UserService();

