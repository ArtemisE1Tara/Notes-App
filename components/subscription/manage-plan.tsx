'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscription-plans';
import { Subscription } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ManagePlanProps {
  subscription: Subscription | null;
}

export function ManagePlan({ subscription }: ManagePlanProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  
  const currentPlanId = subscription?.plan || 'free';
  const currentPlan = SUBSCRIPTION_PLANS[currentPlanId] || SUBSCRIPTION_PLANS.free;
  
  const handleChangePlan = async (plan: SubscriptionPlan) => {
    // Don't do anything if selecting the current plan
    if (plan.id === currentPlanId) return;
    
    setSelectedPlanId(plan.id);
    setIsLoading(true);
    
    try {
      // Handle downgrade to free plan 
      if (plan.id === 'free') {
        const response = await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to downgrade to free plan');
        }
        
        toast.success('Successfully downgraded to free plan');
        router.refresh();
        return;
      }
      
      // Handle paid plans - just send plan ID and interval, no need for price ID
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval: billingInterval,
          isSubscriptionChange: currentPlanId !== 'free',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // Redirect to checkout URL
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to process plan change. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlanId(null);
    }
  };
  
  const isCurrentPlan = (planId: string) => planId === currentPlanId;
  const isPlanLoading = (planId: string) => isLoading && selectedPlanId === planId;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Manage Subscription</h2>
        <p className="text-muted-foreground">
          Change your subscription plan or billing interval
        </p>
      </div>
      
      <Tabs defaultValue="monthly" onValueChange={(value) => setBillingInterval(value as 'monthly' | 'yearly')}>
        <div className="flex justify-end mb-4">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly <Badge className="ml-2 bg-green-100 text-green-800">Save 15%</Badge></TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="monthly" className="space-y-0 mt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                priceAmount={plan.priceMonthly}
                interval="monthly"
                isCurrentPlan={isCurrentPlan(plan.id)}
                isLoading={isPlanLoading(plan.id)}
                onSelect={() => handleChangePlan(plan)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-0 mt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                priceAmount={plan.priceYearly}
                interval="yearly"
                isCurrentPlan={isCurrentPlan(plan.id)}
                isLoading={isPlanLoading(plan.id)}
                onSelect={() => handleChangePlan(plan)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  priceAmount: number;
  interval: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, priceAmount, interval, isCurrentPlan, isLoading, onSelect }: PlanCardProps) {
  return (
    <Card className={`flex flex-col ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          {isCurrentPlan && (
            <Badge variant="outline" className="ml-2">Current Plan</Badge>
          )}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <span className="text-3xl font-bold">${priceAmount}</span>
          <span className="text-muted-foreground ml-1">/{interval}</span>
        </div>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center">
              {feature.included ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300 mr-2" />
              )}
              <span className={feature.included ? '' : 'text-muted-foreground'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          variant={isCurrentPlan ? "outline" : "default"}
          disabled={isLoading || isCurrentPlan}
          onClick={onSelect}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : (
            `Switch to ${plan.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
