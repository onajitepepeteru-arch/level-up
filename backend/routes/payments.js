import express from 'express';
import Stripe from 'stripe';
import supabase from '../lib/supabase.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

router.post('/create-checkout-session', authenticateUser, async (req, res) => {
  try {
    const { priceId, planName } = req.body;
    const userId = req.user.id;

    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId
        }
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
      metadata: {
        user_id: userId,
        plan_name: planName
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const subscriptionId = session.subscription;

        await supabase
          .from('users')
          .update({
            subscription_active: true,
            subscription_tier: 'premium'
          })
          .eq('id', userId);

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan_id: session.metadata.plan_name || 'premium',
            current_period_end: new Date(subscription.current_period_end * 1000)
          });

        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({
            status: updatedSub.status,
            current_period_end: new Date(updatedSub.current_period_end * 1000)
          })
          .eq('stripe_subscription_id', updatedSub.id);

        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', deletedSub.id)
          .single();

        if (subData) {
          await supabase
            .from('users')
            .update({
              subscription_active: false,
              subscription_tier: 'free'
            })
            .eq('id', subData.user_id);

          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', deletedSub.id);
        }

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

router.get('/subscription-status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier, subscription_active, subscription_ends_at')
      .eq('id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      tier: user.subscription_tier,
      active: user.subscription_active,
      endsAt: user.subscription_ends_at,
      subscription
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.post('/cancel-subscription', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
