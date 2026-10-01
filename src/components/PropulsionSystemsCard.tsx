import React, { useState } from 'react';
import { SpaceObject } from '../types/space';
import { soundEngine } from '../utils/audioAlerts';
import {
  Flame,
  Fuel,
  Gauge,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

interface PropulsionSystemsCardProps {
  satellite: SpaceObject;
  onOpenAutoAvoidance: () => void;
  onInitiateSequence: () => void;
}

export const PropulsionSystemsCard: React.FC<PropulsionSystemsCardProps> = ({
  satellite,
  onOpenAutoAvoidance,
  onInitiateSequence,
}) => {
  const [rcsFiring, setRcsFiring] = useState<string | null>(null);

  const maxFuel = satellite.maxFuelKg || 50;
  const currentFuel = satellite.fuelKg ?? 42.5;
  const fuelPercent = Math.round((currentFuel / maxFuel) * 100);
  const deltaV = satellite.deltaVAvailableMS ?? 124.0;

  const testFireRcs = (axis: string) => {
    setRcsFiring(axis);
    soundEngine.playRadarPing();
    setTimeout(() => setRcsFiring(null), 1200);
  };

  return (
    <div className="w-full h-full rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#182744]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  PROPULSION SYSTEMS
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-telemetry bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ARMED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-telemetry">
                Bipropellant Monomethylhydrazine / NTO Thrusters
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-telemetry uppercase block">ΔV Capacity</span>
            <span className="text-sm font-bold text-sky-400 font-telemetry">{deltaV.toFixed(1)} m/s</span>
          </div>
        </div>

        {/* Propellant Tank Bar & Stats */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#0c162c] border border-[#1b2b48]">
          <div className="flex items-center justify-between text-xs font-telemetry mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-sky-400" />
              <span>Propellant Mass</span>
            </span>
            <span className="text-slate-200 font-bold">
              {currentFuel.toFixed(1)} / {maxFuel.toFixed(1)} kg ({fuelPercent}%)
            </span>
          </div>

          {/* Level Bar */}
          <div className="w-full bg-[#080e1c] h-2 rounded-full overflow-hidden border border-[#16233d]">
            <div
              className={`h-full transition-all duration-500 ${
                fuelPercent > 30 ? 'bg-gradient-to-r from-sky-500 to-emerald-400' : 'bg-amber-500'
              }`}
              style={{ width: `${fuelPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-telemetry mt-2">
            <span>Tank Press: <strong className="text-slate-200">2.42 MPa</strong></span>
            <span>Feed Line Temp: <strong className="text-slate-200">+18.5°C</strong></span>
            <span>He Pressurant: <strong className="text-emerald-400">NOMINAL</strong></span>
          </div>
        </div>

        {/* Thruster Engine Specs */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs font-telemetry">
          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 uppercase block">Chamber Press</span>
            <span className="text-sm font-bold text-sky-300">2.38 MPa</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 uppercase block">Chamber Temp</span>
            <span className="text-sm font-bold text-amber-400">1,380 K</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 uppercase block">Specific Impulse</span>
            <span className="text-sm font-bold text-emerald-400">298 s</span>
          </div>
        </div>

        {/* RCS Thruster Grid (Roll, Pitch, Yaw) */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#081020] border border-[#182744]">
          <div className="flex items-center justify-between text-[10px] font-telemetry text-slate-400 mb-2">
            <span className="uppercase font-bold">RCS Attitude Reaction Thrusters</span>
            <span className="text-emerald-400">4-PODS READY</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-[10px] font-telemetry">
            {['+ROLL', '-ROLL', '+PITCH', '+YAW'].map((axis) => (
              <button
                key={axis}
                onClick={() => testFireRcs(axis)}
                className={`py-1.5 px-1 rounded border text-center transition font-semibold ${
                  rcsFiring === axis
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-[#0d182e] border-[#1d2d4a] text-slate-300 hover:border-sky-500/50 hover:text-white'
                }`}
              >
                {axis} {rcsFiring === axis ? '🔥' : '•'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Quick Action */}
      <div className="mt-3.5 pt-2.5 border-t border-[#182744] flex items-center justify-between gap-2">
        <button
          onClick={onInitiateSequence}
          className="text-xs text-amber-400 hover:text-amber-300 font-telemetry font-bold flex items-center gap-1.5 transition"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Prepare Ignition Burn</span>
        </button>

        <button
          onClick={onOpenAutoAvoidance}
          className="px-2.5 py-1 rounded bg-[#0e1c36] hover:bg-[#142649] border border-[#223558] text-sky-400 text-xs font-telemetry transition"
        >
          Auto-CAM Maneuver
        </button>
      </div>
    </div>
  );
};
