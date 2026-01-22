/**
 * Supabase Database Types
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'business';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          contracts_used_this_month: number;
          contracts_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          contracts_used_this_month?: number;
          contracts_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          contracts_used_this_month?: number;
          contracts_limit?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      contracts: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_size: number | null;
          page_count: number | null;
          contract_text: string | null;
          gc_name: string | null;
          project_name: string | null;
          contract_value: string | null;
          risk_score: number;
          recommendation: string;
          executive_summary: string;
          estimated_exposure: string | null;
          analysis_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_size?: number | null;
          page_count?: number | null;
          contract_text?: string | null;
          gc_name?: string | null;
          project_name?: string | null;
          contract_value?: string | null;
          risk_score: number;
          recommendation: string;
          executive_summary: string;
          estimated_exposure?: string | null;
          analysis_json: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          filename?: string;
          gc_name?: string | null;
          project_name?: string | null;
          contract_value?: string | null;
          risk_score?: number;
          recommendation?: string;
          executive_summary?: string;
          estimated_exposure?: string | null;
          analysis_json?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contracts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      contract_reminders: {
        Row: {
          id: string;
          contract_id: string;
          user_id: string;
          reminder_type: string;
          reminder_date: string;
          title: string;
          description: string | null;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          user_id: string;
          reminder_type: string;
          reminder_date: string;
          title: string;
          description?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          reminder_date?: string;
          title?: string;
          description?: string | null;
          is_completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'contract_reminders_contract_id_fkey';
            columns: ['contract_id'];
            isOneToOne: false;
            referencedRelation: 'contracts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contract_reminders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_owner_id: string;
          member_email: string;
          member_user_id: string | null;
          role: 'admin' | 'member' | 'viewer';
          invited_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_owner_id: string;
          member_email: string;
          member_user_id?: string | null;
          role?: 'admin' | 'member' | 'viewer';
          invited_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          member_user_id?: string | null;
          role?: 'admin' | 'member' | 'viewer';
          accepted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_owner_id_fkey';
            columns: ['team_owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_member_user_id_fkey';
            columns: ['member_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      service_requests: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          name: string;
          company: string | null;
          phone: string | null;
          service_type: 'express_review' | 'monthly_retainer' | 'premium_retainer' | 'enterprise';
          message: string | null;
          status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          name: string;
          company?: string | null;
          phone?: string | null;
          service_type: 'express_review' | 'monthly_retainer' | 'premium_retainer' | 'enterprise';
          message?: string | null;
          status?: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'declined';
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Subscription tier limits
export const TIER_LIMITS: Record<SubscriptionTier, { contracts: number; teamMembers: number; features: string[] }> = {
  free: {
    contracts: 1,
    teamMembers: 0,
    features: ['Risk score', 'Top 3 issues only', 'No history'],
  },
  pro: {
    contracts: 10,
    teamMembers: 0,
    features: ['Full analysis', 'All issues', 'Negotiation scripts', 'PDF export', '90-day history', 'Email support'],
  },
  team: {
    contracts: 25,
    teamMembers: 5,
    features: ['Everything in Pro', '5 team members', '1-year history', 'Priority processing', 'Chat support'],
  },
  business: {
    contracts: -1, // Unlimited
    teamMembers: 15,
    features: ['Everything in Team', 'Unlimited contracts', '15 team members', 'API access', 'Custom clause library', 'Phone + Slack support'],
  },
};

// Pricing
export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; annual: number; stripePriceId?: string }> = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 49, annual: 470, stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID },
  team: { monthly: 99, annual: 950, stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID },
  business: { monthly: 249, annual: 2390, stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID },
};
