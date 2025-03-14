import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // We don't require priceId anymore, we'll create one on-demand
    const { planId, interval, isSubscriptionChange } = await req.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }
    
    // Get plan details from our configuration
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }
    
    // Initialize Stripe with a valid API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia", // Use a standard version
    });
    
    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    
    // Get user's subscription details
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", userId)
      .single();
    
    // Determine customer ID
    let customerId = subscription?.stripe_customer_id;
    
    // If no customer ID exists, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        metadata: {
          userId: userId
        }
      });
      
      customerId = customer.id;
      
      // Store the customer ID in the database
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          plan: "free",
          status: "active"
        });
    }
    
    // Define base success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${baseUrl}/settings?success=true&plan=${planId}`;
    const cancelUrl = `${baseUrl}/settings?canceled=true`;
    
    // If this is a plan change and we have a subscription ID, try using the portal
    if (isSubscriptionChange && subscription?.stripe_subscription_id) {
      try {
        // Create a portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: successUrl,
        });
        
        return NextResponse.json({ url: portalSession.url });
      } catch (portalError: any) {
        console.error("Portal access error:", portalError);
        // Fall through to create a regular checkout session below
      }
    }
    
    // Create a new product and price for the subscription
    // Create a new product
    const product = await stripe.products.create({
      name: `${plan.name} Plan`,
      description: plan.description,
      metadata: {
        planId: planId
      }
    });
    
    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: interval === "yearly" 
        ? Math.round(plan.priceYearly * 100)
        : Math.round(plan.priceMonthly * 100),
      currency: "usd",
      recurring: {
        interval: interval === "yearly" ? "year" : "month"
      },
      metadata: {
        planId: planId
      }
    });
    
    // Create the checkout session with the newly created price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId,
        planId,
        interval,
      },
      payment_method_types: ['card'],
    });
    
    // Return the session URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
