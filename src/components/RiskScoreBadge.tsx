import React from 'react';
import { ThreatLevel } from '../types/space';
import { AlertTriangle, ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RiskScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  let threatLevel: ThreatLevel = 'LOW';
  let statusText = 'NOMINAL';
  let textColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-950/40';
  let borderColor = 'border-emerald-700/50';
  let barColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let fosterProb = '2.4 × 10⁻⁵';

  if (score >= 75) {
    threatLevel = 'CRITICAL';
    statusText = 'CRITICAL';
    textColor = 'text-red-400';
    bgColor = 'bg-red-950/50';
    borderColor = 'border-red-600/60';
    barColor = 'bg-red-500';
    badgeColor = 'bg-red-500/20 text-red-300 border-red-500/50';
    fosterProb = '4.8 × 10⁻³';
  } else if (score >= 25) {
    threatLevel = 'MODERATE';
    statusText = 'WARNING';
    textColor = 'text-amber-400';
    bgColor = 'bg-amber-950/40';
    borderColor = 'border-amber-600/50';
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    fosterProb = '7.2 × 10⁻⁴';
  }

  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-telemetry ${bgColor} ${borderColor} ${textColor}`}
        title={`Collision Risk: ${score}/100 [${statusText}]`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${barColor} ${score >= 75 ? 'animate-ping' : ''}`} />
        <span className="font-semibold">{score}</span>
        <span className="text-slate-500 text-[9px]">/100</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`p-3.5 rounded-xl border ${bgColor} ${borderColor} flex flex-col gap-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {score >= 75 ? (
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            ) : score >= 25 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Collision Probability Assessment
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-telemetry border ${badgeColor}`}>
            {statusText}
          </span>
        </div>

        {/* Horizontal Risk Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-telemetry">
            <span className="text-slate-400">Risk Severity Index:</span>
            <span className={`font-bold ${textColor}`}>{score} / 100</span>
          </div>
          <div className="w-full h-2 rounded bg-slate-900 border border-slate-800 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-telemetry text-slate-500">
            <span>0 (Nominal)</span>
            <span>25 (Notice)</span>
            <span>75 (Critical)</span>
            <span>100</span>
          </div>
        </div>

        {/* Technical Data Readouts */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-telemetry">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Foster Probability (Pc)</span>
            <span className="text-slate-200 font-semibold">{fosterProb}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Action Protocol</span>
            <span className={score >= 75 ? 'text-red-400 font-semibold' : score >= 25 ? 'text-amber-400' : 'text-slate-300'}>
              {score >= 75 ? 'EXECUTE CAM' : score >= 25 ? 'HEIGHTEN SENSOR' : 'ROUTINE PASS'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Medium (default)
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-telemetry ${bgColor} ${borderColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${barColor} ${score >= 75 ? 'animate-ping' : ''}`} />
      <span className={`font-bold ${textColor}`}>{score}</span>
      <span className="text-slate-500 text-[10px]">/100</span>
      {showLabel && (
        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
          {statusText}
        </span>
      )}
    </div>
  );
};
