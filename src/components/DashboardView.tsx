import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Flame, 
  Award, 
  PlusCircle, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Lightbulb,
  ShieldAlert,
  FileImage,
  FileCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import type { DecisionEntry, PaymentCheckEntry } from '../types';
import { ConsumerPressureGauge } from './ConsumerPressureGauge';

interface DashboardViewProps {
  decisions: DecisionEntry[];
  paymentChecks: PaymentCheckEntry[];
  onNavigateToNew: () => void;
  onNavigateToJournal: () => void;
  onNavigateToPaymentCheck: () => void;
  onSelectDecision: (decision: DecisionEntry) => void;
  onRecordOutcome: (decision: DecisionEntry) => void;
  onSelectPaymentCheck: (check: PaymentCheckEntry) => void;
  onSeedSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  decisions,
  paymentChecks = [],
  onNavigateToNew,
  onNavigateToJournal,
  onNavigateToPaymentCheck,
  onSelectDecision,
  onRecordOutcome,
  onSelectPaymentCheck,
  onSeedSampleData,
}) => {
  // Aggregate statistics
  const stats = useMemo(() => {
    const total = decisions.length;
    const pending = decisions.filter(d => d.decisionStatus === 'purchased_pending_outcome');
    const recorded = decisions.filter(d => d.decisionStatus === 'outcome_recorded');
    const decidedAgainst = decisions.filter(d => d.decisionStatus === 'decided_not_to_buy');

    // Average Consumer Pressure Index
    let avgPressure = 0;
    if (total > 0) {
      const sumPressure = decisions.reduce((acc, d) => acc + (d.consumerPressureIndex?.score || 0), 0);
      avgPressure = Math.round(sumPressure / total);
    }

    // Average Fulfillment Score from Gap Analysis
    let avgFulfillment = 0;
    if (recorded.length > 0) {
      const sumFulfillment = recorded.reduce(
        (acc, d) => acc + (d.actualOutcome?.gapAnalysis?.fulfillmentScore || 0), 
        0
      );
      avgFulfillment = Math.round(sumFulfillment / recorded.length);
    }

    return {
      total,
      pending,
      recorded,
      decidedAgainst,
      avgPressure,
      avgFulfillment,
    };
  }, [decisions]);

  // Payment Check statistics
  const paymentStats = useMemo(() => {
    const total = paymentChecks.length;
    const highRisk = paymentChecks.filter(p => p.analysis?.riskLevel === 'HIGH RISK').length;
    const mediumRisk = paymentChecks.filter(p => p.analysis?.riskLevel === 'MEDIUM RISK').length;
    const lowRisk = paymentChecks.filter(p => p.analysis?.riskLevel === 'LOW RISK').length;
    const verified = paymentChecks.filter(p => p.verificationStatus === 'verified_in_bank').length;
    const unverified = paymentChecks.filter(p => p.verificationStatus === 'unverified_pending').length;

    return {
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      verified,
      unverified,
    };
  }, [paymentChecks]);

  // Chart data: Distribution of Pressure levels
  const chartData = useMemo(() => {
    const levels = { Low: 0, Moderate: 0, Elevated: 0, Severe: 0 };
    decisions.forEach(d => {
      const lvl = d.consumerPressureIndex?.level || 'Moderate';
      if (levels[lvl as keyof typeof levels] !== undefined) {
        levels[lvl as keyof typeof levels]++;
      }
    });

    return [
      { name: 'Low', count: levels.Low, color: '#10b981' },
      { name: 'Moderate', count: levels.Moderate, color: '#f59e0b' },
      { name: 'Elevated', count: levels.Elevated, color: '#f97316' },
      { name: 'Severe', count: levels.Severe, color: '#f43f5e' },
    ];
  }, [decisions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Welcome / Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800">
                Decision Intelligence
              </span>
              <span className="text-xs text-slate-400">Gemini-Powered Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personal Consumer Decision Journal
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Analyze product claims, spot high-pressure persuasion signals, inspect supply-chain transparency, and audit the real <strong className="text-cyan-300">Promise-to-Outcome Gap</strong> when goods arrive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dashboard-check-payment-btn"
              onClick={onNavigateToPaymentCheck}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-cyan-600 hover:from-amber-400 hover:to-cyan-500 text-white shadow-lg shadow-amber-600/25 active:scale-[0.99] transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-amber-200" />
              <span>Check Payment Screenshot</span>
            </button>

            <button
              id="dashboard-new-decision-btn"
              onClick={onNavigateToNew}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-600/25 active:scale-[0.99] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Analyze New Offer</span>
            </button>

            {decisions.length === 0 && (
              <button
                onClick={onSeedSampleData}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Load Sample Decisions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Decisions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Decisions</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">analyzed</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats.decidedAgainst.length} rejected (saved money)
          </p>
        </div>

        {/* Pending Outcomes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reality Checks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-300">{stats.pending.length}</span>
            <span className="text-xs text-slate-400">awaiting outcome</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Purchases to audit once received
          </p>
        </div>

        {/* Average Consumer Pressure Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Pressure Score</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.avgPressure}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Psychological pressure detected across offers
          </p>
        </div>

        {/* Promise-to-Outcome Fulfillment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Promise Fulfillment</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {stats.recorded.length > 0 ? `${stats.avgFulfillment}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">
              {stats.recorded.length > 0 ? 'avg delivery' : '0 audited'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats.recorded.length} verified real-world outcomes
          </p>
        </div>

      </div>

      {/* PENDING OUTCOMES REMINDER SECTION */}
      {stats.pending.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Pending Outcome Audits ({stats.pending.length})
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  You marked these items as purchased. Once they arrive, record what actually happened to run the Gemini Promise-to-Outcome Gap analysis.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToJournal}
              className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 shrink-0"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.pending.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {item.sellerBrand} {item.advertisedPrice ? `• ${item.advertisedPrice}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => onRecordOutcome(item)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Record Actual Reality</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYMENT CHECKS AUDIT SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                Fraud Prevention Guard
              </span>
              <span className="text-xs text-slate-400">Payment Screenshot Risk Analyzer</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Payment Checks Overview</span>
            </h3>
            <p className="text-xs text-slate-300">
              Audit suspicious payment confirmations before dispatching merchandise or acknowledging payment settlement.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToPaymentCheck}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-md shadow-amber-900/30"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Check Screenshot</span>
            </button>
          </div>
        </div>

        {/* 5 REQUIRED METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Checks
            </span>
            <span className="text-2xl font-black text-white">
              {paymentStats.total}
            </span>
            <span className="text-[10px] text-slate-500 block">Logged audits</span>
          </div>

          {/* High-Risk */}
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
              High-Risk Checks
            </span>
            <span className="text-2xl font-black text-rose-400">
              {paymentStats.highRisk}
            </span>
            <span className="text-[10px] text-rose-400/80 block">Do not release goods</span>
          </div>

          {/* Medium-Risk */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Medium-Risk Checks
            </span>
            <span className="text-2xl font-black text-amber-400">
              {paymentStats.mediumRisk}
            </span>
            <span className="text-[10px] text-amber-400/80 block">Audit discrepancies</span>
          </div>

          {/* Verified Payments */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Verified in Bank
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {paymentStats.verified}
            </span>
            <span className="text-[10px] text-emerald-400/80 block">Confirmed in statement</span>
          </div>

          {/* Unverified Payments */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
              Unverified Pending
            </span>
            <span className="text-2xl font-black text-orange-400">
              {paymentStats.unverified}
            </span>
            <span className="text-[10px] text-orange-400/80 block">Awaiting bank check</span>
          </div>
        </div>

        {/* MANDATORY WARNING CALLOUT */}
        <div className="bg-amber-950/30 border border-amber-600/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-100">Mandatory Safeguard:</strong> “A payment screenshot cannot confirm that money was actually received. Verify the transaction in your own bank or UPI transaction history before releasing goods, services, refunds, or personal information.”
          </p>
        </div>

        {/* RECENT PAYMENT CHECKS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Recent Screenshot Inspections
            </span>
            {paymentChecks.length > 0 && (
              <span>Showing {Math.min(paymentChecks.length, 3)} of {paymentChecks.length} checks</span>
            )}
          </div>

          {paymentChecks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No payment screenshots analyzed yet. Upload buyer transfer slips or UPI receipts to inspect font consistency and reference numbers.
              </p>
              <button
                onClick={onNavigateToPaymentCheck}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
              >
                Upload First Screenshot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paymentChecks.slice(0, 3).map((item) => {
                const risk = item.analysis?.riskLevel || 'LOW RISK';
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectPaymentCheck(item)}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          risk === 'HIGH RISK'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : risk === 'MEDIUM RISK'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {risk}
                        </span>
                        <span className={`text-[10px] font-semibold ${
                          item.verificationStatus === 'verified_in_bank'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}>
                          {item.verificationStatus === 'verified_in_bank' ? '✓ Verified in Bank' : '⚠️ Pending Verification'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {item.counterpartyName} • <strong className="text-slate-200">{item.claimedAmount}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="text-cyan-400 group-hover:underline font-medium flex items-center gap-1">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CHARTS & RECENT DECISIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Marketing Pressure Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Persuasion Pressure Breakdown</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of consumer pressure scores across your reviewed offers.
            </p>
          </div>

          {decisions.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500 italic">
              No decision data yet. Add an offer to see analytics.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Low (0-24)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Moderate (25-49)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Elevated (50-74)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Severe (75-100)</span>
            </div>
          </div>
        </div>

        {/* Recent Decisions & Audits List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Recent Journal Entries</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latest consumer offers analyzed and audited
                </p>
              </div>

              <button
                onClick={onNavigateToJournal}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>View My Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {decisions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                <p>Your journal is currently empty.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={onNavigateToNew}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                  >
                    Analyze an Offer
                  </button>
                  <button
                    onClick={onSeedSampleData}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
                  >
                    Load Examples
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {decisions.slice(0, 4).map((d) => {
                  const hasGap = !!d.actualOutcome?.gapAnalysis;
                  return (
                    <div 
                      key={d.id}
                      onClick={() => onSelectDecision(d)}
                      className="py-3 px-2 -mx-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                            {d.productName}
                          </h4>
                          {hasGap && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                              {d.actualOutcome?.gapAnalysis?.fulfillmentScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {d.sellerBrand} • {d.category}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        {d.consumerPressureIndex && (
                          <div className="hidden sm:block text-right">
                            <span className="text-[10px] text-slate-500 block">Pressure</span>
                            <span className="text-xs font-bold text-slate-300">
                              {d.consumerPressureIndex.score}/100
                            </span>
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Data stored securely in your private Firestore collection.</span>
            <button
              onClick={onNavigateToJournal}
              className="text-cyan-400 hover:underline font-medium"
            >
              Browse all {decisions.length} entries →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
