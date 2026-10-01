import React, { useState, useEffect } from 'react';
import { SpaceObject, SpaceAlert } from '../types/space';
import {
  Satellite,
  Shield,
  Gamepad2,
  Trophy,
  Film,
  Layers,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  ChevronDown,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  satellites: SpaceObject[];
  selectedSatellite: SpaceObject;
  onSelectSatellite: (sat: SpaceObject) => void;
  alerts: SpaceAlert[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenMission: () => void;
  onOpenLeaderboard: () => void;
  onOpenReplay: () => void;
  onOpenAlerts: () => void;
  onScrollToHeatmap: () => void;
  activeView: '3D_MAP' | 'HEATMAP' | 'HEALTH';
  onChangeView: (view: '3D_MAP' | 'HEATMAP' | 'HEALTH') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  alerts,
  soundEnabled,
  onToggleSound,
  onOpenMission,
  onOpenLeaderboard,
  onOpenReplay,
  onOpenAlerts,
  onScrollToHeatmap,
  activeView,
  onChangeView,
}) => {
  const [utcTime, setUtcTime] = useState('');
  const [utcDate, setUtcDate] = useState('');
  const [isSatDropdownOpen, setIsSatDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString();
      setUtcDate(iso.slice(0, 10));
      setUtcTime(iso.slice(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="w-full bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2 text-slate-200">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Flight Ops Subsystem Ident */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider font-telemetry text-slate-100 uppercase">
                  ORBIT<span className="text-sky-400 font-semibold">ON</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-telemetry bg-slate-800/80 text-slate-300 border border-slate-700">
                  SSA-JSpOC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-telemetry hidden sm:block">
                CONJUNCTION ASSESSMENT & COLLISION AVOIDANCE
              </p>
            </div>
          </div>

          {/* System Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-telemetry">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">STATUS:</span>
            <span className="text-emerald-400 font-semibold">NOMINAL</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">FEED:</span>
            <span className="text-slate-300">18 SDS (T+0)</span>
          </div>

          {/* Mobile UTC Clock */}
          <div className="flex md:hidden items-center gap-1.5 text-xs font-telemetry text-sky-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5" />
            <span>{utcTime}</span>
          </div>
        </div>

        {/* Center: View Switcher & Asset Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs font-telemetry">
            <button
              onClick={() => onChangeView('3D_MAP')}
              className={`px-3 py-1 rounded transition text-xs ${
                activeView === '3D_MAP'
                  ? 'bg-blue-600/30 text-sky-200 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Orbit Map
            </button>
            <button
              onClick={() => onChangeView('HEALTH')}
              className={`px-3 py-1 rounded transition text-xs ${
                activeView === 'HEALTH'
                  ? 'bg-blue-600/30 text-sky-200 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite Health
            </button>
            <button
              onClick={() => onChangeView('HEATMAP')}
              className={`px-3 py-1 rounded transition text-xs ${
                activeView === 'HEATMAP'
                  ? 'bg-blue-600/30 text-sky-200 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Debris Density
            </button>
          </div>

          {/* Satellite Asset Selector */}
          <div className="relative">
            <button
              onClick={() => setIsSatDropdownOpen(!isSatDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-telemetry text-slate-200 hover:border-slate-700 transition"
              title="Select Primary Fleet Asset"
            >
              <Satellite className="w-3.5 h-3.5 text-sky-400" />
              <span className="max-w-[130px] truncate text-slate-200 font-medium">
                {selectedSatellite.name.split('(')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isSatDropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 w-64 rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl z-50 p-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800/80">
                  <span>Tracked Assets</span>
                  <span className="font-telemetry text-slate-500">{satellites.length} in orbit</span>
                </div>
                {satellites.map((sat) => (
                  <button
                    key={sat.id}
                    onClick={() => {
                      onSelectSatellite(sat);
                      setIsSatDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-telemetry flex items-center justify-between transition ${
                      sat.id === selectedSatellite.id
                        ? 'bg-blue-600/25 text-sky-300 font-semibold border border-blue-500/40'
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="truncate pr-2">{sat.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{sat.altitudeKm} km</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Telemetry Clock, Mission Console, Replay, Alerts, Sound */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* UTC Clock on Desktop */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-telemetry bg-slate-900 px-3 py-1 rounded border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">{utcDate}</span>
            <span className="text-sky-400 font-semibold">{utcTime}</span>
          </div>

          <button
            id="nav-btn-mission"
            onClick={onOpenMission}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-telemetry transition"
            title="Defense Mission Scenario"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Mission</span>
          </button>

          <button
            id="nav-btn-leaderboard"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-telemetry transition"
            title="Flight Director Ranks"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Roster</span>
          </button>

          <button
            id="nav-btn-replay"
            onClick={onOpenReplay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-telemetry transition"
            title="Incident Replay / Black Box"
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {/* Alerts Center Trigger */}
          <button
            id="nav-btn-alerts"
            onClick={onOpenAlerts}
            className={`relative p-1.5 rounded border transition ${
              unreadAlerts > 0
                ? 'bg-red-950/40 border-red-600/50 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alert Center"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] font-bold font-telemetry flex items-center justify-center text-white">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            id="nav-btn-sound"
            onClick={onToggleSound}
            className={`p-1.5 rounded border transition ${
              soundEnabled
                ? 'bg-blue-950/40 border-blue-600/40 text-sky-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Audio Chimes: ACTIVE' : 'Audio Chimes: MUTED'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
