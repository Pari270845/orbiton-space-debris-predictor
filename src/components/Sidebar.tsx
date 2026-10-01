import React from 'react';
import { SpaceObject, SpaceAlert } from '../types/space';
import {
  Rocket,
  Compass,
  Layers,
  Flame,
  ShieldAlert,
  Sliders,
  Sparkles,
  RotateCcw,
  Trophy,
  Activity,
  Radio,
  ChevronDown,
  Satellite,
  Wifi,
  Shield,
  Gauge,
  Thermometer,
} from 'lucide-react';

export type NavSection =
  | 'OVERVIEW'
  | 'TRAJECTORY'
  | 'PROPULSION'
  | 'ENVIRONMENTAL'
  | 'CONJUNCTIONS'
  | 'HEATMAP';

interface SidebarProps {
  satellites: SpaceObject[];
  selectedSatellite: SpaceObject;
  onSelectSatellite: (sat: SpaceObject) => void;
  activeSection: NavSection;
  onChangeSection: (section: NavSection) => void;
  alerts: SpaceAlert[];
  onOpenWhatIf: () => void;
  onOpenAutoAvoidance: () => void;
  onOpenReplay: () => void;
  onOpenLeaderboard: () => void;
  onOpenMission: () => void;
  isInitiateSequenceOpen: boolean;
  onInitiateSequence: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  activeSection,
  onChangeSection,
  alerts,
  onOpenWhatIf,
  onOpenAutoAvoidance,
  onOpenReplay,
  onOpenLeaderboard,
  onOpenMission,
  onInitiateSequence,
}) => {
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <aside className="w-64 shrink-0 bg-[#091122] border-r border-[#1a2942] flex flex-col justify-between h-screen sticky top-0 text-slate-300 font-sans z-30 select-none">
      {/* Brand & Mission Header */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-[#1a2942] bg-[#0c162c]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#091122] rounded-[10px] flex items-center justify-center text-sky-400">
                <Rocket className="w-5 h-5 -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wider text-slate-100 font-telemetry uppercase">
                  Orbit<span className="text-sky-400">on</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-telemetry bg-blue-950/80 text-sky-300 border border-blue-800/60 font-semibold">
                  v2.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-telemetry uppercase tracking-wider">
                FLIGHT DYNAMICS OPS
              </p>
            </div>
          </div>

          {/* Active Asset Selector */}
          <div className="mt-4">
            <label className="text-[10px] font-telemetry text-slate-400 uppercase tracking-wider block mb-1">
              Active Orbiting Asset
            </label>
            <div className="relative">
              <select
                value={selectedSatellite.id}
                onChange={(e) => {
                  const sat = satellites.find((s) => s.id === e.target.value);
                  if (sat) onSelectSatellite(sat);
                }}
                className="w-full appearance-none bg-[#0e1b33] hover:bg-[#122344] text-xs font-telemetry text-slate-200 py-2 pl-3 pr-8 rounded-lg border border-[#223659] focus:outline-none focus:border-sky-400 transition"
              >
                {satellites.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0e1b33] text-slate-200">
                    {s.name} (NORAD #{s.catalogNumber})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          <div className="px-3 pt-2 pb-1 text-[10px] font-telemetry font-bold text-slate-400 uppercase tracking-wider">
            Operations Console
          </div>

          <button
            onClick={() => onChangeSection('OVERVIEW')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'OVERVIEW'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Mission Dashboard</span>
            </div>
            <span className="text-[9px] font-telemetry text-slate-400">LIVE</span>
          </button>

          <button
            onClick={() => onChangeSection('TRAJECTORY')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'TRAJECTORY'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Trajectory Prediction</span>
            </div>
            <span className="text-[9px] font-telemetry text-emerald-400">SGP4</span>
          </button>

          <button
            onClick={() => onChangeSection('PROPULSION')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'PROPULSION'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Propulsion Systems</span>
            </div>
            <span className="text-[9px] font-telemetry text-amber-400">ARMED</span>
          </button>

          <button
            onClick={() => onChangeSection('ENVIRONMENTAL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'ENVIRONMENTAL'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              <span>Environmental Controls</span>
            </div>
            <span className="text-[9px] font-telemetry text-slate-400">22.4°C</span>
          </button>

          <button
            onClick={() => onChangeSection('CONJUNCTIONS')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'CONJUNCTIONS'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Conjunction Radar</span>
            </div>
            {unreadAlerts > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-telemetry bg-red-950 text-red-400 border border-red-800">
                {unreadAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeSection('HEATMAP')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === 'HEATMAP'
                ? 'bg-[#142342] text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Debris Spatial Density</span>
            </div>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-telemetry font-bold text-slate-400 uppercase tracking-wider">
            Flight Tools & Simulation
          </div>

          <button
            onClick={onOpenWhatIf}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33] transition"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>What-If Simulator</span>
            </div>
            <span className="text-[9px] font-telemetry text-slate-400">ΔV Calc</span>
          </button>

          <button
            onClick={onOpenAutoAvoidance}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33] transition"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Autonomous CAM</span>
            </div>
            <span className="text-[9px] font-telemetry text-sky-400">AI-Opt</span>
          </button>

          <button
            onClick={onOpenReplay}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33] transition"
          >
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-teal-400" />
              <span>Incident Replay</span>
            </div>
            <span className="text-[9px] font-telemetry text-slate-400">Logs</span>
          </button>

          <button
            onClick={onOpenMission}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33] transition"
          >
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-yellow-400" />
              <span>Mission Game Mode</span>
            </div>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#0e1a33] transition"
          >
            <div className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Global Leaderboard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-[#1a2942] bg-[#0c162c]/80 text-[11px] font-telemetry">
        <div className="p-2.5 rounded-lg bg-[#070e1c] border border-[#1c2c48] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>TELEMETRY FEED</span>
            </span>
            <span className="text-emerald-400 font-bold">18 SDS OK</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#16233b]">
            <span className="text-slate-400">OPERATIONAL MODE</span>
            <span className="text-sky-300 font-semibold">LEO FLIGHT</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#16233b]">
            <span className="text-slate-400">SYS INTEGRITY</span>
            <span className="text-slate-200">100% NOMINAL</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
          <span>CALLSIGN: FLIGHT-DIR-1</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
