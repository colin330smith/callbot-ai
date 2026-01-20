// Local storage-based store for MVP
// Will migrate to Supabase when ready

import { Contract, ContractStats, ContractStatus } from './types';

const STORAGE_KEY = 'subshield_contracts';

export function getContracts(): Contract[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveContracts(contracts: Contract[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

export function addContract(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Contract {
  const contracts = getContracts();
  const newContract: Contract = {
    ...contract,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  contracts.unshift(newContract);
  saveContracts(contracts);
  return newContract;
}

export function updateContract(id: string, updates: Partial<Contract>): Contract | null {
  const contracts = getContracts();
  const index = contracts.findIndex(c => c.id === id);
  if (index === -1) return null;

  contracts[index] = {
    ...contracts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveContracts(contracts);
  return contracts[index];
}

export function deleteContract(id: string): boolean {
  const contracts = getContracts();
  const filtered = contracts.filter(c => c.id !== id);
  if (filtered.length === contracts.length) return false;
  saveContracts(filtered);
  return true;
}

export function getContractById(id: string): Contract | null {
  const contracts = getContracts();
  return contracts.find(c => c.id === id) || null;
}

export function calculateStats(contracts: Contract[]): ContractStats {
  const stats: ContractStats = {
    total_contracts: contracts.length,
    total_revenue: contracts.reduce((sum, c) => sum + c.amount_paid, 0),
    avg_risk_score: 0,
    contracts_by_status: {} as Record<ContractStatus, number>,
    contracts_by_state: {},
    contracts_by_trade: {},
    gc_risk_profiles: {},
    clause_frequency: {},
  };

  // Status counts
  const statuses: ContractStatus[] = [
    'payment_received',
    'intake_sent',
    'contract_received',
    'analyzing',
    'review',
    'delivered',
    'follow_up',
  ];
  statuses.forEach(s => {
    stats.contracts_by_status[s] = contracts.filter(c => c.status === s).length;
  });

  // State counts
  contracts.forEach(c => {
    stats.contracts_by_state[c.state] = (stats.contracts_by_state[c.state] || 0) + 1;
  });

  // Trade counts
  contracts.forEach(c => {
    const trade = c.customer_trade.toLowerCase();
    stats.contracts_by_trade[trade] = (stats.contracts_by_trade[trade] || 0) + 1;
  });

  // GC risk profiles
  contracts.forEach(c => {
    if (c.risk_score !== null) {
      if (!stats.gc_risk_profiles[c.gc_name]) {
        stats.gc_risk_profiles[c.gc_name] = { count: 0, avg_risk: 0 };
      }
      const profile = stats.gc_risk_profiles[c.gc_name];
      profile.avg_risk = (profile.avg_risk * profile.count + c.risk_score) / (profile.count + 1);
      profile.count++;
    }
  });

  // Average risk score
  const scored = contracts.filter(c => c.risk_score !== null);
  if (scored.length > 0) {
    stats.avg_risk_score = scored.reduce((sum, c) => sum + (c.risk_score || 0), 0) / scored.length;
  }

  // Clause frequency
  const clauseKeys = [
    'pay_if_paid',
    'pay_when_paid',
    'unconditional_lien_waiver',
    'conditional_lien_waiver',
    'blanket_lien_waiver',
    'broad_indemnification',
    'comparative_indemnification',
    'retainage_release_tied_to_owner',
    'arbitration_required',
  ] as const;

  clauseKeys.forEach(key => {
    stats.clause_frequency[key] = contracts.filter(
      c => c.clauses && c.clauses[key] === true
    ).length;
  });

  return stats;
}

// Sample data to demonstrate dashboard functionality
export function loadDemoData(): void {
  const sampleContracts: Omit<Contract, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      customer_name: "Marcus Williams",
      customer_email: "marcus@williamsmechanical.com",
      customer_company: "Williams Mechanical LLC",
      customer_trade: "HVAC",
      customer_phone: "813-555-2847",
      gc_name: "Horizon Development Group",
      gc_contact: "Jennifer Adams",
      project_name: "Bayshore Medical Plaza",
      project_location: "Tampa, FL",
      state: "FL",
      contract_value: 428000,
      status: "delivered",
      risk_score: 8,
      recommendation: "negotiate_first",
      top_issues: ["Pay-if-paid clause shifts owner risk", "Unconditional lien waivers before payment", "Broad indemnification includes GC negligence"],
      clauses: {
        pay_if_paid: true,
        pay_when_paid: false,
        unconditional_lien_waiver: true,
        conditional_lien_waiver: false,
        blanket_lien_waiver: true,
        broad_indemnification: true,
        comparative_indemnification: false,
        retainage_percent: 10,
        retainage_release_tied_to_owner: true,
        change_order_notice_hours: 48,
        liquidated_damages_daily: 750,
        warranty_years: 2,
        arbitration_required: true,
        venue_location: "Hillsborough County, FL",
      },
      internal_notes: "Customer negotiated pay-if-paid down to pay-when-paid 45 days. Success.",
      stripe_payment_id: "pi_3QxSample001",
      amount_paid: 147,
    },
    {
      customer_name: "David Park",
      customer_email: "david@parkelectrical.net",
      customer_company: "Park Electrical Services",
      customer_trade: "Electrical",
      customer_phone: "972-555-8834",
      gc_name: "Cornerstone Builders Inc",
      gc_contact: "Robert Chen",
      project_name: "Legacy Office Tower",
      project_location: "Dallas, TX",
      state: "TX",
      contract_value: 892000,
      status: "delivered",
      risk_score: 5,
      recommendation: "sign_with_caution",
      top_issues: ["10% retainage held until owner pays", "7-day change order notice window", "Arbitration in Dallas County"],
      clauses: {
        pay_if_paid: false,
        pay_when_paid: true,
        unconditional_lien_waiver: false,
        conditional_lien_waiver: true,
        blanket_lien_waiver: false,
        broad_indemnification: false,
        comparative_indemnification: true,
        retainage_percent: 10,
        retainage_release_tied_to_owner: true,
        change_order_notice_hours: 168,
        liquidated_damages_daily: 1200,
        warranty_years: 1,
        arbitration_required: true,
        venue_location: "Dallas County, TX",
      },
      internal_notes: "Relatively fair contract. Texas lien laws strong. Advised to document everything.",
      stripe_payment_id: "pi_3QxSample002",
      amount_paid: 147,
    },
    {
      customer_name: "Angela Reyes",
      customer_email: "angela@reyesplumbing.com",
      customer_company: "Reyes Plumbing & Fire",
      customer_trade: "Plumbing",
      customer_phone: "602-555-1192",
      gc_name: "Summit Construction Corp",
      gc_contact: null,
      project_name: "Scottsdale Luxury Condos",
      project_location: "Scottsdale, AZ",
      state: "AZ",
      contract_value: 315000,
      status: "analyzing",
      risk_score: null,
      recommendation: null,
      top_issues: null,
      clauses: null,
      internal_notes: "Contract received. 47 pages. Starting analysis.",
      stripe_payment_id: "pi_3QxSample003",
      amount_paid: 147,
    },
    {
      customer_name: "James Mitchell",
      customer_email: "james@mitchellroofing.com",
      customer_company: "Mitchell Commercial Roofing",
      customer_trade: "Roofing",
      customer_phone: "404-555-7762",
      gc_name: "Horizon Development Group",
      gc_contact: "Jennifer Adams",
      project_name: "Peachtree Business Center",
      project_location: "Atlanta, GA",
      state: "GA",
      contract_value: 567000,
      status: "delivered",
      risk_score: 9,
      recommendation: "walk_away",
      top_issues: ["Pay-if-paid unenforceable in GA but still present", "Blanket lien waiver covers future work", "24-hour change order notice impossible", "Indemnification includes GC sole negligence"],
      clauses: {
        pay_if_paid: true,
        pay_when_paid: false,
        unconditional_lien_waiver: true,
        conditional_lien_waiver: false,
        blanket_lien_waiver: true,
        broad_indemnification: true,
        comparative_indemnification: false,
        retainage_percent: 10,
        retainage_release_tied_to_owner: true,
        change_order_notice_hours: 24,
        liquidated_damages_daily: 1500,
        warranty_years: 5,
        arbitration_required: false,
        venue_location: "Fulton County, GA",
      },
      internal_notes: "Same GC as Tampa project. Pattern of aggressive contracts. Customer walked away. Referred to attorney.",
      stripe_payment_id: "pi_3QxSample004",
      amount_paid: 147,
    },
    {
      customer_name: "Lisa Thompson",
      customer_email: "lisa@thompsoninteriors.net",
      customer_company: "Thompson Interior Systems",
      customer_trade: "Drywall",
      customer_phone: null,
      gc_name: "Apex Builders LLC",
      gc_contact: "Mark Stevens",
      project_name: null,
      project_location: "Denver, CO",
      state: "CO",
      contract_value: 189000,
      status: "intake_sent",
      risk_score: null,
      recommendation: null,
      top_issues: null,
      clauses: null,
      internal_notes: null,
      stripe_payment_id: "pi_3QxSample005",
      amount_paid: 147,
    },
    {
      customer_name: "Roberto Sanchez",
      customer_email: "roberto@sanchezmasonry.com",
      customer_company: "Sanchez Masonry Inc",
      customer_trade: "Masonry",
      customer_phone: "305-555-3318",
      gc_name: "BuildRight Construction",
      gc_contact: "Amanda Foster",
      project_name: "Brickell Tower III",
      project_location: "Miami, FL",
      state: "FL",
      contract_value: 743000,
      status: "review",
      risk_score: 7,
      recommendation: "negotiate_first",
      top_issues: ["Pay-if-paid clause", "Progress payment terms unclear", "Retainage release vague"],
      clauses: {
        pay_if_paid: true,
        pay_when_paid: false,
        unconditional_lien_waiver: false,
        conditional_lien_waiver: true,
        blanket_lien_waiver: false,
        broad_indemnification: true,
        comparative_indemnification: false,
        retainage_percent: 5,
        retainage_release_tied_to_owner: false,
        change_order_notice_hours: 72,
        liquidated_damages_daily: 2000,
        warranty_years: 2,
        arbitration_required: true,
        venue_location: "Miami-Dade County, FL",
      },
      internal_notes: "Analysis complete. Drafting negotiation scripts. Will send tomorrow AM.",
      stripe_payment_id: "pi_3QxSample006",
      amount_paid: 147,
    },
    {
      customer_name: "Kevin O'Brien",
      customer_email: "kevin@obrienfire.com",
      customer_company: "O'Brien Fire Protection",
      customer_trade: "Fire Protection",
      customer_phone: "919-555-4421",
      gc_name: "Carolina Commercial Builders",
      gc_contact: "Thomas Wright",
      project_name: "RTP Tech Campus",
      project_location: "Raleigh, NC",
      state: "NC",
      contract_value: 512000,
      status: "delivered",
      risk_score: 4,
      recommendation: "sign_as_is",
      top_issues: ["Standard retainage terms", "Reasonable change order window"],
      clauses: {
        pay_if_paid: false,
        pay_when_paid: true,
        unconditional_lien_waiver: false,
        conditional_lien_waiver: true,
        blanket_lien_waiver: false,
        broad_indemnification: false,
        comparative_indemnification: true,
        retainage_percent: 5,
        retainage_release_tied_to_owner: false,
        change_order_notice_hours: 120,
        liquidated_damages_daily: 500,
        warranty_years: 1,
        arbitration_required: false,
        venue_location: "Wake County, NC",
      },
      internal_notes: "Fair contract. GC has good reputation. Recommended signing.",
      stripe_payment_id: "pi_3QxSample007",
      amount_paid: 147,
    },
    {
      customer_name: "Michelle Taylor",
      customer_email: "michelle@taylorconcrete.com",
      customer_company: "Taylor Concrete & Foundations",
      customer_trade: "Concrete",
      customer_phone: "623-555-9087",
      gc_name: "Desert Valley Construction",
      gc_contact: null,
      project_name: "Gilbert Distribution Center",
      project_location: "Gilbert, AZ",
      state: "AZ",
      contract_value: 1250000,
      status: "contract_received",
      risk_score: null,
      recommendation: null,
      top_issues: null,
      clauses: null,
      internal_notes: "Large contract. Customer priority. Starting analysis today.",
      stripe_payment_id: "pi_3QxSample008",
      amount_paid: 147,
    },
  ];

  const contracts = getContracts();
  if (contracts.length === 0) {
    sampleContracts.forEach(c => addContract(c));
  }
}
