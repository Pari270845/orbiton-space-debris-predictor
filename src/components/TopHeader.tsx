import React, { useState, useEffect } from 'react';
import { SpaceObject, SpaceAlert } from '../types/space';
import {
  CheckCircle2,
  Play,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Radio,
  Flame,
  Shield,
  Activity,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface TopHeaderProps {
  selectedSatellite: SpaceObject;
  alerts: SpaceAlert[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAlerts: () => void;
  onInitiateSequence: () => void;
  isSequenceActive?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  selectedSatellite,
  alerts,
  soundEnabled,
  onToggleSound,
  onOpenAlerts,
  onInitiateSequence,
  isSequenceActive = false,
}) => {
  const [utcTime, setUtcTime] = useState('');
  const [utcDate, setUtcDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const iso = now.toISOString();
      setUtcDate(iso.slice(0, 10));
      setUtcTime(iso.slice(11, 19) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="w-full bg-[#0a1224]/95 backdrop-blur-md border-b border-[#1b2b48] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 text-slate-200 select-none">
      {/* Left: Active Telemetry Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-telemetry">
          <span className="text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
            MISSION TRAJECTORY
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-sky-300 font-bold uppercase tracking-wider">
            {selectedSatellite.name.split('(')[0].trim()}
          </span>
          <span className="text-slate-600 hidden md:inline">/</span>
          <span className="text-slate-400 hidden md:inline">
            NORAD #{selectedSatellite.catalogNumber}
          </span>
          <span className="text-slate-600 hidden lg:inline">/</span>
          <span className="text-emerald-400 hidden lg:inline font-mono">
            {selectedSatellite.altitudeKm} KM • {selectedSatellite.elements.inclinationDeg.toFixed(1)}° INC
          </span>
        </div>
      </div>

      {/* Center / Right Control Panel */}
      <div className="flex items-center gap-3 ml-auto">
        {/* "STATUS: READY FOR LAUNCH" Badge from User Image */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1c38] border border-[#233a64] shadow-sm">
          <div className="relative flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400/50 animate-ping" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-telemetry tracking-wide">
            <span className="text-slate-400 font-medium">STATUS:</span>
            <span className="text-emerald-400 font-bold">READY FOR LAUNCH</span>
          </div>
        </div>

        {/* Live Mission Clock */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0c162c] border border-[#1d2f50] text-xs font-telemetry">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">{utcDate}</span>
          <span className="text-sky-200 font-bold">{utcTime}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-[#0c162c] hover:bg-[#122244] border border-[#1d2f50] text-slate-300 hover:text-white transition"
          title={soundEnabled ? 'Mute Audio Alerts' : 'Enable Audio Alerts'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-sky-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg bg-[#0c162c] hover:bg-[#122244] border border-[#1d2f50] text-slate-300 hover:text-white transition"
          title="Conjunction Alerts Feed"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-telemetry text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadAlerts}
            </span>
          )}
        </button>

        {/* Prominent Amber "INITIATE SEQUENCE" CTA Button from Image */}
        <button
          onClick={onInitiateSequence}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs font-telemetry tracking-wider uppercase shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
        >
          <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
          <span>INITIATE SEQUENCE</span>
        </button>
      </div>
    </header>
  );
};
