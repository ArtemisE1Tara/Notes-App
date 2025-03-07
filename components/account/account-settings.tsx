"use client";

import { useUser } from "@clerk/nextjs";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";
import { Subscription } from "@/types/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@clerk/nextjs";
import { UpgradeButton } from "../subscription/upgrade-button";

interface AccountSettingsProps {
  subscription: Subscription | null;
}

export function AccountSettings({ subscription }: AccountSettingsProps) {
  const { user } = useUser();
  
  if (!user) return null;
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and subscription
          </p>
        </div>
        
        {(!subscription || subscription.plan === "free") && (
          <UpgradeButton />
        )}
      </div>
      
      <Tabs defaultValue="subscription">
        <TabsList className="mb-6">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <SubscriptionStatus subscription={subscription} />
            
            <Card>
              <CardHeader>
                <CardTitle>Need help?</CardTitle>
                <CardDescription>Contact our support team for assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have any questions or issues with your subscription, please don't hesitate to reach out to our support team.
                </p>
                <p className="text-sm">
                  <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                    support@example.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="profile">
          <div className="rounded-md border">
            <UserProfile />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
