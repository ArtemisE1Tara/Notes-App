import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { priceId, planId, billingInterval } = await req.json();
    
    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }
    
    // Initialize Stripe with the latest API version that actually exists
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia",  // Use a standard version that exists
    });
    
    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    
    // Get customer ID if it exists
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();
    
    // Determine if user already has a customer account
    let customerId = subscription?.stripe_customer_id;
    
    // Create customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        metadata: { userId }
      });
      customerId = customer.id;
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          planId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto"
      },
      payment_method_types: ["card"],
      metadata: {
        userId,
        planId,
        billingInterval
      }
    });
    
    // Save in database that customer has started checkout process
    if (customerId) {
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId
        });
    }
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
