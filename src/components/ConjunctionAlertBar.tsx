import React, { useEffect, useState } from 'react';
import { ConjunctionEvent } from '../types/space';
import { RiskScoreBadge } from './RiskScoreBadge';
import { AlertTriangle, Clock, ShieldAlert, Sparkles, Sliders, ChevronRight, Activity } from 'lucide-react';
import { soundEngine } from '../utils/audioAlerts';

interface ConjunctionAlertBarProps {
  conjunction: ConjunctionEvent | null;
  onOpenWhatIf: () => void;
  onOpenAutoAvoidance: () => void;
  onOpenExplain: () => void;
}

export const ConjunctionAlertBar: React.FC<ConjunctionAlertBarProps> = ({
  conjunction,
  onOpenWhatIf,
  onOpenAutoAvoidance,
  onOpenExplain,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return conjunction ? Math.max(0, Math.round((conjunction.tcaTimestamp - Date.now()) / 1000)) : 9240;
  });

  // Ticking countdown effect
  useEffect(() => {
    if (!conjunction) return;

    // Reset when conjunction changes
    setSecondsRemaining(Math.max(0, Math.round((conjunction.tcaTimestamp - Date.now()) / 1000)));

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [conjunction]);

  if (!conjunction) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>All tracked orbital paths nominal. No conjunctions exceeding threshold.</span>
        </div>
      </div>
    );
  }

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  const isCritical = conjunction.collisionRiskScore >= 75;

  return (
    <div
      id="conjunction-alert-bar"
      className={`relative overflow-hidden w-full rounded-xl border p-3.5 transition-all duration-300 backdrop-blur-md shadow-xl ${
        isCritical
          ? 'bg-[#120a0d]/90 border-red-600/60 shadow-red-950/20'
          : 'bg-[#120e0a]/90 border-amber-600/50 shadow-amber-950/20'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5">
        {/* Left: Collision Countdown & Target Details */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isCritical
                  ? 'bg-red-950/80 border-red-600/60 text-red-400'
                  : 'bg-amber-950/80 border-amber-600/60 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-telemetry">
                  ACTIVE CONJUNCTION EVENT
                </span>
                <span className="text-[10px] font-telemetry px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {conjunction.altitudeKm} km LEO
                </span>
              </div>
              <h2 className="text-sm font-bold font-telemetry text-slate-100 mt-0.5 flex items-center gap-2">
                <span className="text-sky-400 font-semibold">{conjunction.primaryObjectName}</span>
                <span className="text-slate-500 font-normal">×</span>
                <span className="text-red-400 font-semibold">{conjunction.secondaryObjectName}</span>
              </h2>
            </div>
          </div>

          {/* Countdown timer pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-800 text-slate-100">
            <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-telemetry">TCA REMAINING</span>
              <span className="text-xs font-bold font-telemetry tracking-wide text-amber-300">
                {formattedCountdown}
              </span>
            </div>
          </div>

          {/* Miss Distance & Relative Speed */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-800 text-xs font-telemetry">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Miss Distance</span>
              <span className={`font-bold ${(conjunction.missDistanceKm ?? 0) < 1 ? 'text-red-400' : 'text-slate-200'}`}>
                {(conjunction.missDistanceKm ?? 0).toFixed(2)} km
              </span>
            </div>
            <div className="w-px h-5 bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Rel Velocity</span>
              <span className="font-bold text-slate-200">{(conjunction.relativeVelocityKmS ?? 0).toFixed(1)} km/s</span>
            </div>
          </div>
        </div>

        {/* Right: Risk Badge & Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <RiskScoreBadge score={conjunction.collisionRiskScore} size="md" />

          <button
            id="btn-open-whatif"
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-telemetry transition"
            title="Interactive What-If Orbit Simulator"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>What-If</span>
          </button>

          <button
            id="btn-open-explain"
            onClick={onOpenExplain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-telemetry transition"
            title="Conjunction Physics & Risk Analysis Dossier"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Analysis</span>
          </button>

          <button
            id="btn-open-auto-avoid"
            onClick={() => {
              soundEngine.playRadarPing();
              onOpenAutoAvoidance();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold font-telemetry transition shadow-md border border-blue-500/50"
            title="Calculate and Execute Collision Avoidance Maneuver"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-200" />
            <span>CAM Solutions</span>
            <ChevronRight className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
