import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Enable development mode to bypass actual Stripe API calls
const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe && !DEVELOPMENT_MODE) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    // Get user info
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { plan, interval } = body;
    
    // Validate plan and interval
    if (!plan || !['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 });
    }

    // Set up Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already has a Stripe customer ID
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = subscriptionData?.stripe_customer_id;
    
    // Determine which price ID to use
    let priceId;
    if (plan === 'pro') {
      priceId = interval === 'yearly' ? STRIPE_PRICE_IDS.PRO_YEARLY : STRIPE_PRICE_IDS.PRO_MONTHLY;
    } else if (plan === 'business') {
      priceId = interval === 'yearly' ? STRIPE_PRICE_IDS.BUSINESS_YEARLY : STRIPE_PRICE_IDS.BUSINESS_MONTHLY;
    } else {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // In development mode or when using placeholder IDs, use a mock checkout process
    if (DEVELOPMENT_MODE || priceId.startsWith('price_placeholder_')) {
      console.log('Using development mode checkout for plan:', plan, 'interval:', interval);
      
      // Insert dummy subscription for demo purposes
      try {
        // Check if a subscription already exists for this user
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (existingSub) {
          // Update existing subscription
          await supabase
            .from('subscriptions')
            .update({
              plan,
              status: 'active',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            })
            .eq('user_id', userId);
        } else {
          // Create new subscription
          await supabase.from('subscriptions').insert({
            user_id: userId,
            stripe_customer_id: 'cus_dev_' + userId,
            stripe_subscription_id: 'sub_dev_' + Date.now(),
            status: 'active',
            plan,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
          });
        }
      } catch (err) {
        console.error('Error creating demo subscription:', err);
      }

      // Return a demo URL that redirects to dashboard with success parameter
      return NextResponse.json({ 
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&demo=true`,
        demo: true 
      });
    }

    // If we're not in development mode, we need a real Stripe setup
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe client not initialized' }, { status: 500 });
    }

    // If user doesn't have a customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0].emailAddress,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Store the customer ID in our database
      await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: customerId,
        status: 'incomplete',
        plan: 'free',
      });
    }

    // Create checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?payment=cancelled`,
      subscription_data: { metadata: { userId } },
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Checkout session creation failed', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}
