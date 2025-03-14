import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if Stripe secret key is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("Stripe secret key is not configured");
      return NextResponse.json(
        { error: "Stripe integration is not configured" },
        { status: 500 }
      );
    }

    // Initialize Stripe with a valid API version
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia", // Standard supported version
    });

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's subscription details from database
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get the customer ID or create a new one
    let stripeCustomerId: string | null = null;
    
    if (subscription?.stripe_customer_id) {
      try {
        // Try to retrieve the customer to verify it exists
        await stripe.customers.retrieve(subscription.stripe_customer_id);
        stripeCustomerId = subscription.stripe_customer_id;
      } catch (customerError: any) {
        // Customer not found, will create a new one below
        console.log("Customer not found in Stripe:", customerError.message);
      }
    }
    
    // If no valid customer ID, create a new customer
    if (!stripeCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        metadata: {
          userId: userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update or create subscription record in database
      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            plan: "free",
            status: "active"
          });
      }
    }

    try {
      // Create a Stripe customer portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin")}/settings`,
      });

      // Return the URL for the frontend to redirect to
      return NextResponse.json({ url: portalSession.url });
    } catch (portalError: any) {
      console.error("Stripe Portal error:", portalError.message);
      
      // Check if this is the "no configuration" error
      if (portalError.message?.includes("No configuration provided")) {
        // Return a special response that indicates the portal needs to be configured
        return NextResponse.json({
          error: "Stripe Customer Portal not configured",
          code: "PORTAL_NOT_CONFIGURED",
          message: "Please configure the Stripe Customer Portal in your Stripe Dashboard",
          stripeCustomerId: stripeCustomerId
        }, { status: 400 }); // Using 400 instead of 500 since this is a configuration issue
      }
      
      throw portalError; // Re-throw for other types of errors
    }
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    
    // Provide a more specific error message
    let errorMessage = "Failed to create portal session";
    if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
