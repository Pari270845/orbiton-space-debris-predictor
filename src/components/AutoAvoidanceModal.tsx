import React, { useState } from 'react';
import { SpaceObject, ConjunctionEvent, AvoidanceBurn } from '../types/space';
import { generateAutoAvoidanceProposals } from '../utils/orbitalPhysics';
import { soundEngine } from '../utils/audioAlerts';
import { X, ShieldAlert, ShieldCheck, Zap, Fuel, Clock, ArrowUpRight, CheckCircle2, Flame } from 'lucide-react';

interface AutoAvoidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  satellite: SpaceObject;
  conjunction: ConjunctionEvent;
  onExecuteManeuver: (burn: AvoidanceBurn) => void;
}

export const AutoAvoidanceModal: React.FC<AutoAvoidanceModalProps> = ({
  isOpen,
  onClose,
  satellite,
  conjunction,
  onExecuteManeuver,
}) => {
  const [proposals] = useState<AvoidanceBurn[]>(() =>
    generateAutoAvoidanceProposals(
      satellite,
      conjunction.missDistanceKm,
      conjunction.relativeVelocityKmS,
      conjunction.tcaMinutes
    )
  );

  const [selectedBurnId, setSelectedBurnId] = useState<string>(proposals[0]?.id || 'cam-min-fuel');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const selectedBurn = proposals.find((p) => p.id === selectedBurnId) || proposals[0];

  const handleExecute = () => {
    setIsExecuting(true);
    soundEngine.playThrusterBurn();

    setTimeout(() => {
      soundEngine.playSuccessChime();
      setIsExecuting(false);
      onExecuteManeuver(selectedBurn);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  Collision Avoidance Maneuver (CAM) Planner
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                  AUTO-SOLVER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Automated orbital flight dynamics solutions for conjunction risk elimination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Threat Header Dossier */}
        <div className="mt-4 p-3.5 rounded-lg bg-[#070b14] border border-red-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <div>
              <span className="text-slate-400 font-telemetry block text-[10px] uppercase">Conjunction Target</span>
              <span className="text-slate-100 font-bold font-telemetry text-sm">{conjunction.secondaryObjectName}</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs font-telemetry">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT MISS</span>
              <span className="text-red-400 font-bold">{(conjunction.missDistanceKm ?? 0).toFixed(2)} km</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CLOSURE SPEED</span>
              <span className="text-slate-200 font-bold">{(conjunction.relativeVelocityKmS ?? 0).toFixed(1)} km/s</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RISK LEVEL</span>
              <span className="text-red-400 font-bold">{conjunction.collisionRiskScore}/100</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TCA WINDOW</span>
              <span className="text-amber-300 font-bold">{Math.round(conjunction.tcaMinutes)} min</span>
            </div>
          </div>
        </div>

        {/* Proposals Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {proposals.map((proposal) => {
            const isChosen = selectedBurnId === proposal.id;
            return (
              <div
                key={proposal.id}
                onClick={() => setSelectedBurnId(proposal.id)}
                className={`relative cursor-pointer p-3.5 rounded-lg border transition-all duration-150 flex flex-col justify-between ${
                  isChosen
                    ? 'bg-slate-900 border-blue-500/80 ring-1 ring-blue-500/50'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {proposal.strategy === 'MIN_FUEL' && (
                  <span className="absolute -top-2 right-2.5 px-2 py-0.2 rounded text-[9px] font-bold font-telemetry bg-emerald-950 text-emerald-300 border border-emerald-600/50 uppercase">
                    Optimal
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className={`w-3.5 h-3.5 ${isChosen ? 'text-sky-400' : 'text-slate-400'}`} />
                    <h3 className="text-xs font-bold font-telemetry text-slate-100">{proposal.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{proposal.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1 text-xs font-telemetry">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delta-V:</span>
                    <span className="text-sky-400 font-semibold">+{proposal.deltaVMS} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fuel Mass:</span>
                    <span className="text-slate-300 font-semibold">{proposal.fuelCostKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">New Miss:</span>
                    <span className="text-emerald-400 font-bold">{proposal.newMissDistanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Residual Risk:</span>
                    <span className="text-emerald-400 font-bold">{proposal.newRiskScore}/100</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="mt-4 p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-telemetry">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                CAM EXECUTION SOLUTION READY
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Propellant burn: <span className="text-sky-300 font-bold">{selectedBurn.fuelCostKg} kg</span> (Remaining: {Math.max(0, (satellite.fuelKg ?? 0) - (selectedBurn?.fuelCostKg ?? 0)).toFixed(1)} kg)
                • Separation gain: <span className="text-emerald-400 font-bold">+{Math.max(0, ((selectedBurn?.newMissDistanceKm ?? 0) - (conjunction.missDistanceKm ?? 0))).toFixed(2)} km</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400">P(Success):</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-xs border border-emerald-600/50">
              {selectedBurn.successProbability}%
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-telemetry text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-cam-burn"
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold font-telemetry text-white bg-blue-600 hover:bg-blue-500 transition shadow border border-blue-400/40 disabled:opacity-60"
          >
            {isExecuting ? (
              <>
                <Flame className="w-3.5 h-3.5 text-sky-200" />
                <span>Executing Thruster Burn...</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-sky-200" />
                <span>Execute CAM Maneuver</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
