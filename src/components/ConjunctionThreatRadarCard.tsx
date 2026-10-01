import React from 'react';
import { ConjunctionEvent } from '../types/space';
import { RiskScoreBadge } from './RiskScoreBadge';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Radio,
  AlertTriangle,
} from 'lucide-react';

interface ConjunctionThreatRadarCardProps {
  conjunction: ConjunctionEvent | null;
  onOpenExplain: () => void;
  onOpenAutoAvoidance: () => void;
  onOpenWhatIf: () => void;
}

export const ConjunctionThreatRadarCard: React.FC<ConjunctionThreatRadarCardProps> = ({
  conjunction,
  onOpenExplain,
  onOpenAutoAvoidance,
  onOpenWhatIf,
}) => {
  if (!conjunction) {
    return (
      <div className="w-full h-full rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between font-sans">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#182744]">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
              CONJUNCTION THREAT RADAR
            </h3>
            <p className="text-[11px] text-slate-400 font-telemetry">Active 72-Hour Collision Threat Screening</p>
          </div>
        </div>

        <div className="py-8 text-center text-xs font-telemetry text-emerald-400">
          No immediate high-risk conjunctions detected in active lookahead window.
        </div>
      </div>
    );
  }

  const isCritical = conjunction.collisionRiskScore >= 70;

  return (
    <div className="w-full h-full rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#182744]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  CONJUNCTION THREAT RADAR
                </h3>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-telemetry ${
                  isCritical ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {conjunction.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-telemetry">
                Active 72-Hour Collision Screening
              </p>
            </div>
          </div>

          <RiskScoreBadge score={conjunction.collisionRiskScore} size="sm" />
        </div>

        {/* Target threat object box */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#0c162c] border border-[#1b2b48]">
          <div className="text-[10px] text-slate-400 font-telemetry uppercase block mb-1">
            Encounter Target Asset
          </div>
          <div className="text-sm font-bold text-slate-200 font-telemetry">
            {conjunction.secondaryObjectName}
          </div>
          <div className="text-[11px] text-slate-400 font-telemetry mt-0.5">
            Miss Distance: <strong className="text-amber-400">{conjunction.missDistanceKm.toFixed(2)} km</strong> • Rel. Speed: <strong className="text-slate-200">{conjunction.relativeVelocityKmS.toFixed(2)} km/s</strong>
          </div>
        </div>

        {/* TCA Countdown */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-telemetry">
          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 uppercase block">Time to Encounter (TCA)</span>
            <span className="text-sm font-bold text-red-400">
              {(conjunction.tcaMinutes ?? 60).toFixed(1)} mins
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 uppercase block">Collision Probability</span>
            <span className="text-sm font-bold text-amber-400">
              {conjunction.collisionProbability.toExponential(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-[#182744] flex items-center justify-between gap-2">
        <button
          onClick={onOpenExplain}
          className="text-xs text-slate-400 hover:text-slate-200 font-telemetry flex items-center gap-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Explain Risk</span>
        </button>

        <button
          onClick={onOpenAutoAvoidance}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-telemetry transition flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous CAM</span>
        </button>
      </div>
    </div>
  );
};
