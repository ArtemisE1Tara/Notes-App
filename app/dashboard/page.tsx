import { createClient } from "@supabase/supabase-js";
import { DashboardClient } from "./client";
import { Header } from "@/components/layout/header";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch notes with error handling
  try {
    // Check for payment status in URL parameters
    const paymentStatus = searchParams.payment;
    const isDemo = searchParams.demo === 'true';
    
    // Fetch user's subscription along with notes
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    // Fetch notes
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // Handle setup error (unchanged)
      if (error.code === "42P01") {
        return (
          <div className="flex min-h-screen flex-col">
            <Header email={user.emailAddresses[0].emailAddress} />
            <main className="flex-1 container py-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6">
                <h2 className="text-lg font-semibold mb-2">Database setup required</h2>
                <p className="mb-4">
                  It looks like the notes table hasn't been created yet. Please run the setup first.
                </p>
                <Link
                  href="/setup"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Run Setup
                </Link>
              </div>
            </main>
          </div>
        );
      }

      // Other error
      console.error("Error fetching notes:", error);
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return (
      <div className="flex min-h-screen flex-col">
        <Header email={user.emailAddresses[0].emailAddress} />
        <main className="flex-1 container py-6">
          {/* Payment success message */}
          {paymentStatus === 'success' && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle>Payment Successful!</AlertTitle>
              <AlertDescription>
                {isDemo 
                  ? "Your demo subscription has been activated. This is a simulated subscription for development purposes." 
                  : "Your subscription has been activated. Thank you for your purchase!"}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Demo mode warning */}
          {isDemo && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This is a simulated subscription for development purposes. No actual payment was processed.
              </AlertDescription>
            </Alert>
          )}

          <DashboardClient initialNotes={notes || []} userId={userId} subscription={subscription} />
        </main>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    throw new Error("Something went wrong loading the dashboard");
  }
}

