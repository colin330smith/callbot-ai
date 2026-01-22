import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getAdminClient } from '@/lib/supabase-server';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/database.types';

// Lazy initialization to avoid build-time errors when env vars aren't set
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeClient;
}

// Helper to get subscription period from items (Stripe API 2025-12-15.clover structure)
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: number; end: number } {
  const item = subscription.items.data[0];
  if (item) {
    return {
      start: item.current_period_start,
      end: item.current_period_end,
    };
  }
  // Fallback to subscription created time + 30 days if no items
  const now = Math.floor(Date.now() / 1000);
  return {
    start: subscription.created || now,
    end: (subscription.created || now) + 30 * 24 * 60 * 60,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as SubscriptionTier;

        if (userId && tier) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const period = getSubscriptionPeriod(subscription);

          await supabase
            .from('subscriptions')
            .update({
              tier,
              status: 'active',
              stripe_subscription_id: subscription.id,
              current_period_start: new Date(period.start * 1000).toISOString(),
              current_period_end: new Date(period.end * 1000).toISOString(),
              contracts_limit: TIER_LIMITS[tier].contracts,
              contracts_used_this_month: 0,
            } as never)
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const tier = subscription.metadata?.tier as SubscriptionTier;
        const period = getSubscriptionPeriod(subscription);

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({
              tier: tier || undefined,
              status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'canceled',
              current_period_start: new Date(period.start * 1000).toISOString(),
              current_period_end: new Date(period.end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              contracts_limit: tier ? TIER_LIMITS[tier].contracts : undefined,
            } as never)
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          // Downgrade to free tier
          await supabase
            .from('subscriptions')
            .update({
              tier: 'free',
              status: 'active',
              stripe_subscription_id: null,
              current_period_start: null,
              current_period_end: null,
              cancel_at_period_end: false,
              contracts_limit: TIER_LIMITS.free.contracts,
            } as never)
            .eq('user_id', userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // In API 2025-12-15.clover, subscription is in parent.subscription_details
        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subscriptionRef === 'string'
          ? subscriptionRef
          : subscriptionRef?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
              } as never)
              .eq('user_id', userId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
