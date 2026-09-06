import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Flame } from 'lucide-react';
import type { ConsumerPressureIndex } from '../types';

interface GaugeProps {
  pressure: ConsumerPressureIndex;
  size?: 'sm' | 'md' | 'lg';
}

export const ConsumerPressureGauge: React.FC<GaugeProps> = ({ pressure, size = 'md' }) => {
  const { score, level, rationale, keyDrivers } = pressure;

  const getColorConfig = (val: number) => {
    if (val >= 75) {
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        bar: 'bg-rose-500',
        badge: 'bg-rose-950 text-rose-300 border-rose-800',
        icon: Flame,
        desc: 'Severe Manipulation Risk'
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        bar: 'bg-amber-500',
        badge: 'bg-amber-950 text-amber-300 border-amber-800',
        icon: AlertTriangle,
        desc: 'Elevated Persuasion Pressure'
      };
    }
    if (val >= 25) {
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        bar: 'bg-yellow-500',
        badge: 'bg-yellow-950 text-yellow-300 border-yellow-800',
        icon: AlertCircle,
        desc: 'Moderate Commercial Framing'
      };
    }
    return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      icon: CheckCircle,
      desc: 'Low Pressure / Fact-Focused'
    };
  };

  const config = getColorConfig(score);
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${config.bar} transition-all duration-500`}
            style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${config.text}`}>{score}/100</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${config.badge}`}>
          {level}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.text}`} />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Consumer Pressure Index
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Informational decision-support score measuring psychological urgency & persuasion framing
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-3xl font-extrabold ${config.text}`}>{score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
            {level} Pressure
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700">
        <div 
          className={`h-full rounded-full ${config.bar} transition-all duration-700`}
          style={{ width: `${Math.min(Math.max(score, 4), 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
        <span>0 (Transparent)</span>
        <span>50 (Moderate)</span>
        <span>100 (High Pressure)</span>
      </div>

      {rationale && (
        <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
          <strong className="text-slate-200">AI Assessment:</strong> {rationale}
        </p>
      )}

      {keyDrivers && keyDrivers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {keyDrivers.map((driver, idx) => (
            <span 
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80"
            >
              • {driver}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
