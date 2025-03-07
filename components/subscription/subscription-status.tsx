"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/types/database.types";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreditCard, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_FEATURES, PLANS } from "@/lib/stripe";
import { useRouter } from "next/navigation";

interface SubscriptionStatusProps {
  subscription: Subscription | null;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleManageSubscription = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not access billing portal");
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      toast.error("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpgrade = () => {
    router.push("/pricing");
  };
  
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You're currently on the free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Badge variant="outline">Free</Badge>
            <span className="text-muted-foreground">Limited access to features</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock more features and storage space.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade Now
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Format the period end date nicely
  const periodEnd = subscription.current_period_end 
    ? format(new Date(subscription.current_period_end), 'MMMM d, yyyy')
    : 'Unknown';
  
  // Get plan features
  const planKey = subscription.plan as keyof typeof PLAN_FEATURES;
  const plan = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
  
  // Show different UI based on subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  const isCanceled = subscription.status === 'canceled' || subscription.status === 'incomplete_expired';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>{`${plan.name} plan`}</CardDescription>
          </div>
          
          {isActive && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
          )}
          
          {isPastDue && (
            <Badge variant="destructive">Past Due</Badge>
          )}
          
          {isCanceled && (
            <Badge variant="outline" className="border-amber-500 text-amber-500">Canceled</Badge>
          )}
          
          {subscription.cancel_at_period_end && (
            <Badge variant="outline" className="border-amber-500 text-amber-500">Cancels soon</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {isActive && (
            <div className="flex items-center text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              <span>Your subscription is active</span>
            </div>
          )}
          
          {subscription.cancel_at_period_end && (
            <div className="flex items-start text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p>Your subscription will be canceled on {periodEnd}</p>
                <p className="text-muted-foreground">You can renew your subscription before this date</p>
              </div>
            </div>
          )}
          
          {isPastDue && (
            <div className="flex items-start text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
              <div>
                <p>Your payment is past due</p>
                <p className="text-muted-foreground">Please update your payment method</p>
              </div>
            </div>
          )}
          
          {!isCanceled && (
            <div className="mt-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Document limit</span>
                <span className="font-medium">{plan.maxNotes} documents</span>
              </div>
              <div className="flex justify-between py-1 border-b pb-2">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">{plan.maxStorageInMB / 1000}GB</span>
              </div>
              
              {isActive && !subscription.cancel_at_period_end && (
                <div className="flex justify-between pt-2 items-center">
                  <span className="text-muted-foreground">Renews on</span>
                  <span className="font-medium">{periodEnd}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        {isActive && (
          <Button 
            onClick={handleManageSubscription} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? "Loading..." : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </>
            )}
          </Button>
        )}
        
        {isCanceled && (
          <Button 
            onClick={handleUpgrade} 
            className="w-full"
          >
            Reactivate Subscription
          </Button>
        )}
        
        {isPastDue && (
          <Button 
            onClick={handleManageSubscription}
            variant="destructive"
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? "Loading..." : "Update Payment Method"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}