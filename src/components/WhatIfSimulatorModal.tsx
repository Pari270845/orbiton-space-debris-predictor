import React, { useState, useEffect, useMemo } from 'react';
import { SpaceObject, ConjunctionEvent, WhatIfParameters, OrbitalElements } from '../types/space';
import { simulateWhatIfBurn } from '../utils/orbitalPhysics';
import { soundEngine } from '../utils/audioAlerts';
import { X, Sliders, ArrowRight, Fuel, Gauge, ShieldCheck, AlertTriangle, RotateCcw, Flame } from 'lucide-react';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  satellite: SpaceObject;
  conjunction: ConjunctionEvent;
  onPreviewOrbit: (elements: OrbitalElements | null) => void;
  onCommitManeuver: (burnDeltaV: number, fuelCostKg: number, newMissKm: number, newRisk: number) => void;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  satellite,
  conjunction,
  onPreviewOrbit,
  onCommitManeuver,
}) => {
  const [params, setParams] = useState<WhatIfParameters>({
    deltaVProgradeMS: 1.2,
    deltaVNormalMS: 0.0,
    deltaVRadialMS: 0.0,
    burnTimeOffsetMinutes: 45,
    customAltitudeChangeKm: 0.0,
  });

  // Calculate simulation outcomes
  const simResult = useMemo(() => {
    return simulateWhatIfBurn(
      satellite.elements,
      conjunction.missDistanceKm,
      params,
      conjunction.tcaMinutes
    );
  }, [
    satellite.elements,
    conjunction.missDistanceKm,
    conjunction.tcaMinutes,
    params.deltaVProgradeMS,
    params.deltaVNormalMS,
    params.deltaVRadialMS,
    params.burnTimeOffsetMinutes,
    params.customAltitudeChangeKm,
  ]);

  // Update 3D preview trajectory whenever modal state or burn parameters change
  useEffect(() => {
    if (isOpen) {
      onPreviewOrbit(simResult.newElements);
    } else {
      onPreviewOrbit(null);
    }
  }, [
    isOpen,
    params.deltaVProgradeMS,
    params.deltaVNormalMS,
    params.deltaVRadialMS,
    params.burnTimeOffsetMinutes,
    params.customAltitudeChangeKm,
  ]);

  if (!isOpen) return null;

  const handleReset = () => {
    setParams({
      deltaVProgradeMS: 0.0,
      deltaVNormalMS: 0.0,
      deltaVRadialMS: 0.0,
      burnTimeOffsetMinutes: 45,
      customAltitudeChangeKm: 0.0,
    });
  };

  const handleCommit = () => {
    soundEngine.playThrusterBurn();
    onCommitManeuver(
      Math.abs(params.deltaVProgradeMS) + Math.abs(params.deltaVNormalMS) + Math.abs(params.deltaVRadialMS),
      simResult.fuelExpendedKg,
      simResult.newMissDistanceKm,
      simResult.newRiskScore
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  Orbital Maneuver Assessment
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                  WHAT-IF SOLVER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Perturbation vector simulation & collision avoidance trajectory optimization
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onPreviewOrbit(null);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Conjunction Context */}
        <div className="mt-4 p-3 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between text-xs font-telemetry">
          <div>
            <span className="text-slate-500 block text-[10px]">FLIGHT ASSET</span>
            <span className="text-sky-400 font-bold">{satellite.name}</span>
          </div>
          <div className="text-center px-4">
            <span className="text-slate-500 block text-[10px]">CURRENT MISS DISTANCE</span>
            <span className="text-amber-400 font-bold">{(conjunction.missDistanceKm ?? 0).toFixed(2)} km</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">CONJUNCTION TARGET</span>
            <span className="text-red-400 font-bold">{conjunction.secondaryObjectName}</span>
          </div>
        </div>

        {/* Interactive Delta-V Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          {/* Prograde / Retrograde Slider */}
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1 font-telemetry">
              <span className="text-slate-300">Along-Track (ΔV Prograde)</span>
              <span className="text-sky-400 font-bold">
                {params.deltaVProgradeMS > 0 ? `+${params.deltaVProgradeMS}` : params.deltaVProgradeMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-5.0"
              max="5.0"
              step="0.1"
              value={params.deltaVProgradeMS}
              onChange={(e) => setParams({ ...params, deltaVProgradeMS: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-telemetry">
              <span>-5 m/s (Retro)</span>
              <span>0 m/s</span>
              <span>+5 m/s (Prograde)</span>
            </div>
          </div>

          {/* Normal / Out of plane Slider */}
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1 font-telemetry">
              <span className="text-slate-300">Cross-Track (ΔV Normal)</span>
              <span className="text-sky-400 font-bold">
                {params.deltaVNormalMS > 0 ? `+${params.deltaVNormalMS}` : params.deltaVNormalMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-5.0"
              max="5.0"
              step="0.1"
              value={params.deltaVNormalMS}
              onChange={(e) => setParams({ ...params, deltaVNormalMS: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-telemetry">
              <span>-5 m/s (Orbit South)</span>
              <span>0 m/s</span>
              <span>+5 m/s (Orbit North)</span>
            </div>
          </div>

          {/* Radial Slider */}
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1 font-telemetry">
              <span className="text-slate-300">Radial (ΔV In/Out)</span>
              <span className="text-sky-400 font-bold">
                {params.deltaVRadialMS > 0 ? `+${params.deltaVRadialMS}` : params.deltaVRadialMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-4.0"
              max="4.0"
              step="0.1"
              value={params.deltaVRadialMS}
              onChange={(e) => setParams({ ...params, deltaVRadialMS: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-telemetry">
              <span>-4 m/s (Earthward)</span>
              <span>0 m/s</span>
              <span>+4 m/s (Zenith)</span>
            </div>
          </div>

          {/* Lead Time Slider */}
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
            <div className="flex justify-between text-xs font-medium mb-1 font-telemetry">
              <span className="text-slate-300">Execution Lead Time (T - Burn)</span>
              <span className="text-amber-400 font-bold">
                T - {params.burnTimeOffsetMinutes} min
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={params.burnTimeOffsetMinutes}
              onChange={(e) => setParams({ ...params, burnTimeOffsetMinutes: parseInt(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-telemetry">
              <span>T-10m (Emergency)</span>
              <span>T-60m</span>
              <span>T-120m (Nominal)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcomes Comparison */}
        <div className="mt-4 p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between font-telemetry">
            <span>PREDICTED TRAJECTORY DELTAS</span>
            {simResult.isSuccessfulAvoidance ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> HAZARD MITIGATED
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> ELEVATED CONJUNCTION RISK
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-telemetry">Miss Distance</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xs text-red-400 font-telemetry">
                  {(conjunction.missDistanceKm ?? 0).toFixed(2)} km
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className={`text-xs font-bold font-telemetry ${(simResult.newMissDistanceKm ?? 0) > 10 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {(simResult.newMissDistanceKm ?? 0).toFixed(2)} km
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-telemetry">Risk Index</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xs text-red-400 font-telemetry">
                  {conjunction.collisionRiskScore}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className={`text-xs font-bold font-telemetry ${simResult.newRiskScore < 30 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {simResult.newRiskScore}/100
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-telemetry">Propellant Required</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs font-bold font-telemetry text-slate-200">
                <Fuel className="w-3.5 h-3.5 text-sky-400" />
                <span>{simResult.fuelExpendedKg} kg</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block font-telemetry">Altitude Offset</span>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs font-bold font-telemetry text-slate-200">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>{simResult.orbitAltitudeDeltaKm > 0 ? `+${simResult.orbitAltitudeDeltaKm}` : simResult.orbitAltitudeDeltaKm} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-telemetry text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Inputs</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onPreviewOrbit(null);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-telemetry text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={simResult.fuelExpendedKg > (satellite.fuelKg || 100)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold font-telemetry text-white bg-blue-600 hover:bg-blue-500 transition shadow border border-blue-400/40 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-sky-200" />
              <span>Execute Maneuver Solution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
