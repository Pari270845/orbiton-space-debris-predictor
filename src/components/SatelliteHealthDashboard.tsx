import React from 'react';
import { SpaceObject, ConjunctionEvent } from '../types/space';
import { Fuel, Battery, Sun, Activity, ShieldCheck, Gauge, AlertTriangle, Compass, Zap, Satellite, Radio, Thermometer, Cpu } from 'lucide-react';

interface SatelliteHealthDashboardProps {
  satellite: SpaceObject;
  conjunctions: ConjunctionEvent[];
  allSatellites: SpaceObject[];
  onSelectSatellite: (sat: SpaceObject) => void;
}

export const SatelliteHealthDashboard: React.FC<SatelliteHealthDashboardProps> = ({
  satellite,
  conjunctions,
  allSatellites,
  onSelectSatellite,
}) => {
  const satConjunctions = conjunctions.filter(
    (c) => c.primaryObjectId === satellite.id || c.secondaryObjectId === satellite.id
  );

  const highestRisk = satConjunctions.reduce((max, c) => Math.max(max, c.collisionRiskScore), 0);
  const health = satellite.health || {
    batteryPercent: 92,
    solarPowerWatts: 1540,
    decayRateKmYear: 1.2,
    structuralIntegrity: 98,
    thrusterStatus: 'READY',
  };

  const fuelPercent = satellite.maxFuelKg && satellite.maxFuelKg > 0
    ? Math.round(((satellite.fuelKg || 0) / satellite.maxFuelKg) * 100)
    : 0;

  return (
    <div className="w-full rounded-xl bg-[#0b121e] border border-slate-800 p-4 text-slate-100 shadow-xl font-sans">
      {/* Header & Fleet Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                {satellite.name}
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-emerald-950 text-emerald-400 border border-emerald-600/50 font-semibold">
                {satellite.status}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                NORAD #{satellite.catalogNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-telemetry mt-0.5">
              Registry: {satellite.originCountry} • Epoch Year: {satellite.launchYear} • Alt: {satellite.altitudeKm} km • Inc: {satellite.elements.inclinationDeg.toFixed(1)}°
            </p>
          </div>
        </div>

        {/* Fleet Asset Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 lg:pb-0">
          <span className="text-[10px] uppercase font-telemetry text-slate-500 mr-1.5">Asset:</span>
          {allSatellites.map((sat) => (
            <button
              key={sat.id}
              onClick={() => onSelectSatellite(sat)}
              className={`px-2.5 py-1 rounded text-xs font-telemetry whitespace-nowrap transition border ${
                sat.id === satellite.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sat.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Subsystem Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {/* 1. Power & Electrical (EPS) */}
        <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-telemetry">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Battery className="w-3.5 h-3.5 text-amber-400" />
                <span>EPS / Solar</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                NOMINAL
              </span>
            </div>
            <div className="text-lg font-bold font-telemetry text-slate-100">
              {health.batteryPercent}% <span className="text-xs font-normal text-slate-500">SoC</span>
            </div>
            <div className="text-xs text-slate-400 font-telemetry mt-0.5">
              {health.solarPowerWatts.toLocaleString()} W generation
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-900 h-1.5 rounded-sm overflow-hidden border border-slate-800">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${health.batteryPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-telemetry mt-1.5">
              <span>Solar Array:</span>
              <span className="text-slate-300 font-semibold">Sun-Tracking [OK]</span>
            </div>
          </div>
        </div>

        {/* 2. Propellant & Propulsion */}
        <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-telemetry">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Fuel className="w-3.5 h-3.5 text-sky-400" />
                <span>Propulsion</span>
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                fuelPercent > 20 ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40' : 'bg-amber-950 text-amber-400 border border-amber-600/40'
              }`}>
                {health.thrusterStatus === 'READY' ? 'NOMINAL' : 'STANDBY'}
              </span>
            </div>
            <div className="text-lg font-bold font-telemetry text-slate-100">
              {satellite.fuelKg?.toFixed(1) ?? '0.0'} <span className="text-xs font-normal text-slate-500">/ {satellite.maxFuelKg ?? 0} kg</span>
            </div>
            <div className="text-xs text-slate-400 font-telemetry mt-0.5">
              ΔV Capacity: {satellite.deltaVAvailableMS ?? 0} m/s
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-900 h-1.5 rounded-sm overflow-hidden border border-slate-800">
              <div
                className={`h-full ${fuelPercent < 25 ? 'bg-amber-500' : 'bg-sky-400'}`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-telemetry mt-1.5">
              <span>Fuel Reserve:</span>
              <span className="text-slate-300 font-semibold">{fuelPercent}% Remaining</span>
            </div>
          </div>
        </div>

        {/* 3. ADCS & Gyros */}
        <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-telemetry">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>ADCS / Gyros</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                NOMINAL
              </span>
            </div>
            <div className="text-lg font-bold font-telemetry text-slate-100">
              3-Axis Locked
            </div>
            <div className="text-xs text-slate-400 font-telemetry mt-0.5">
              Pointing Error: &lt; 0.04°
            </div>
          </div>

          <div className="mt-3 text-xs font-telemetry space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">Reaction Wheels:</span>
              <span className="text-slate-200 font-semibold">4/4 Active (3+1)</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">Star Trackers:</span>
              <span className="text-emerald-400 font-semibold">ST-A / ST-B OK</span>
            </div>
          </div>
        </div>

        {/* 4. TT&C Communications */}
        <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-telemetry">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                <span>TT&C Comm</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                NOMINAL
              </span>
            </div>
            <div className="text-lg font-bold font-telemetry text-slate-100">
              Locked <span className="text-xs font-normal text-slate-500">X-Band</span>
            </div>
            <div className="text-xs text-slate-400 font-telemetry mt-0.5">
              Downlink: 150 Mbps
            </div>
          </div>

          <div className="mt-3 text-xs font-telemetry space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">Uplink Carrier:</span>
              <span className="text-slate-200 font-semibold">2085.4 MHz</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">SNR Margin:</span>
              <span className="text-emerald-400 font-semibold">+14.2 dB</span>
            </div>
          </div>
        </div>

        {/* 5. Thermal Control (TCS) & Integrity */}
        <div className="p-3.5 rounded-lg bg-[#070b14] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-telemetry">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Thermal TCS</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                NOMINAL
              </span>
            </div>
            <div className="text-lg font-bold font-telemetry text-slate-100">
              +18.4°C <span className="text-xs font-normal text-slate-500">Core</span>
            </div>
            <div className="text-xs text-slate-400 font-telemetry mt-0.5">
              Structure: {health.structuralIntegrity}% OK
            </div>
          </div>

          <div className="mt-3 text-xs font-telemetry space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">Radiator Temp:</span>
              <span className="text-slate-200 font-semibold">-22.1°C</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-slate-500">Active Conjunctions:</span>
              <span className={`font-semibold ${highestRisk > 70 ? 'text-red-400' : 'text-slate-200'}`}>
                {satConjunctions.length} ({highestRisk}/100 max)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

