import { supabase } from '../../config/supabase';

export interface CreateCheckoutSessionParams {
  userId: string;
  planId: 'premium';
  billingCycle: 'monthly' | 'yearly';
}

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired';
  planType: 'free' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

class PaymentService {
  /**
   * Create a Stripe checkout session
   * This calls a Supabase Edge Function that creates the session
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: params.userId,
          planId: params.planId,
          billingCycle: params.billingCycle,
        },
      });

      if (error) throw error;

      return { url: data?.url || null, error: null };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return { url: null, error };
    }
  }

  /**
   * Create a Stripe billing portal session for managing subscription
   */
  async createBillingPortalSession(userId: string): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: {
          userId,
        },
      });

      if (error) throw error;

      return { url: data?.url || null, error: null };
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      return { url: null, error };
    }
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, billing_cycle, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active subscription found
          return {
            status: 'canceled',
            planType: 'free',
            billingCycle: 'monthly',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          };
        }
        throw error;
      }

      return {
        status: data.status as SubscriptionStatus['status'],
        planType: data.plan_type as 'free' | 'premium',
        billingCycle: data.billing_cycle as 'monthly' | 'yearly',
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async hasActivePremium(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus(userId);
      return status?.status === 'active' && status?.planType === 'premium';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * Cancel subscription (sets cancel_at_period_end to true)
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId,
        },
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return { success: false, error };
    }
  }
}

export const paymentService = new PaymentService();







