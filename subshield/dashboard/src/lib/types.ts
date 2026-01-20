export type ContractStatus =
  | 'payment_received'
  | 'intake_sent'
  | 'contract_received'
  | 'analyzing'
  | 'review'
  | 'delivered'
  | 'follow_up';

export type RiskLevel = 'low' | 'medium' | 'high';

export type Recommendation =
  | 'sign_as_is'
  | 'sign_with_caution'
  | 'negotiate_first'
  | 'walk_away';

export interface ClauseData {
  pay_if_paid: boolean;
  pay_when_paid: boolean;
  unconditional_lien_waiver: boolean;
  conditional_lien_waiver: boolean;
  blanket_lien_waiver: boolean;
  broad_indemnification: boolean;
  comparative_indemnification: boolean;
  retainage_percent: number | null;
  retainage_release_tied_to_owner: boolean;
  change_order_notice_hours: number | null;
  liquidated_damages_daily: number | null;
  warranty_years: number | null;
  arbitration_required: boolean;
  venue_location: string | null;
}

export interface Contract {
  id: string;
  created_at: string;
  updated_at: string;

  // Customer Info
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_trade: string;
  customer_phone: string | null;

  // Contract Info
  gc_name: string;
  gc_contact: string | null;
  project_name: string | null;
  project_location: string | null;
  state: string;
  contract_value: number | null;

  // Status & Analysis
  status: ContractStatus;
  risk_score: number | null;
  recommendation: Recommendation | null;
  top_issues: string[] | null;

  // Clause Tracking
  clauses: ClauseData | null;

  // Notes
  internal_notes: string | null;

  // Stripe
  stripe_payment_id: string | null;
  amount_paid: number;
}

export interface ContractStats {
  total_contracts: number;
  total_revenue: number;
  avg_risk_score: number;
  contracts_by_status: Record<ContractStatus, number>;
  contracts_by_state: Record<string, number>;
  contracts_by_trade: Record<string, number>;
  gc_risk_profiles: Record<string, { count: number; avg_risk: number }>;
  clause_frequency: Partial<Record<keyof ClauseData, number>>;
}
