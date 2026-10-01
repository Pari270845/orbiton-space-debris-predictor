import React, { useState, useEffect } from 'react';
import { ReplayScenario } from '../types/space';
import { REPLAY_SCENARIOS } from '../data/spaceCatalog';
import { soundEngine } from '../utils/audioAlerts';
import { X, Play, Pause, RotateCcw, FastForward, Film, AlertTriangle, ShieldCheck, Clock, Layers } from 'lucide-react';

interface IncidentReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetReplaySimTime?: (timeOffset: number) => void;
}

export const IncidentReplayModal: React.FC<IncidentReplayModalProps> = ({
  isOpen,
  onClose,
  onSetReplaySimTime,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ReplayScenario>(REPLAY_SCENARIOS[0]);
  const [timelineMinutes, setTimelineMinutes] = useState<number>(-60); // -60m to +30m around TCA
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Playback timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setTimelineMinutes((prev) => {
        if (prev >= 30) {
          setIsPlaying(false);
          return 30;
        }
        return prev + 0.5 * playbackSpeed;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed]);

  if (!isOpen) return null;

  // Calculate dynamic distance during replay
  // At t=0, distance = selectedScenario.missDistanceKm
  // Further away from t=0, distance grows by relative speed * abs(t)
  const timeOffsetSeconds = Math.abs(timelineMinutes ?? 0) * 60;
  const missDist = selectedScenario?.missDistanceKm ?? 10;
  const relVel = selectedScenario?.relativeVelocityKmS ?? 7.5;
  const currentDistanceKm = Number(
    (
      missDist +
      (relVel * (timeOffsetSeconds / 60) * 0.45)
    ).toFixed(2)
  );

  const isAtTca = Math.abs(timelineMinutes) < 1.0;
  const isPostTca = timelineMinutes > 0;

  const handleSelectScenario = (scen: ReplayScenario) => {
    setSelectedScenario(scen);
    setTimelineMinutes(-scen.initialTcaMinutes);
    setIsPlaying(false);
  };

  const handleResetTimeline = () => {
    setTimelineMinutes(-selectedScenario.initialTcaMinutes);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-5 text-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  Orbital Incident Reconstruction Console
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                  BLACK BOX TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Time-scrubbed trajectory telemetry and close-approach forensics for landmark on-orbit events
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

        {/* Scenario Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5 font-telemetry">
          {REPLAY_SCENARIOS.map((scen) => {
            const isSelected = selectedScenario.id === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className={`p-2.5 rounded-lg border text-left transition ${
                  isSelected
                    ? 'bg-[#0f172a] border-blue-500 ring-1 ring-blue-500'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{scen.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      scen.outcome === 'COLLISION'
                        ? 'bg-red-950 text-red-400 border border-red-800/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {scen.outcome === 'COLLISION' ? 'COLLISION' : 'AVOIDED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">{scen.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Replay Details Panel */}
        <div className="mt-3.5 p-3.5 rounded-lg bg-[#070b14] border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="text-sm font-bold font-telemetry text-slate-100">{selectedScenario.title}</div>
              <div className="text-xs text-slate-400 font-telemetry mt-0.5">
                {selectedScenario.primaryObject} ⇄ {selectedScenario.secondaryObject}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-telemetry">
              <div>Closure: <strong className="text-slate-200">{selectedScenario.relativeVelocityKmS} km/s</strong></div>
              <div>Min Dist: <strong className={selectedScenario.missDistanceKm === 0 ? 'text-red-400' : 'text-emerald-400'}>{selectedScenario.missDistanceKm} km</strong></div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-2.5 font-sans">
            {selectedScenario.description}
          </p>

          {/* Current Scrubbed Telemetry */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 text-center text-xs font-telemetry">
            <div className="p-2 rounded-lg bg-[#0b121e] border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Relative Separation</span>
              <span className={`text-sm font-bold ${currentDistanceKm < 2 ? 'text-red-400' : 'text-sky-400'}`}>
                {currentDistanceKm} km
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#0b121e] border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Relative Time to TCA</span>
              <span className={`text-sm font-bold ${isAtTca ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                {(timelineMinutes ?? 0) >= 0 ? `+${(timelineMinutes ?? 0).toFixed(1)}m` : `${(timelineMinutes ?? 0).toFixed(1)}m`}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#0b121e] border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Phase State</span>
              <span
                className={`text-xs font-bold ${
                  isAtTca
                    ? selectedScenario.outcome === 'COLLISION'
                      ? 'text-red-400'
                      : 'text-amber-400'
                    : isPostTca
                    ? 'text-slate-400'
                    : 'text-sky-400'
                }`}
              >
                {isAtTca
                  ? selectedScenario.outcome === 'COLLISION'
                    ? 'IMPACT DETONATION'
                    : 'CLOSEST CONJUNCTION'
                  : isPostTca
                  ? 'SEPARATION PHASE'
                  : 'APPROACH TRACK'}
              </span>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="mt-4 font-telemetry">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Approach (T - {selectedScenario.initialTcaMinutes}m)</span>
              <span className="text-amber-400 font-bold">Closest Approach (T = 0)</span>
              <span>Separation (T + 30m)</span>
            </div>
            <input
              type="range"
              min={-selectedScenario.initialTcaMinutes}
              max="30"
              step="0.5"
              value={timelineMinutes}
              onChange={(e) => setTimelineMinutes(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 accent-blue-500 rounded-sm cursor-pointer border border-slate-800"
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between mt-3.5 font-telemetry">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition border border-blue-400/30"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Hold' : 'Playback'}</span>
              </button>

              <button
                onClick={handleResetTimeline}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                title="Restart Replay"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Playback Rate:</span>
              {[0.5, 1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded transition ${
                    playbackSpeed === spd ? 'bg-blue-950 text-sky-400 border border-blue-700/50' : 'hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
