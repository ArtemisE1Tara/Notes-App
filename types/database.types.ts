export interface Note {
  id: string; 
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string; // Optional since it might not exist in older notes
}

export interface CreateNoteInput {
  title: string;
  content: string;
  user_id: string;
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  updated_at?: string;
}

// New types for subscription handling
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan: 'free' | 'pro' | 'business';
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at?: string;
}

