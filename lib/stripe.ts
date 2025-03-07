import Stripe from 'stripe';

// Check if the environment variable exists before initializing
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with a valid API version
// Note: If you're using a test key, make sure it starts with "sk_test_"
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia', // Use a currently supported API version
      typescript: true,
    })
  : null;

// Define subscription plan pricing IDs
export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
};

// IMPORTANT: Replace these with your actual Stripe Price IDs after creating products in Stripe Dashboard
// For now, we'll use placeholders for development
export const STRIPE_PRICE_IDS = {
  // Format: price_XXXXXXXXXXXXXXXXXXXXXX
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_placeholder_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_placeholder_pro_yearly',
  BUSINESS_MONTHLY: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'price_placeholder_business_monthly',
  BUSINESS_YEARLY: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || 'price_placeholder_business_yearly',
};

// Define the features available in each plan
export const PLAN_FEATURES = {
  [PLANS.FREE]: {
    name: 'Free',
    maxNotes: 5,
    maxStorageInMB: 10,
    collaborators: 0,
    features: [
      'Up to 5 documents',
      'Basic formatting',
      '10MB storage limit',
      'No collaboration'
    ],
  },
  [PLANS.PRO]: {
    name: 'Pro',
    maxNotes: 100,
    maxStorageInMB: 1000, // 1GB
    collaborators: 5,
    features: [
      'Up to 100 documents',
      'Advanced formatting',
      '1GB storage',
      'Up to 5 collaborators',
      'Priority support',
    ],
  },
  [PLANS.BUSINESS]: {
    name: 'Business',
    maxNotes: 1000,
    maxStorageInMB: 10000, // 10GB
    collaborators: 20,
    features: [
      'Unlimited documents',
      'Advanced formatting',
      '10GB storage',
      'Up to 20 collaborators',
      'Priority support',
      'Custom branding',
      'Admin dashboard'
    ],
  },
};

// Format a price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
}

// Helper function to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!stripe;
}
