"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { PLAN_FEATURES, PLANS, isStripeConfigured } from '@/lib/stripe';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  // Check if Stripe is configured
  const isDevelopment = process.env.NODE_ENV === 'development';

  const freePlan = PLAN_FEATURES[PLANS.FREE];
  const proPlan = PLAN_FEATURES[PLANS.PRO];
  const businessPlan = PLAN_FEATURES[PLANS.BUSINESS];

  // Mock prices - in a real app, fetch these from Stripe or your database
  const prices = {
    pro: {
      monthly: 9.99,
      yearly: 99.99  // ~2 months free
    },
    business: {
      monthly: 19.99,
      yearly: 199.99
    }
  };

  const handleSubscription = async (planId: string) => {
    // Clear any previous errors
    setError(null);
    
    if (!isLoaded || !userId) {
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    setIsLoading(planId);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          interval: isYearly ? 'yearly' : 'monthly'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // More detailed error handling
        console.error('Checkout API error:', data);
        setError(data.error || "Failed to create checkout session");
        toast.error(data.error || "Failed to create checkout session");
        return;
      }

      // Check if this is a demo redirect
      if (data.demo) {
        toast.success("Development mode: Simulating successful subscription");
      }

      // Redirect to checkout or demo URL
      if (data.url) {
        router.push(data.url);
      } else {
        setError("Invalid response from server");
        toast.error("Invalid response from server");
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : "Network error";
      setError(`Failed to process request: ${errorMessage}`);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const getPriceString = (base: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(base);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={user?.emailAddresses[0]?.emailAddress || ""} />
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="max-w-6xl w-full mx-auto">
          {/* Show development mode notice */}
          {isDevelopment && (
            <Alert variant="warning" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Development Mode</AlertTitle>
              <AlertDescription>
                Running in development mode with simulated subscriptions. No actual charges will be made.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show error message if present */}
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isStripeConfigured && (
            <Alert variant="warning" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Stripe not configured</AlertTitle>
              <AlertDescription>
                Stripe integration is not fully configured. To enable payments, add your Stripe keys to .env.local.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-gray-600 mb-8">
              Select the perfect plan for your note-taking needs
            </p>

            <div className="flex items-center justify-center mb-8">
              <Label htmlFor="billing-toggle" className="mr-2">Monthly</Label>
              <Switch 
                id="billing-toggle" 
                checked={isYearly} 
                onCheckedChange={setIsYearly} 
              />
              <Label htmlFor="billing-toggle" className="ml-2">
                Yearly
                <span className="ml-1.5 rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5">
                  Save 17%
                </span>
              </Label>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Free</CardTitle>
                <CardDescription>For individuals just getting started</CardDescription>
                <div className="mt-4 text-3xl font-bold">$0</div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {freePlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="flex flex-col border-blue-200 shadow-md relative">
              <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm font-medium">
                MOST POPULAR
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-xl">Pro</CardTitle>
                <CardDescription>For professionals and small teams</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {getPriceString(isYearly ? prices.pro.yearly / 12 : prices.pro.monthly)}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-gray-600 mt-1">
                      Billed annually (${getPriceString(prices.pro.yearly)})
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {proPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => handleSubscription(PLANS.PRO)}
                  disabled={isLoading !== null}
                >
                  {isLoading === PLANS.PRO ? 'Processing...' : 'Upgrade to Pro'}
                </Button>
              </CardFooter>
            </Card>

            {/* Business Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">Business</CardTitle>
                <CardDescription>For organizations and large teams</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {getPriceString(isYearly ? prices.business.yearly / 12 : prices.business.monthly)}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-gray-600 mt-1">
                      Billed annually (${getPriceString(prices.business.yearly)})
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {businessPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => handleSubscription(PLANS.BUSINESS)}
                  disabled={isLoading !== null}
                >
                  {isLoading === PLANS.BUSINESS ? 'Processing...' : 'Upgrade to Business'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-lg font-medium mb-4">Need something specific?</h3>
            <p className="text-gray-600 mb-4">
              Contact us for enterprise plans or custom requirements
            </p>
            <Button variant="link">Contact Sales</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
