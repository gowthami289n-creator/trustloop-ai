import React, { useState } from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ShieldAlert, 
  Lock 
} from 'lucide-react';
import type { SimplePaymentSafetySummary } from '../utils/simpleTrustSummary';

interface SimplePaymentResultProps {
  summary: SimplePaymentSafetySummary;
  counterpartyOrAmount?: string;
  detailedChildren?: React.ReactNode;
  defaultExpanded?: boolean;
}

export const SimplePaymentResult: React.FC<SimplePaymentResultProps> = ({
  summary,
  counterpartyOrAmount,
  detailedChildren,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const styleConfig = {
    green: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
      badge: 'bg-emerald-500 text-slate-950 font-black',
      recBg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
      icon: ShieldCheck,
    },
    amber: {
      bg: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
      badge: 'bg-amber-500 text-slate-950 font-black',
      recBg: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
      icon: AlertTriangle,
    },
    red: {
      bg: 'bg-rose-950/40 border-rose-500/40 text-rose-400',
      badge: 'bg-rose-500 text-white font-black',
      recBg: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
      icon: ShieldAlert,
    },
  }[summary.color];

  const ActionIcon = styleConfig.icon;

  return (
    <div className="space-y-6">
      {/* 1. PAYMENT SAFETY CARD */}
      <div 
        id="simple-payment-safety-card"
        className={`rounded-3xl border-2 p-6 sm:p-8 bg-slate-900/90 shadow-2xl ${styleConfig.bg}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          
          {/* Large percentage display */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
              Payment Screenshot Verification
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {summary.safetyPercentage}%
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight uppercase opacity-90">
                SAFE
              </span>
            </div>
            {counterpartyOrAmount && (
              <p className="text-sm text-slate-300 font-medium">
                Inspected for: <strong className="text-white">{counterpartyOrAmount}</strong>
              </p>
            )}
          </div>

          {/* 5. ONE CLEAR ACTION */}
          <div className="md:text-right space-y-1.5 self-start md:self-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Required Action
            </span>
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm sm:text-base font-black uppercase tracking-wide shadow-lg ${styleConfig.recBg}`}>
              <ActionIcon className="w-5 h-5 shrink-0" />
              <span>{summary.recommendation}</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs md:ml-auto">
              {summary.recommendationNote}
            </p>
          </div>

        </div>

        {/* THREE SIMPLE COLUMNS / BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          
          {/* ✓ WHAT MATCHES */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-900/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-5 h-5 rounded-md bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-xs">
                ✓
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                What Matches
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {summary.whatMatches.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ❌ WHAT DOESN'T MATCH */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-rose-900/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-5 h-5 rounded-md bg-rose-950 border border-rose-800 flex items-center justify-center font-bold text-xs">
                ❌
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-300">
                What Doesn't Match
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {summary.whatDoesntMatch.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ⚠️ WHAT MUST BE VERIFIED */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-900/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-5 h-5 rounded-md bg-amber-950 border border-amber-800 flex items-center justify-center font-bold text-xs">
                ⚠️
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                What Must Be Verified
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {summary.whatMustBeVerified.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* 6. SEE DETAILS BUTTON */}
        {detailedChildren && (
          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Want forensic pixel inspection & extracted transaction metadata?
            </span>
            <button
              type="button"
              id="toggle-payment-details-btn"
              onClick={() => setIsExpanded(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <span>{isExpanded ? 'Hide detailed analysis' : 'View detailed analysis'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

      </div>

      {/* EXPANDABLE DETAILED FORENSIC VIEW */}
      {isExpanded && detailedChildren && (
        <div 
          id="detailed-payment-analysis-section"
          className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {detailedChildren}
        </div>
      )}
    </div>
  );
};
