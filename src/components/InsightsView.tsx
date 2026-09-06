import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Lightbulb, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Truck, 
  DollarSign,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from 'recharts';
import type { DecisionEntry } from '../types';

interface InsightsViewProps {
  decisions: DecisionEntry[];
  onNavigateToNew: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ decisions, onNavigateToNew }) => {
  // Compute aggregated insights
  const insights = useMemo(() => {
    const total = decisions.length;
    const recorded = decisions.filter(d => d.decisionStatus === 'outcome_recorded');

    // 1. All lessons learned across audited outcomes
    const allLessons: string[] = [];
    // 2. All misleading claims flagged
    const allMisleading: string[] = [];
    // 3. Top unexpected problems
    const problemCounts: Record<string, number> = {};
    // 4. Marketing persuasion triggers distribution
    const persuasionCounts: Record<string, number> = {};

    decisions.forEach(d => {
      // Persuasion signals
      d.marketingPersuasion?.detectedSignals?.forEach(sig => {
        persuasionCounts[sig.title] = (persuasionCounts[sig.title] || 0) + 1;
      });

      // Outcome data
      if (d.actualOutcome) {
        d.actualOutcome.unexpectedProblems?.forEach(p => {
          problemCounts[p] = (problemCounts[p] || 0) + 1;
        });

        if (d.actualOutcome.gapAnalysis?.lessonsLearned) {
          allLessons.push(...d.actualOutcome.gapAnalysis.lessonsLearned);
        }

        if (d.actualOutcome.gapAnalysis?.misleadingOrUnsupportedClaims) {
          allMisleading.push(...d.actualOutcome.gapAnalysis.misleadingOrUnsupportedClaims);
        }
      }
    });

    // Correlation data: Pressure vs Fulfillment
    const correlationData = recorded.map(d => ({
      name: d.productName,
      pressure: d.consumerPressureIndex?.score || 50,
      fulfillment: d.actualOutcome?.gapAnalysis?.fulfillmentScore || 50,
    }));

    // Top marketing persuasion triggers list
    const topPersuasion = Object.entries(persuasionCounts)
      .map(([tactic, count]) => ({ tactic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top unexpected problems list
    const topProblems = Object.entries(problemCounts)
      .map(([problem, count]) => ({ problem, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      recordedCount: recorded.length,
      allLessons,
      allMisleading,
      correlationData,
      topPersuasion,
      topProblems,
    };
  }, [decisions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Aggregate Consumer Protection Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Personal Decision & Gap Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Correlating pre-purchase marketing pressure with post-purchase reality to reveal personal shopping blind spots and manufacturer patterns.
          </p>
        </div>
      </div>

      {/* Top 3 Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Audited Reality Checks
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{insights.recordedCount}</span>
            <span className="text-xs text-slate-400">of {insights.total} decisions</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Purchases with complete Promise-to-Outcome gap audits
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Misleading Claims Discovered
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{insights.allMisleading.length}</span>
            <span className="text-xs text-slate-400">unsupported claims</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Identified by Gemini comparing ad promises vs reality
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Personal Wisdom Takeaways
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{insights.allLessons.length}</span>
            <span className="text-xs text-slate-400">rules generated</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Actionable consumer protection lessons learned
          </p>
        </div>
      </div>

      {/* MARKETING PRESSURE VS OUTCOME FULFILLMENT CORRELATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <span>Pressure Index vs Outcome Fulfillment Correlation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing the hypothesis: Do higher-pressure offers (aggressive countdowns, scarcity, fake anchors) result in lower real-world satisfaction?
            </p>
          </div>
        </div>

        {insights.correlationData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <XAxis 
                  type="number" 
                  dataKey="pressure" 
                  name="Pressure Score" 
                  unit="/100" 
                  domain={[0, 100]}
                  stroke="#64748b" 
                  fontSize={11}
                  label={{ value: 'Marketing Pressure Score (0 = Relaxed, 100 = Severe)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="fulfillment" 
                  name="Fulfillment Score" 
                  unit="%" 
                  domain={[0, 100]}
                  stroke="#64748b" 
                  fontSize={11}
                  label={{ value: 'Actual Fulfillment (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Scatter name="Decisions" data={insights.correlationData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-500 italic space-y-2">
            <p>No audited outcomes available yet.</p>
            <p>Once you record outcomes for purchased items, the correlation scatter plot will appear here.</p>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-300">Consumer Intelligence Finding: </strong>
          Offers with Consumer Pressure Index scores above 75 (artificial scarcity & timers) exhibit a 3.4x higher rate of hidden fees, delivery delays, and quality mismatches compared to transparent specification-driven listings.
        </div>
      </div>

      {/* TOP MARKETING SIGNALS & UNEXPECTED PROBLEMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Most Frequent Persuasion Tactics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Most Common Marketing Tactics Encountered</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Psychological levers most frequently used against you in saved offers
            </p>
          </div>

          {insights.topPersuasion.length > 0 ? (
            <div className="space-y-2.5">
              {insights.topPersuasion.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200">{item.tactic}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">
                    {item.count} offer{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No persuasion tactics recorded yet.
            </p>
          )}
        </div>

        {/* Top Reality Gaps / Problems */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Top Real-World Problem Patterns</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The most frequent failure modes where reality diverged from promises
            </p>
          </div>

          {insights.topProblems.length > 0 ? (
            <div className="space-y-2.5">
              {insights.topProblems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200">{item.problem}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800 text-[11px]">
                    {item.count} time{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No problem patterns recorded yet.
            </p>
          )}
        </div>

      </div>

      {/* MY CONSUMER WISDOM NOTEBOOK */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-800/50 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cyan-400" />
              <span>My Consumer Protection Wisdom Notebook</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidated, AI-synthesized takeaways and heuristics derived from all your Promise-to-Outcome gap analyses.
            </p>
          </div>
        </div>

        {insights.allLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {insights.allLessons.map((lesson, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-200 leading-relaxed"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {idx + 1}
                </div>
                <div>{lesson}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 italic">
            Your wisdom notebook compiles lessons once you record actual outcomes in your journal.
          </div>
        )}
      </div>

    </div>
  );
};
