# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for premium subscriptions.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Supabase project with Edge Functions enabled

## Step 1: Create Stripe Products and Prices

1. Go to Stripe Dashboard → Products
2. Create a product called "Lingoscope Premium"
3. Create two prices:
   - **Monthly**: $9.99/month (recurring)
   - **Yearly**: $99.99/year (recurring, save 17%)

Copy the Price IDs (they start with `price_...`)

## Step 2: Set Up Environment Variables in Supabase

Go to your Supabase Dashboard → Project Settings → Edge Functions → Secrets

Add these secrets:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook endpoint)
STRIPE_PRICE_PREMIUM_MONTHLY=price_... (your monthly price ID)
STRIPE_PRICE_PREMIUM_YEARLY=price_... (your yearly price ID)
APP_URL=lingoscope:// (your app's deep link scheme)
```

## Step 3: Deploy Edge Functions

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-billing-portal-session
supabase functions deploy cancel-subscription
```

## Step 4: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Use your Supabase function URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 5: Run Database Migration

```bash
# Apply the subscription migration
supabase db push
```

Or manually run the SQL from `supabase/migrations/003_create_subscriptions.sql` in your Supabase SQL editor.

## Step 6: Test the Integration

### Test Mode
1. Use Stripe test cards: https://stripe.com/docs/testing
2. Recommended test card: `4242 4242 4242 4242`
3. Use any future expiry date and any CVC

### Test Flow
1. Open the app and go to Pricing screen
2. Select Premium plan
3. Click "Subscribe to Premium"
4. Complete checkout with test card
5. Check Supabase `subscriptions` table for new record
6. Verify `user_profiles.subscription_plan` is updated to "premium"

## Step 7: Handle Deep Links (Optional)

To handle Stripe redirects back to your app:

1. Add deep link handling in your app navigation
2. Check for `success=true` or `canceled=true` query params
3. Refresh subscription status when returning from checkout

## Production Checklist

- [ ] Switch to live Stripe keys (`sk_live_...`)
- [ ] Update price IDs to production prices
- [ ] Test webhook endpoint with Stripe CLI
- [ ] Set up proper error monitoring
- [ ] Add analytics tracking for conversions
- [ ] Test subscription cancellation flow
- [ ] Test subscription renewal flow

## Troubleshooting

### Checkout session not creating
- Verify Stripe secret key is correct
- Check Edge Function logs in Supabase dashboard
- Ensure user is authenticated

### Webhook not receiving events
- Verify webhook URL is correct
- Check webhook signing secret matches
- Review Edge Function logs

### Subscription not updating
- Check database RLS policies
- Verify trigger function is working
- Check Edge Function logs for errors







