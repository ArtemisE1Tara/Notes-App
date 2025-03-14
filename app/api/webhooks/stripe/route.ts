import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { headers } from "next/headers";

// Initialize Stripe with a standard API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  console.log("Webhook received");
  
  try {
    // Immediately return a 200 response to prevent timeout
    // This tells Stripe the webhook was received
    const responsePromise = NextResponse.json({ received: true });
    
    // Process the webhook in the background
    processWebhookAsync(req).catch(error => {
      console.error("Background webhook processing error:", error);
    });
    
    // Return response immediately
    return responsePromise;
  } catch (error) {
    console.error("Webhook initial error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}

// Process the webhook asynchronously
async function processWebhookAsync(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;
    
    // Parse and verify the event
    let event: Stripe.Event;
    
    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // For development without webhook signature verification
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return; // Exit early on verification failure
    }
    
    console.log(`Processing webhook: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event);
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionChange(event);
        break;
      }
    }
    
    console.log(`Completed processing webhook: ${event.type}`);
  } catch (error) {
    console.error("Error in background webhook processing:", error);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Skip if no subscription or customer
  if (!session.subscription || !session.customer) return;
  
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  
  try {
    // Get the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Get plan information from metadata
    const planId = subscription.metadata.planId || 
                  session.metadata?.planId || 
                  "pro"; // Default to pro if not specified
    
    // Simplify to reduce processing time - only update essential fields
    await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        plan: planId,
        status: subscription.status,
      })
      .eq("stripe_customer_id", customerId);
      
    console.log(`Updated subscription for customer ${customerId} to ${planId}`);
  } catch (error) {
    console.error("Error processing checkout completion:", error);
  }
}

async function handleSubscriptionChange(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  if (!subscription.customer) return;
  
  try {
    // Get plan ID from metadata or use default
    const planId = subscription.metadata.planId || 
                  (subscription.status === "active" ? "pro" : "free");
    
    // Simplified update with only critical fields
    await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        plan: subscription.status === "canceled" ? "free" : planId,
        status: subscription.status,
      })
      .eq("stripe_customer_id", subscription.customer as string);
      
    console.log(`Updated subscription status to ${subscription.status} for plan ${planId}`);
  } catch (error) {
    console.error("Error processing subscription change:", error);
  }
}
