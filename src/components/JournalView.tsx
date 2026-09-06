import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Trash2, 
  Eye, 
  PlusCircle, 
  Flame,
  Calendar,
  DollarSign,
  ShieldAlert,
  FileImage,
  FileCheck
} from 'lucide-react';
import type { DecisionEntry, DecisionStatus, ProductCategory, PaymentCheckEntry } from '../types';
import { ConsumerPressureGauge } from './ConsumerPressureGauge';

interface JournalViewProps {
  decisions: DecisionEntry[];
  paymentChecks?: PaymentCheckEntry[];
  onSelectDecision: (decision: DecisionEntry) => void;
  onRecordOutcome: (decision: DecisionEntry) => void;
  onDeleteDecision: (id: string) => void;
  onSelectPaymentCheck?: (check: PaymentCheckEntry) => void;
  onDeletePaymentCheck?: (id: string) => void;
  onNavigateToNew: () => void;
  onNavigateToPaymentCheck?: () => void;
  onSeedSampleData: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  decisions,
  paymentChecks = [],
  onSelectDecision,
  onRecordOutcome,
  onDeleteDecision,
  onSelectPaymentCheck,
  onDeletePaymentCheck,
  onNavigateToNew,
  onNavigateToPaymentCheck,
  onSeedSampleData,
}) => {
  const [journalSection, setJournalSection] = useState<'decisions' | 'payment_checks'>('decisions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DecisionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pressureFilter, setPressureFilter] = useState<string>('all');
  const [paymentRiskFilter, setPaymentRiskFilter] = useState<string>('all');

  // Filtered payment checks
  const filteredPaymentChecks = useMemo(() => {
    return paymentChecks.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.counterpartyName.toLowerCase().includes(q) ||
        p.claimedAmount.toLowerCase().includes(q) ||
        p.analysis?.riskSummary.toLowerCase().includes(q);

      const matchRisk =
        paymentRiskFilter === 'all' ||
        p.analysis?.riskLevel === paymentRiskFilter ||
        (paymentRiskFilter === 'verified' && p.verificationStatus === 'verified_in_bank') ||
        (paymentRiskFilter === 'unverified' && p.verificationStatus === 'unverified_pending');

      return matchSearch && matchRisk;
    });
  }, [paymentChecks, searchQuery, paymentRiskFilter]);

  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      // Search match
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        d.productName.toLowerCase().includes(q) ||
        d.sellerBrand.toLowerCase().includes(q) ||
        d.rawOfferText?.toLowerCase().includes(q);

      // Status match
      const matchStatus = statusFilter === 'all' || d.decisionStatus === statusFilter;

      // Category match
      const matchCat = categoryFilter === 'all' || d.category === categoryFilter;

      // Pressure level match
      const matchPressure = 
        pressureFilter === 'all' || 
        d.consumerPressureIndex?.level?.toLowerCase() === pressureFilter.toLowerCase();

      return matchSearch && matchStatus && matchCat && matchPressure;
    });
  }, [decisions, searchQuery, statusFilter, categoryFilter, pressureFilter]);

  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case 'outcome_recorded':
        return { label: 'Outcome Audited', bg: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
      case 'purchased_pending_outcome':
        return { label: 'Pending Outcome', bg: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'decided_not_to_buy':
        return { label: 'Decided Not to Buy', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'analyzed':
      default:
        return { label: 'Under Review', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Encrypted Personal Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Consumer Decision Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Your private record of analyzed offers, marketing claims, and verified real-world outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToPaymentCheck && (
            <button
              onClick={onNavigateToPaymentCheck}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Check Screenshot</span>
            </button>
          )}

          <button
            onClick={onNavigateToNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Decision</span>
          </button>
        </div>
      </div>

      {/* SECTION SELECTOR TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setJournalSection('decisions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            journalSection === 'decisions'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Product Decisions ({decisions.length})</span>
        </button>

        <button
          onClick={() => setJournalSection('payment_checks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            journalSection === 'payment_checks'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Payment Screenshot Checks ({paymentChecks.length})</span>
        </button>
      </div>

      {journalSection === 'payment_checks' ? (
        /* PAYMENT CHECKS SECTION */
        <div className="space-y-6">
          {/* MANDATORY WARNING BANNER */}
          <div className="bg-amber-950/40 border border-amber-600/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-amber-100">Mandatory Rule:</strong> “A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.”
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search payment checks by sender, amount, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <button
                onClick={() => setPaymentRiskFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  paymentRiskFilter === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Checks ({paymentChecks.length})
              </button>
              <button
                onClick={() => setPaymentRiskFilter('HIGH RISK')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  paymentRiskFilter === 'HIGH RISK'
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-800 text-rose-300 hover:text-white'
                }`}
              >
                High Risk ({paymentChecks.filter(p => p.analysis?.riskLevel === 'HIGH RISK').length})
              </button>
              <button
                onClick={() => setPaymentRiskFilter('MEDIUM RISK')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  paymentRiskFilter === 'MEDIUM RISK'
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-amber-300 hover:text-white'
                }`}
              >
                Medium Risk ({paymentChecks.filter(p => p.analysis?.riskLevel === 'MEDIUM RISK').length})
              </button>
              <button
                onClick={() => setPaymentRiskFilter('verified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  paymentRiskFilter === 'verified'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-800 text-emerald-300 hover:text-white'
                }`}
              >
                Verified in Bank ({paymentChecks.filter(p => p.verificationStatus === 'verified_in_bank').length})
              </button>
              <button
                onClick={() => setPaymentRiskFilter('unverified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  paymentRiskFilter === 'unverified'
                    ? 'bg-orange-700 text-white'
                    : 'bg-slate-800 text-orange-300 hover:text-white'
                }`}
              >
                Pending Verification ({paymentChecks.filter(p => p.verificationStatus === 'unverified_pending').length})
              </button>
            </div>
          </div>

          {/* PAYMENT CHECK CARDS GRID */}
          {filteredPaymentChecks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No payment checks found</h3>
                <p className="text-xs text-slate-400">
                  {searchQuery ? 'Try adjusting your search terms or filter.' : 'You haven\'t logged any payment checks yet.'}
                </p>
              </div>
              {onNavigateToPaymentCheck && (
                <button
                  onClick={onNavigateToPaymentCheck}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  Check New Payment Screenshot
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPaymentChecks.map((check) => {
                const risk = check.analysis?.riskLevel || 'LOW RISK';
                return (
                  <div
                    key={check.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          risk === 'HIGH RISK'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : risk === 'MEDIUM RISK'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {risk}
                        </span>

                        <span className={`text-[11px] font-semibold ${
                          check.verificationStatus === 'verified_in_bank'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}>
                          {check.verificationStatus === 'verified_in_bank' ? '✓ Verified in Bank' : '⚠️ Pending'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-2">
                          {check.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Counterparty: <strong className="text-slate-200">{check.counterpartyName}</strong>
                        </p>
                        <p className="text-xs text-cyan-300 font-bold mt-0.5">
                          Amount: {check.claimedAmount}
                        </p>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        {check.analysis?.riskSummary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(check.createdAt).toLocaleDateString()}</span>
                        <span>{check.analysis?.warningSignals?.length || 0} warning signals</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectPaymentCheck && onSelectPaymentCheck(check)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Check</span>
                      </button>

                      {onDeletePaymentCheck && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete payment check for ${check.counterpartyName}?`)) {
                              onDeletePaymentCheck(check.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Check"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DECISIONS SECTION (ORIGINAL DECISIONS GRID) */
        <>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Top: Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search decisions by product, seller, or claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              All ({decisions.length})
            </button>
            <button
              onClick={() => setStatusFilter('purchased_pending_outcome')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'purchased_pending_outcome'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Pending Outcome ({decisions.filter(d => d.decisionStatus === 'purchased_pending_outcome').length})
            </button>
            <button
              onClick={() => setStatusFilter('outcome_recorded')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'outcome_recorded'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Audited Outcomes ({decisions.filter(d => d.decisionStatus === 'outcome_recorded').length})
            </button>
            <button
              onClick={() => setStatusFilter('decided_not_to_buy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'decided_not_to_buy'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Saved Money ({decisions.filter(d => d.decisionStatus === 'decided_not_to_buy').length})
            </button>
          </div>

          {/* Category & Pressure Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={pressureFilter}
              onChange={(e) => setPressureFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Pressure Levels</option>
              <option value="severe">Severe</option>
              <option value="elevated">Elevated</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics & Gadgets">Electronics & Gadgets</option>
              <option value="Health, Wellness & Beauty">Health, Wellness & Beauty</option>
              <option value="Clothing & Apparel">Clothing & Apparel</option>
              <option value="Home, Kitchen & Living">Home, Kitchen & Living</option>
              <option value="Software, Apps & Subscriptions">Software & Apps</option>
              <option value="Fitness & Sports">Fitness & Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decision List Grid */}
      {filteredDecisions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No decisions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? "Try clearing your filters or search terms."
                : "You haven't saved any consumer decisions yet."}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToNew}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Analyze an Offer
            </button>
            <button
              onClick={onSeedSampleData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Load Example Decisions
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecisions.map((decision) => {
            const statusInfo = getStatusBadge(decision.decisionStatus);
            const gap = decision.actualOutcome?.gapAnalysis;

            return (
              <div 
                key={decision.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all space-y-4 relative group"
              >
                {/* Card Top: Badges & Date */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {decision.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(decision.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Title & Brand */}
                  <div className="flex items-start gap-3">
                    {decision.imageUrl && (
                      <div 
                        onClick={() => onSelectDecision(decision)}
                        className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700/80 shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity p-0.5"
                      >
                        <img 
                          src={decision.imageUrl} 
                          alt={decision.productName} 
                          className="w-full h-full object-cover rounded" 
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => onSelectDecision(decision)}
                        className="text-base font-bold text-white hover:text-cyan-300 cursor-pointer transition-colors line-clamp-1"
                      >
                        {decision.productName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {decision.sellerBrand} {decision.advertisedPrice ? `• ${decision.advertisedPrice}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Pressure Index Mini Indicator */}
                  {decision.consumerPressureIndex && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Marketing Pressure:</span>
                      <ConsumerPressureGauge pressure={decision.consumerPressureIndex} size="sm" />
                    </div>
                  )}

                  {/* PROMISE-TO-OUTCOME GAP HIGHLIGHT (if recorded) */}
                  {gap && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-900/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Outcome Reality Gap</span>
                        </span>
                        <span className="text-xs font-black text-cyan-300">
                          {gap.fulfillmentScore}% Fulfilled
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        Verdict: {gap.overallGap}
                      </p>
                      {gap.misleadingOrUnsupportedClaims && gap.misleadingOrUnsupportedClaims.length > 0 && (
                        <p className="text-[11px] text-rose-400 truncate">
                          ⚠ {gap.misleadingOrUnsupportedClaims[0]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pending reminder if purchased and awaiting reality check */}
                  {decision.decisionStatus === 'purchased_pending_outcome' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-2">
                      <span className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Awaiting delivery & reality check</span>
                      </span>
                      <button
                        onClick={() => onRecordOutcome(decision)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shrink-0"
                      >
                        Record Outcome
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onSelectDecision(decision)}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Audit</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRecordOutcome(decision)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 font-medium transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{decision.actualOutcome ? 'Update Outcome' : 'Record Outcome'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${decision.productName}" from your journal?`)) {
                          onDeleteDecision(decision.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
      </>
      )}

    </div>
  );
};
