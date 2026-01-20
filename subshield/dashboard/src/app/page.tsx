'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  MapPin,
  Wrench,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  BarChart3,
  X,
} from 'lucide-react';
import {
  Contract,
  ContractStatus,
  ContractStats,
  Recommendation,
  ClauseData,
} from '@/lib/types';
import {
  getContracts,
  addContract,
  updateContract,
  deleteContract,
  calculateStats,
  loadDemoData,
} from '@/lib/store';

const STATUS_LABELS: Record<ContractStatus, string> = {
  payment_received: 'Payment Received',
  intake_sent: 'Intake Sent',
  contract_received: 'Contract Received',
  analyzing: 'Analyzing',
  review: 'In Review',
  delivered: 'Delivered',
  follow_up: 'Follow Up',
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  payment_received: 'bg-blue-100 text-blue-800',
  intake_sent: 'bg-yellow-100 text-yellow-800',
  contract_received: 'bg-purple-100 text-purple-800',
  analyzing: 'bg-orange-100 text-orange-800',
  review: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  follow_up: 'bg-gray-100 text-gray-800',
};

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  sign_as_is: 'Sign As-Is',
  sign_with_caution: 'Sign with Caution',
  negotiate_first: 'Negotiate First',
  walk_away: 'Walk Away',
};

