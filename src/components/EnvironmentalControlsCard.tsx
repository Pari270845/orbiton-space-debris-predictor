import React, { useState } from 'react';
import { SpaceObject } from '../types/space';
import {
  Thermometer,
  Sun,
  Battery,
  Zap,
  Activity,
  ShieldCheck,
  Radio,
  Cpu,
} from 'lucide-react';

interface EnvironmentalControlsCardProps {
  satellite: SpaceObject;
}

export const EnvironmentalControlsCard: React.FC<EnvironmentalControlsCardProps> = ({
  satellite,
}) => {
  const [radiatorMode, setRadiatorMode] = useState<'AUTO' | 'OVERRIDE'>('AUTO');

  const health = satellite.health || {
    batteryPercent: 94,
    solarPowerWatts: 1850,
    decayRateKmYear: 1.2,
    structuralIntegrity: 98,
    thrusterStatus: 'READY',
  };

  const tempC = 22.4;

  return (
    <div className="w-full h-full rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#182744]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  ENVIRONMENTAL CONTROLS
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-telemetry bg-emerald-950 text-emerald-400 border border-emerald-800">
                  OPTIMAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-telemetry">
                Thermal Balance, Electrical Power & Radiative Shielding
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-telemetry uppercase block">Core Temp</span>
            <span className="text-sm font-bold text-emerald-400 font-telemetry">+{tempC}°C</span>
          </div>
        </div>

        {/* Thermal Gradient Range Bar */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#0c162c] border border-[#1b2b48]">
          <div className="flex items-center justify-between text-xs font-telemetry mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avionics Thermal Bus</span>
            </span>
            <span className="text-slate-200 font-semibold">
              Range: -15°C to +55°C (Nominal: 15–25°C)
            </span>
          </div>

          {/* Color spectrum gradient bar */}
          <div className="relative w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-500">
            {/* Indicator Marker */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md rounded-full transform -translate-x-1/2"
              style={{ left: `${((tempC - -15) / 70) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-telemetry mt-2">
            <span>Radiators: <strong className="text-emerald-400">DEPLOYED</strong></span>
            <span>Loop A Flux: <strong className="text-slate-200">140 W</strong></span>
            <span>Multilayer Insulation: <strong className="text-slate-200">OK</strong></span>
          </div>
        </div>

        {/* Electrical & Power Subsystems Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-telemetry">
          {/* Solar Power */}
          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>SOLAR ARRAYS</span>
              </span>
              <span className="text-emerald-400 font-bold">LOCKED</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-telemetry">
              {health.solarPowerWatts.toLocaleString()} W
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              GaAs Triple-Junction Photovoltaics
            </div>
          </div>

          {/* Battery Storage */}
          <div className="p-2.5 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Battery className="w-3 h-3 text-sky-400" />
                <span>BATTERY SOC</span>
              </span>
              <span className="text-emerald-400 font-bold">{health.batteryPercent}%</span>
            </div>
            <div className="text-sm font-bold text-slate-100 font-telemetry">
              28.2 V <span className="text-slate-500 font-normal">/ 14.2 A</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Li-Ion Cells: 8/8 Balanced
            </div>
          </div>
        </div>

        {/* Radiation & Space Environment */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#081020] border border-[#182744] flex items-center justify-between text-[11px] font-telemetry">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-200 font-semibold">Radiation Sensor (Dosimeter)</div>
              <div className="text-[10px] text-slate-400">Ionizing Flux: 0.09 mSv/h (Quiet)</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-slate-200 font-semibold">Magnetic Field</div>
            <div className="text-[10px] text-slate-400">44.2 µT (LEO Dipole)</div>
          </div>
        </div>
      </div>

      {/* Footer Toggle */}
      <div className="mt-3.5 pt-2.5 border-t border-[#182744] flex items-center justify-between text-xs font-telemetry">
        <span className="text-slate-400">Thermal Loop Mode:</span>
        <div className="flex items-center gap-1 p-0.5 rounded bg-[#0c162c] border border-[#1b2b48]">
          <button
            onClick={() => setRadiatorMode('AUTO')}
            className={`px-2 py-0.5 rounded text-[10px] transition ${
              radiatorMode === 'AUTO'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AUTO-REGULATE
          </button>
          <button
            onClick={() => setRadiatorMode('OVERRIDE')}
            className={`px-2 py-0.5 rounded text-[10px] transition ${
              radiatorMode === 'OVERRIDE'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MANUAL
          </button>
        </div>
      </div>
    </div>
  );
};
