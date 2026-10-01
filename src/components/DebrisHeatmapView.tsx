import React, { useState } from 'react';
import { Layers, Flame, Compass, Filter, ShieldAlert, BarChart3, Info } from 'lucide-react';

interface DebrisHeatmapViewProps {
  show3DHeatmap: boolean;
  onToggle3DHeatmap: () => void;
  onFilterRegime?: (regime: string) => void;
}

interface AltitudeBin {
  name: string;
  regime: string;
  altitudeRange: string;
  objectCount: number;
  percentage: number;
  densityIndex: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  topFragments: string;
}

export const DebrisHeatmapView: React.FC<DebrisHeatmapViewProps> = ({
  show3DHeatmap,
  onToggle3DHeatmap,
  onFilterRegime,
}) => {
  const [activeTab, setActiveTab] = useState<'ALTITUDE' | 'INCLINATION' | 'ORIGIN'>('ALTITUDE');

  const altitudeBins: AltitudeBin[] = [
    {
      name: 'LEO Peak Collision Zone',
      regime: '750 - 900 km',
      altitudeRange: '750 - 900 km',
      objectCount: 16420,
      percentage: 46,
      densityIndex: 'CRITICAL',
      topFragments: 'Cosmos 2251, Fengyun-1C, Iridium 33, SL-16 stages',
    },
    {
      name: 'LEO Operational / Mega-Constellations',
      regime: '500 - 650 km',
      altitudeRange: '500 - 650 km',
      objectCount: 8900,
      percentage: 25,
      densityIndex: 'HIGH',
      topFragments: 'Sentinel, Starlink, OneWeb, Earth Observers',
    },
    {
      name: 'LEO Manned / ISS Orbit',
      regime: '350 - 450 km',
      altitudeRange: '350 - 450 km',
      objectCount: 3120,
      percentage: 9,
      densityIndex: 'MODERATE',
      topFragments: 'Cosmos-1408 ASAT, Tiangong Station, ISS',
    },
    {
      name: 'LEO Upper Transition Zone',
      regime: '950 - 1500 km',
      altitudeRange: '950 - 1500 km',
      objectCount: 4350,
      percentage: 12,
      densityIndex: 'MODERATE',
      topFragments: 'Envisat, Thor Able stages, vintage meteorological',
    },
    {
      name: 'GEO Clarke Belt & Graveyard',
      regime: '~35,786 km',
      altitudeRange: '35,500 - 36,100 km',
      objectCount: 2200,
      percentage: 6,
      densityIndex: 'LOW',
      topFragments: 'Telecommunication satellites, apogee boost kickers',
    },
    {
      name: 'MEO Navigation Band',
      regime: '20,000 - 24,000 km',
      altitudeRange: '20,000 - 24,000 km',
      objectCount: 650,
      percentage: 2,
      densityIndex: 'LOW',
      topFragments: 'GPS Block II/III, Galileo, GLONASS',
    },
  ];

  const inclinationBins = [
    { inc: '98° - 102° (Sun-Synchronous)', count: 12400, threat: 'Highest collision volume (polar crossing points)' },
    { inc: '82° - 86° (High Inclination Russian)', count: 7100, threat: 'Historical military recon debris' },
    { inc: '71° - 74° (Zenit / SL-16 Heavy Bodies)', count: 5400, threat: 'High kinetic mass upper stages' },
    { inc: '53° (Commercial Constellation Shell)', count: 4800, threat: 'Starlink Gen 1 & 2 deployment tracks' },
    { inc: '28.5° (Low Inclination US Launches)', count: 3100, threat: 'Cape Canaveral payload adapters' },
    { inc: '0° - 15° (Geostationary Equatorial)', count: 2150, threat: 'Long-life drift clustering' },
  ];

  const originBreakdown = [
    { country: 'CIS / Russia', percentage: 41, color: 'bg-red-500', count: '~14,800 objects' },
    { country: 'United States', percentage: 31, color: 'bg-blue-500', count: '~11,200 objects' },
    { country: 'China', percentage: 20, color: 'bg-amber-500', count: '~7,200 objects' },
    { country: 'ESA / European Nations', percentage: 5, color: 'bg-cyan-500', count: '~1,800 objects' },
    { country: 'Others (India, Japan, etc.)', percentage: 3, color: 'bg-purple-500', count: '~1,080 objects' },
  ];

  return (
    <div className="w-full rounded-xl bg-[#0b121e] border border-slate-800 p-4 text-slate-100 shadow-xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                Orbital Debris Spatial Density Heatmap
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                36,000+ TRACKED OBJECTS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-telemetry mt-0.5">
              Spatial flux density distribution across altitude shells, inclination corridors, and source states
            </p>
          </div>
        </div>

        {/* 3D Shell Toggle Button */}
        <button
          id="btn-toggle-3d-heatmap"
          onClick={onToggle3DHeatmap}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-telemetry transition border ${
            show3DHeatmap
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${show3DHeatmap ? 'text-sky-200' : 'text-slate-400'}`} />
          <span>{show3DHeatmap ? '3D Density Volumetric: ON' : 'Toggle 3D Density Shell'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mt-3.5 font-telemetry">
        <button
          onClick={() => setActiveTab('ALTITUDE')}
          className={`px-2.5 py-1 rounded text-xs transition border ${
            activeTab === 'ALTITUDE'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
          }`}
        >
          Altitude Shells
        </button>
        <button
          onClick={() => setActiveTab('INCLINATION')}
          className={`px-2.5 py-1 rounded text-xs transition border ${
            activeTab === 'INCLINATION'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
          }`}
        >
          Inclination Corridors
        </button>
        <button
          onClick={() => setActiveTab('ORIGIN')}
          className={`px-2.5 py-1 rounded text-xs transition border ${
            activeTab === 'ORIGIN'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
          }`}
        >
          State of Origin
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-3.5">
        {activeTab === 'ALTITUDE' && (
          <div className="space-y-2.5">
            {altitudeBins.map((bin, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070b14] border border-slate-800 hover:border-slate-700 transition font-telemetry"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        bin.densityIndex === 'CRITICAL'
                          ? 'bg-red-500'
                          : bin.densityIndex === 'HIGH'
                          ? 'bg-orange-500'
                          : bin.densityIndex === 'MODERATE'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-200">{bin.name}</span>
                    <span className="text-[11px] text-slate-400">({bin.altitudeRange})</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-300 font-bold">{bin.objectCount.toLocaleString()} objects</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        bin.densityIndex === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-700/50'
                          : bin.densityIndex === 'HIGH'
                          ? 'bg-orange-950 text-orange-400 border border-orange-700/50'
                          : bin.densityIndex === 'MODERATE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                      }`}
                    >
                      {bin.densityIndex}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded-sm overflow-hidden border border-slate-800 mt-2">
                  <div
                    className={`h-full ${
                      bin.densityIndex === 'CRITICAL'
                        ? 'bg-red-500'
                        : bin.densityIndex === 'HIGH'
                        ? 'bg-orange-500'
                        : bin.densityIndex === 'MODERATE'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${bin.percentage}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
                  <span>Debris clusters: {bin.topFragments}</span>
                  <span>{bin.percentage}% share of LEO/MEO</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'INCLINATION' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-telemetry">
            {inclinationBins.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#070b14] border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-sky-400">{item.inc}</span>
                  <span className="font-bold text-slate-200">{item.count.toLocaleString()} objs</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">{item.threat}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ORIGIN' && (
          <div className="space-y-3 font-telemetry">
            <div className="w-full h-2 rounded-sm overflow-hidden flex bg-slate-900 border border-slate-800">
              {originBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.color} h-full transition-all`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.country}: ${item.percentage}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {originBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center gap-3">
                  <span className={`w-3 h-3 rounded ${item.color}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.country}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.percentage}% ({item.count})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
