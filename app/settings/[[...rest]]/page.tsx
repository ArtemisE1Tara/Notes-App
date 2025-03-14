import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account/account-settings";
import { Header } from "@/components/layout/header";
import { Subscription } from "@/types/database.types";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: { tab?: string }
}) {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId || !user) {
    redirect("/sign-in");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch the user's subscription data
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Don't throw error if subscription not found - user might be on free plan
  const userSubscription = error ? null : (subscription as Subscription);

  // Get the tab from search params if it exists
  const defaultTab = searchParams.tab || "subscription";

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={user.emailAddresses[0].emailAddress} />
      <main className="flex-1">
        <AccountSettings subscription={userSubscription} defaultTab={defaultTab} />
      </main>
    </div>
  );
}
