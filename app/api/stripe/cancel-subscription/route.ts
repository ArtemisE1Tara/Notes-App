import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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
    
    // Initialize Stripe with a valid API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia", // Use a standard version
    });
    
    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    
    // Get the user's subscription details
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();
    
    // If user doesn't have a subscription in the database, just update to free plan
    if (error || !subscription?.stripe_subscription_id) {
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan: "free",
          status: "canceled"
        });
        
      return NextResponse.json({ success: true, message: "Set to free plan" });
    }
    
    try {
      // Cancel the subscription in Stripe
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      
      // Update the subscription in the database
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled"
        })
        .eq("user_id", userId);
        
      return NextResponse.json({ 
        success: true, 
        message: "Subscription successfully canceled" 
      });
    } catch (stripeError: any) {
      console.error("Stripe cancellation error:", stripeError);
      
      // If the subscription doesn't exist in Stripe (maybe it was already canceled),
      // still update the database record
      if (stripeError.code === 'resource_missing') {
        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled"
          })
          .eq("user_id", userId);
          
        return NextResponse.json({ 
          success: true, 
          message: "Updated to free plan" 
        });
      }
      
      return NextResponse.json(
        { error: stripeError.message || "Failed to cancel subscription" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
