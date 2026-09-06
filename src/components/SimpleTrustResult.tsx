import React, { useState } from 'react';
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import type { SimpleProductTrustSummary } from '../utils/simpleTrustSummary';

interface SimpleTrustResultProps {
  summary: SimpleProductTrustSummary;
  productTitle: string;
  detailedChildren?: React.ReactNode;
  defaultExpanded?: boolean;
}

export const SimpleTrustResult: React.FC<SimpleTrustResultProps> = ({
  summary,
  productTitle,
  detailedChildren,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Score styling
  const scoreConfig = {
    green: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
      badge: 'bg-emerald-500 text-slate-950 font-black',
      bar: 'bg-emerald-500',
      glow: 'shadow-emerald-950/40',
      recBg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
      badge: 'bg-amber-500 text-slate-950 font-black',
      bar: 'bg-amber-500',
      glow: 'shadow-amber-950/40',
      recBg: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    red: {
      bg: 'bg-rose-950/40 border-rose-500/40 text-rose-400',
      badge: 'bg-rose-500 text-white font-black',
      bar: 'bg-rose-500',
      glow: 'shadow-rose-950/40',
      recBg: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
  }[summary.color];

  const RecIcon = scoreConfig.icon;

  return (
    <div className="space-y-6">
      {/* 1. TRUST SCORE CARD */}
      <div 
        id="simple-trust-score-card"
        className={`rounded-3xl border-2 p-6 sm:p-8 bg-slate-900/90 shadow-2xl ${scoreConfig.bg} ${scoreConfig.glow}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          
          {/* Trust Score Percentage Header */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
              Consumer Trust Assessment
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {summary.score}%
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight uppercase opacity-90">
                TRUST
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-xl font-medium">
              Evaluated for <strong className="text-white">{productTitle}</strong>
            </p>
          </div>

          {/* 4. WHAT SHOULD I DO? - Prominent Recommendation Badge */}
          <div className="md:text-right space-y-1.5 self-start md:self-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Recommendation
            </span>
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm sm:text-base font-black uppercase tracking-wide shadow-lg ${scoreConfig.recBg}`}>
              <RecIcon className="w-5 h-5 shrink-0" />
              <span>{summary.recommendation}</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs md:ml-auto">
              {summary.recommendationNote}
            </p>
          </div>

        </div>

        {/* 2. WHAT IS WRONG? & 3. WHAT IS GOOD? GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          
          {/* 2. WHAT IS WRONG? */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-rose-900/40 space-y-3.5">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-6 h-6 rounded-lg bg-rose-950 border border-rose-800/80 flex items-center justify-center font-bold text-xs">
                ❌
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">
                What is Wrong?
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              {summary.whatIsWrong.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. WHAT IS GOOD? */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-900/40 space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center font-bold text-xs text-emerald-400">
                ✓
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                What is Good?
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
              {summary.whatIsGood.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* 5. SEE DETAILS BUTTON */}
        {detailedChildren && (
          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Want the full breakdown of claims, tactics, and origin?
            </span>
            <button
              type="button"
              id="toggle-detailed-analysis-btn"
              onClick={() => setIsExpanded(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <span>{isExpanded ? 'Hide detailed analysis' : 'View detailed analysis'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* EXPANDABLE IN-DEPTH ANALYSIS */}
      {isExpanded && detailedChildren && (
        <div 
          id="detailed-analysis-section"
          className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {detailedChildren}
        </div>
      )}
    </div>
  );
};
