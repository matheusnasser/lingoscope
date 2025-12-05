import { supabase } from '../../config/supabase';
import { paymentService } from '../payment/paymentService';

class PremiumService {
  /**
   * Check if user has premium access
   * Checks both subscription_plan in user_profiles and active Stripe subscription
   */
  async isPremium(userId: string): Promise<boolean> {
    try {
      // First check user_profiles for quick lookup
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_plan')
        .eq('id', userId)
        .single();

      if (profile?.subscription_plan === 'premium') {
        // Double-check with active subscription
        return await paymentService.hasActivePremium(userId);
      }

      return false;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Get premium features available to user
   */
  async getPremiumFeatures(userId: string): Promise<{
    dailyChallenges: number;
    examplePhrases: boolean;
    unlimitedCaptures: boolean;
    unlimitedReviews: boolean;
    prioritySupport: boolean;
  }> {
    const isPremiumUser = await this.isPremium(userId);

    return {
      dailyChallenges: isPremiumUser ? 10 : 3,
      examplePhrases: isPremiumUser,
      unlimitedCaptures: true, // Both plans have this
      unlimitedReviews: isPremiumUser, // Free: 10/day, Premium: unlimited
      prioritySupport: isPremiumUser,
    };
  }

  /**
   * Check if user can access a premium feature
   */
  async canAccessFeature(
    userId: string, 
    feature: 'examplePhrases' | 'dailyChallenges' | 'prioritySupport' | 'unlimitedReviews'
  ): Promise<boolean> {
    const features = await this.getPremiumFeatures(userId);
    return features[feature] === true || (feature === 'dailyChallenges' && features.dailyChallenges >= 10);
  }

  /**
   * Get daily review limit for user
   */
  async getDailyReviewLimit(userId: string): Promise<number | null> {
    const isPremiumUser = await this.isPremium(userId);
    return isPremiumUser ? null : 10; // null = unlimited
  }
}

export const premiumService = new PremiumService();

