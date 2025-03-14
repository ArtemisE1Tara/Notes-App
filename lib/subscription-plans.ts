export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  maxNotes: number;
  maxStorageInMB: number;
  features: PlanFeature[];
}

// Using Stripe test mode standard price IDs that always work in test mode
// These are special price IDs that Stripe provides for testing
// We'll use empty strings for price IDs, and let the backend create them dynamically
const STRIPE_PRO_MONTHLY_PRICE_ID = '';
const STRIPE_PRO_YEARLY_PRICE_ID = '';
const STRIPE_BUSINESS_MONTHLY_PRICE_ID = '';
const STRIPE_BUSINESS_YEARLY_PRICE_ID = '';

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For individual note-taking",
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    maxNotes: 5,
    maxStorageInMB: 50,
    features: [
      { name: "Up to 5 notes", included: true },
      { name: "Basic formatting", included: true },
      { name: "50MB storage", included: true },
      { name: "Access on all devices", included: true },
      { name: "Note sharing", included: true },
      { name: "Collaboration features", included: false },
      { name: "Priority support", included: false },
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For power users",
    priceMonthly: 9.99,
    priceYearly: 99.99,
    stripePriceIdMonthly: STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: STRIPE_PRO_YEARLY_PRICE_ID,
    maxNotes: 100,
    maxStorageInMB: 1000,
    features: [
      { name: "Up to 100 notes", included: true },
      { name: "Advanced formatting", included: true },
      { name: "1GB storage", included: true },
      { name: "Access on all devices", included: true },
      { name: "Note sharing", included: true },
      { name: "Collaboration features", included: true },
      { name: "Priority support", included: false },
    ],
  },
  business: {
    id: "business",
    name: "Business",
    description: "For teams and businesses",
    priceMonthly: 19.99,
    priceYearly: 199.99,
    stripePriceIdMonthly: STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    stripePriceIdYearly: STRIPE_BUSINESS_YEARLY_PRICE_ID,
    maxNotes: 500,
    maxStorageInMB: 10000,
    features: [
      { name: "Unlimited notes", included: true },
      { name: "Advanced formatting", included: true },
      { name: "10GB storage", included: true },
      { name: "Access on all devices", included: true },
      { name: "Note sharing", included: true },
      { name: "Collaboration features", included: true },
      { name: "Priority support", included: true },
    ],
  },
};

export function getPlanById(id: string): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[id] || SUBSCRIPTION_PLANS.free;
}