const RECOMMENDATION_COLORS: Record<Recommendation, string> = {
  sign_as_is: 'bg-green-100 text-green-800',
  sign_with_caution: 'bg-yellow-100 text-yellow-800',
  negotiate_first: 'bg-orange-100 text-orange-800',
  walk_away: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState(true);

  useEffect(() => {
    loadDemoData();
    const data = getContracts();
    setContracts(data);
    setStats(calculateStats(data));
  }, []);

  const refreshData = () => {
    const data = getContracts();
    setContracts(data);
    setStats(calculateStats(data));
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gc_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: ContractStatus) => {
    updateContract(id, { status: newStatus });
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SubShield</h1>
                <p className="text-xs text-gray-500">Contract Analysis Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewContractModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Contract
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && showStatsPanel && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
              <button
                onClick={() => setShowStatsPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<FileText className="w-5 h-5" />}
                label="Total Contracts"
                value={stats.total_contracts.toString()}
                color="blue"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Total Revenue"
                value={`$${stats.total_revenue.toLocaleString()}`}
                color="green"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Avg Risk Score"
                value={stats.avg_risk_score.toFixed(1)}
                color="orange"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="In Progress"
                value={(
                  stats.contracts_by_status.analyzing +
                  stats.contracts_by_status.review +
                  stats.contracts_by_status.contract_received
                ).toString()}
                color="purple"
              />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Top States */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Top States
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.contracts_by_state)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([state, count]) => (
                      <div key={state} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{state}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Trades */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Top Trades
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.contracts_by_trade)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([trade, count]) => (
                      <div key={trade} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 capitalize">{trade}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Clause Frequency */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Risky Clause Frequency
                </h3>
                <div className="space-y-2">
                  {stats.clause_frequency.pay_if_paid !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Pay-if-Paid</span>
                      <span className="text-sm font-medium text-red-600">
                        {stats.clause_frequency.pay_if_paid}
                      </span>
                    </div>
                  )}
                  {stats.clause_frequency.broad_indemnification !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Broad Indemnification</span>
                      <span className="text-sm font-medium text-red-600">
                        {stats.clause_frequency.broad_indemnification}
                      </span>
                    </div>
                  )}
                  {stats.clause_frequency.unconditional_lien_waiver !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Unconditional Waivers</span>
                      <span className="text-sm font-medium text-red-600">
                        {stats.clause_frequency.unconditional_lien_waiver}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showStatsPanel && (
          <button
            onClick={() => setShowStatsPanel(true)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ChevronDown className="w-4 h-4" />
            Show stats
          </button>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, company, or GC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ContractStatus | 'all')
              }
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC / Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.customer_company}
                          </div>
                          <div className="text-xs text-gray-400">
                            {contract.customer_trade} · {contract.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.gc_name}
                      </div>
                      {contract.project_name && (
                        <div className="text-sm text-gray-500">
                          {contract.project_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={contract.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(
                            contract.id,
                            e.target.value as ContractStatus
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${
                          STATUS_COLORS[contract.status]
                        }`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.risk_score !== null ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-bold ${
                              contract.risk_score >= 7
                                ? 'text-red-600'
                                : contract.risk_score >= 4
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {contract.risk_score}/10
                          </div>
                          {contract.recommendation && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                RECOMMENDATION_COLORS[contract.recommendation]
                              }`}
                            >
                              {RECOMMENDATION_LABELS[contract.recommendation]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.contract_value
                        ? `$${contract.contract_value.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`mailto:${contract.customer_email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        {contract.customer_phone && (
                          <a
                            href={`tel:${contract.customer_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredContracts.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No contracts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Contract Modal */}
      {showNewContractModal && (
        <NewContractModal
          onClose={() => setShowNewContractModal(false)}
          onSave={() => {
            refreshData();
            setShowNewContractModal(false);
          }}
        />
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onUpdate={() => {
            refreshData();
            setSelectedContract(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function NewContractModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_company: '',
    customer_trade: '',
    customer_phone: '',
    gc_name: '',
    gc_contact: '',
    project_name: '',
    project_location: '',
    state: '',
    contract_value: '',
    stripe_payment_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContract({
      ...formData,
      customer_phone: formData.customer_phone || null,
      gc_contact: formData.gc_contact || null,
      project_name: formData.project_name || null,
      project_location: formData.project_location || null,
      contract_value: formData.contract_value
        ? parseFloat(formData.contract_value)
        : null,
      stripe_payment_id: formData.stripe_payment_id || null,
      status: 'payment_received',
      risk_score: null,
      recommendation: null,
      top_issues: null,
      clauses: null,
      internal_notes: null,
      amount_paid: 147,
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">New Contract</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Customer Name *"
                required
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData({ ...formData, customer_email: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Company Name *"
                required
                value={formData.customer_company}
                onChange={(e) =>
                  setFormData({ ...formData, customer_company: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Trade (e.g. Electrical) *"
                required
                value={formData.customer_trade}
                onChange={(e) =>
                  setFormData({ ...formData, customer_trade: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData({ ...formData, customer_phone: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="State (e.g. FL) *"
                required
                maxLength={2}
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value.toUpperCase() })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contract Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Contract Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="GC Name *"
                required
                value={formData.gc_name}
                onChange={(e) =>
                  setFormData({ ...formData, gc_name: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="GC Contact"
                value={formData.gc_contact}
                onChange={(e) =>
                  setFormData({ ...formData, gc_contact: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Project Name"
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Project Location"
                value={formData.project_location}
                onChange={(e) =>
                  setFormData({ ...formData, project_location: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Contract Value ($)"
                value={formData.contract_value}
                onChange={(e) =>
                  setFormData({ ...formData, contract_value: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Stripe Payment ID"
                value={formData.stripe_payment_id}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_payment_id: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContractDetailModal({
  contract,
  onClose,
  onUpdate,
}: {
  contract: Contract;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(contract);

  const handleSave = () => {
    updateContract(contract.id, formData);
    onUpdate();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contract?')) {
      deleteContract(contract.id);
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {contract.customer_name}
            </h2>
            <p className="text-sm text-gray-500">{contract.customer_company}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Contract Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Customer Info
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">Email:</span>{' '}
                  <a
                    href={`mailto:${contract.customer_email}`}
                    className="text-blue-600"
                  >
                    {contract.customer_email}
                  </a>
                </p>
                {contract.customer_phone && (
                  <p className="text-sm">
                    <span className="text-gray-500">Phone:</span>{' '}
                    {contract.customer_phone}
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-gray-500">Trade:</span>{' '}
                  {contract.customer_trade}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">State:</span> {contract.state}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Contract Info
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">GC:</span> {contract.gc_name}
                </p>
                {contract.gc_contact && (
                  <p className="text-sm">
                    <span className="text-gray-500">GC Contact:</span>{' '}
                    {contract.gc_contact}
                  </p>
                )}
                {contract.project_name && (
                  <p className="text-sm">
                    <span className="text-gray-500">Project:</span>{' '}
                    {contract.project_name}
                  </p>
                )}
                {contract.contract_value && (
                  <p className="text-sm">
                    <span className="text-gray-500">Value:</span> $
                    {contract.contract_value.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {(contract.risk_score !== null || isEditing) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Analysis Results
              </h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Risk Score (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.risk_score || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          risk_score: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Recommendation
                    </label>
                    <select
                      value={formData.recommendation || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recommendation: e.target.value as Recommendation || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      {Object.entries(RECOMMENDATION_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className={`text-3xl font-bold ${
                      (contract.risk_score || 0) >= 7
                        ? 'text-red-600'
                        : (contract.risk_score || 0) >= 4
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {contract.risk_score}/10
                  </div>
                  {contract.recommendation && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        RECOMMENDATION_COLORS[contract.recommendation]
                      }`}
                    >
                      {RECOMMENDATION_LABELS[contract.recommendation]}
                    </span>
                  )}
                </div>
              )}

              {contract.top_issues && contract.top_issues.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">
                    Top Issues
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {contract.top_issues.map((issue, i) => (
                      <li key={i} className="text-sm text-gray-700">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Clause Tracking */}
          {(contract.clauses || isEditing) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Clause Tracking
              </h3>
              <ClauseTrackingForm
                clauses={formData.clauses}
                isEditing={isEditing}
                onChange={(clauses) => setFormData({ ...formData, clauses })}
              />
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Internal Notes
            </h3>
            {isEditing ? (
              <textarea
                value={formData.internal_notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, internal_notes: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add notes about this contract..."
              />
            ) : (
              <p className="text-sm text-gray-700">
                {contract.internal_notes || 'No notes yet.'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700"
            >
              Delete
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClauseTrackingForm({
  clauses,
  isEditing,
  onChange,
}: {
  clauses: ClauseData | null;
  isEditing: boolean;
  onChange: (clauses: ClauseData) => void;
}) {
  const defaultClauses: ClauseData = {
    pay_if_paid: false,
    pay_when_paid: false,
    unconditional_lien_waiver: false,
    conditional_lien_waiver: false,
    blanket_lien_waiver: false,
    broad_indemnification: false,
    comparative_indemnification: false,
    retainage_percent: null,
    retainage_release_tied_to_owner: false,
    change_order_notice_hours: null,
    liquidated_damages_daily: null,
    warranty_years: null,
    arbitration_required: false,
    venue_location: null,
  };

  const data = clauses || defaultClauses;

  const handleToggle = (key: keyof ClauseData) => {
    onChange({ ...data, [key]: !data[key] });
  };

  const handleNumber = (key: keyof ClauseData, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : null });
  };

  const handleText = (key: keyof ClauseData, value: string) => {
    onChange({ ...data, [key]: value || null });
  };

  const booleanClauses = [
    { key: 'pay_if_paid', label: 'Pay-if-Paid', danger: true },
    { key: 'pay_when_paid', label: 'Pay-when-Paid', danger: false },
    { key: 'unconditional_lien_waiver', label: 'Unconditional Lien Waiver', danger: true },
    { key: 'conditional_lien_waiver', label: 'Conditional Lien Waiver', danger: false },
    { key: 'blanket_lien_waiver', label: 'Blanket Lien Waiver', danger: true },
    { key: 'broad_indemnification', label: 'Broad Indemnification', danger: true },
    { key: 'comparative_indemnification', label: 'Comparative Indemnification', danger: false },
    { key: 'retainage_release_tied_to_owner', label: 'Retainage Tied to Owner Payment', danger: true },
    { key: 'arbitration_required', label: 'Arbitration Required', danger: false },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Boolean Toggles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {booleanClauses.map(({ key, label, danger }) => (
          <label
            key={key}
            className={`flex items-center gap-2 p-2 rounded-lg border ${
              data[key]
                ? danger
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            } ${isEditing ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          >
            <input
              type="checkbox"
              checked={!!data[key]}
              disabled={!isEditing}
              onChange={() => handleToggle(key)}
              className="rounded text-blue-600"
            />
            <span
              className={`text-xs ${
                data[key]
                  ? danger
                    ? 'text-red-700'
                    : 'text-green-700'
                  : 'text-gray-600'
              }`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Number Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Retainage %</label>
          {isEditing ? (
            <input
              type="number"
              value={data.retainage_percent || ''}
              onChange={(e) => handleNumber('retainage_percent', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          ) : (
            <span className="text-sm">{data.retainage_percent ?? '—'}%</span>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Change Order Notice (hrs)
          </label>
          {isEditing ? (
            <input
              type="number"
              value={data.change_order_notice_hours || ''}
              onChange={(e) =>
                handleNumber('change_order_notice_hours', e.target.value)
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          ) : (
            <span className="text-sm">{data.change_order_notice_hours ?? '—'}</span>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            LD Daily ($)
          </label>
          {isEditing ? (
            <input
              type="number"
              value={data.liquidated_damages_daily || ''}
              onChange={(e) =>
                handleNumber('liquidated_damages_daily', e.target.value)
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          ) : (
            <span className="text-sm">
              {data.liquidated_damages_daily
                ? `$${data.liquidated_damages_daily}`
                : '—'}
            </span>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Warranty (yrs)
          </label>
          {isEditing ? (
            <input
              type="number"
              value={data.warranty_years || ''}
              onChange={(e) => handleNumber('warranty_years', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          ) : (
            <span className="text-sm">{data.warranty_years ?? '—'}</span>
          )}
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Venue Location</label>
        {isEditing ? (
          <input
            type="text"
            value={data.venue_location || ''}
            onChange={(e) => handleText('venue_location', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="e.g. Orange County, FL"
          />
        ) : (
          <span className="text-sm">{data.venue_location || '—'}</span>
        )}
      </div>
    </div>
  );
}
