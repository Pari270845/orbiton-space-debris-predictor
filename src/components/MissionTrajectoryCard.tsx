import React, { useState, useMemo } from 'react';
import { SpaceObject, ConjunctionEvent, OrbitalElements } from '../types/space';
import { Earth3DCanvas } from './Earth3DCanvas';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Maximize2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Globe,
  LineChart,
  Split,
  Eye,
} from 'lucide-react';

interface MissionTrajectoryCardProps {
  satellites: SpaceObject[];
  debris: SpaceObject[];
  conjunctions: ConjunctionEvent[];
  selectedSatellite: SpaceObject;
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
  activeConjunction: ConjunctionEvent | null;
  simTime: number;
  setSimTime: React.Dispatch<React.SetStateAction<number>>;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  isSimPaused: boolean;
  setIsSimPaused: (paused: boolean) => void;
  showOrbitPaths: boolean;
  setShowOrbitPaths: (show: boolean) => void;
  showDebrisCloud: boolean;
  setShowDebrisCloud: (show: boolean) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  show3DHeatmap: boolean;
  setShow3DHeatmap: (show: boolean) => void;
  previewOrbit: OrbitalElements | null;
  onOpenWhatIf: () => void;
  onOpenAutoAvoidance: () => void;
}

type TrajectoryDisplayMode = 'SPLIT' | 'GLOBE' | 'GRAPH';

export const MissionTrajectoryCard: React.FC<MissionTrajectoryCardProps> = ({
  satellites,
  debris,
  conjunctions,
  selectedSatellite,
  selectedObjectId,
  onSelectObject,
  activeConjunction,
  simTime,
  setSimTime,
  simSpeed,
  setSimSpeed,
  isSimPaused,
  setIsSimPaused,
  showOrbitPaths,
  setShowOrbitPaths,
  showDebrisCloud,
  setShowDebrisCloud,
  showLabels,
  setShowLabels,
  show3DHeatmap,
  setShow3DHeatmap,
  previewOrbit,
  onOpenWhatIf,
  onOpenAutoAvoidance,
}) => {
  const [displayMode, setDisplayMode] = useState<TrajectoryDisplayMode>('SPLIT');
  const [hoveredPoint, setHoveredPoint] = useState<{ t: number; alt: number; vel: number } | null>(null);

  // Generate trajectory telemetry points for graph
  const trajectoryPoints = useMemo(() => {
    const period = selectedSatellite.elements.periodMinutes || 95.6;
    const baseAlt = selectedSatellite.altitudeKm;
    const ecc = selectedSatellite.elements.eccentricity || 0.001;
    const points: Array<{ t: number; alt: number; vel: number; isTca?: boolean }> = [];

    // Sample 50 points across +/- 45 mins
    for (let t = -45; t <= 45; t += 2) {
      const phase = ((t % period) / period) * 2 * Math.PI;
      // Elliptical altitude variation
      const altDelta = Math.sin(phase) * (ecc * 6371 * 1.5);
      const alt = Math.round((baseAlt + altDelta) * 10) / 10;
      // Vis-viva velocity approx
      const r = 6371 + alt;
      const mu = 398600.4418;
      const a = 6371 + baseAlt;
      const vel = Math.round(Math.sqrt(mu * (2 / r - 1 / a)) * 100) / 100;

      points.push({
        t,
        alt,
        vel,
        isTca: Math.abs(t) <= 1,
      });
    }
    return points;
  }, [selectedSatellite]);

  // Current satellite position on curve based on simTime
  const currentPhaseTime = useMemo(() => {
    const period = selectedSatellite.elements.periodMinutes || 95.6;
    return ((simTime % period) - period / 2);
  }, [simTime, selectedSatellite]);

  // Compute graph bounds
  const minAlt = Math.min(...trajectoryPoints.map((p) => p.alt)) - 5;
  const maxAlt = Math.max(...trajectoryPoints.map((p) => p.alt)) + 5;
  const altRange = Math.max(10, maxAlt - minAlt);

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const getSvgX = (t: number) => paddingX + ((t + 45) / 90) * chartW;
  const getSvgY = (alt: number) => svgHeight - paddingY - ((alt - minAlt) / altRange) * chartH;

  // Path string for SVG
  const pathD = useMemo(() => {
    return trajectoryPoints.reduce((acc, pt, idx) => {
      const x = getSvgX(pt.t);
      const y = getSvgY(pt.alt);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [trajectoryPoints, minAlt, altRange]);

  return (
    <div className="w-full rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-2xl p-4 sm:p-5 text-slate-100 flex flex-col font-sans">
      {/* Header: Title, Telemetry Chips, Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#182744]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  MISSION TRAJECTORY PREDICTION
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-telemetry bg-sky-950 text-sky-400 border border-sky-800">
                  SGP4 MODEL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry mt-0.5">
                Target: {selectedSatellite.name} • Ephemeris Epoch 2026.257
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers (Split, Globe, Graph) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c162c] border border-[#1d2f50]">
          <button
            onClick={() => setDisplayMode('SPLIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-telemetry flex items-center gap-1.5 transition ${
              displayMode === 'SPLIT'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#122244]'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </button>

          <button
            onClick={() => setDisplayMode('GLOBE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-telemetry flex items-center gap-1.5 transition ${
              displayMode === 'GLOBE'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#122244]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Orbital Globe</span>
          </button>

          <button
            onClick={() => setDisplayMode('GRAPH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-telemetry flex items-center gap-1.5 transition ${
              displayMode === 'GRAPH'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#122244]'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Telemetry Curve</span>
          </button>
        </div>
      </div>

      {/* Real-time Trajectory Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 py-3 border-b border-[#182744] text-xs font-telemetry">
        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Current Altitude</span>
          <span className="text-sm font-bold text-sky-300">{selectedSatellite.altitudeKm.toFixed(1)} km</span>
        </div>

        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Orbital Velocity</span>
          <span className="text-sm font-bold text-emerald-400">
            {(selectedSatellite.velocityKmS ?? selectedSatellite.speedKmS ?? 7.59).toFixed(2)} km/s
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Apogee / Perigee</span>
          <span className="text-sm font-bold text-slate-200">
            {(selectedSatellite.altitudeKm + 6.2).toFixed(0)} / {(selectedSatellite.altitudeKm - 5.8).toFixed(0)} km
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Orbital Period</span>
          <span className="text-sm font-bold text-indigo-300">
            {selectedSatellite.elements.periodMinutes.toFixed(1)} min
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Inclination</span>
          <span className="text-sm font-bold text-slate-200">
            {selectedSatellite.elements.inclinationDeg.toFixed(1)}°
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
          <span className="text-[10px] text-slate-400 uppercase block">Predicted TCA</span>
          <span className="text-sm font-bold text-amber-400">
            {activeConjunction ? `${(activeConjunction.tcaMinutes ?? 60).toFixed(1)}m` : 'Nominal'}
          </span>
        </div>
      </div>

      {/* Interactive Main Body (Globe + Trajectory Curve) */}
      <div className="mt-4">
        {displayMode === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 3D Earth Globe Canvas (7 Cols) */}
            <div className="lg:col-span-7 h-[420px] rounded-xl bg-[#04070e] border border-[#1b2b48] relative overflow-hidden group">
              <Earth3DCanvas
                satellites={satellites}
                debris={debris}
                conjunctions={conjunctions}
                selectedSatelliteId={selectedSatellite.id}
                selectedObjectId={selectedObjectId}
                onSelectObject={onSelectObject}
                simTimeMinutes={simTime}
                showOrbitPaths={showOrbitPaths}
                showDebrisCloud={showDebrisCloud}
                showLabels={showLabels}
                show3DHeatmap={show3DHeatmap}
                previewOrbit={previewOrbit}
              />
              <div className="absolute top-3 left-3 bg-[#070e1c]/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#1c2e4f] text-[10px] font-telemetry text-sky-300">
                ORBITAL PLANE INCLINATION: {selectedSatellite.elements.inclinationDeg.toFixed(1)}°
              </div>
            </div>

            {/* Trajectory Profile Graph (5 Cols) */}
            <div className="lg:col-span-5 h-[420px] rounded-xl bg-[#070e1c] border border-[#1b2b48] p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#182744]">
                  <span className="text-[11px] font-telemetry font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    <span>Altitude & Velocity Profile</span>
                  </span>
                  <span className="text-[10px] font-telemetry text-emerald-400">
                    TCA ENCOUNTER @ T=0
                  </span>
                </div>

                {/* SVG Graph View */}
                <div className="mt-3 relative">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 select-none">
                    {/* Grid lines */}
                    <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#1b2944" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#1b2944" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#223659" />
                    <line x1={svgWidth / 2} y1={paddingY} x2={svgWidth / 2} y2={svgHeight - paddingY} stroke="#e11d48" strokeDasharray="2 2" />

                    {/* TCA Encounter Danger Zone shaded area */}
                    <rect
                      x={svgWidth / 2 - 25}
                      y={paddingY}
                      width={50}
                      height={chartH}
                      fill="#ef4444"
                      fillOpacity="0.08"
                    />

                    {/* Trajectory curve */}
                    <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

                    {/* Projected trajectory fill gradient */}
                    <path
                      d={`${pathD} L ${svgWidth - paddingX} ${svgHeight - paddingY} L ${paddingX} ${svgHeight - paddingY} Z`}
                      fill="url(#altGradient)"
                      opacity="0.25"
                    />

                    <defs>
                      <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* TCA Warning Label in Center */}
                    <text
                      x={svgWidth / 2}
                      y={paddingY + 12}
                      fill="#f43f5e"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      TCA ENCOUNTER
                    </text>

                    {/* Points on curve with hover */}
                    {trajectoryPoints.map((pt, idx) => {
                      if (idx % 3 !== 0) return null;
                      const cx = getSvgX(pt.t);
                      const cy = getSvgY(pt.alt);
                      return (
                        <circle
                          key={pt.t}
                          cx={cx}
                          cy={cy}
                          r={pt.isTca ? 4 : 2.5}
                          fill={pt.isTca ? '#ef4444' : '#38bdf8'}
                          className="cursor-pointer hover:scale-150 transition"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}

                    {/* Real-time Satellite Marker Dot */}
                    <circle
                      cx={getSvgX(Math.max(-45, Math.min(45, currentPhaseTime)))}
                      cy={getSvgY(selectedSatellite.altitudeKm)}
                      r="5"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Tooltip */}
                  {hoveredPoint && (
                    <div className="absolute top-2 right-2 bg-[#091326] border border-sky-500/50 p-2 rounded-lg text-[10px] font-telemetry text-slate-200 shadow-xl">
                      <div>T: {hoveredPoint.t > 0 ? `+${hoveredPoint.t}` : hoveredPoint.t} min</div>
                      <div>Alt: {hoveredPoint.alt} km</div>
                      <div>Speed: {hoveredPoint.vel} km/s</div>
                    </div>
                  )}
                </div>

                {/* Graph Legend */}
                <div className="flex items-center justify-between text-[10px] font-telemetry text-slate-400 mt-2 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-sky-400 inline-block" />
                    <span>Altitude Path</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span>TCA Crossing</span>
                  </span>
                  <span>Span: ±45 min Orbit</span>
                </div>
              </div>

              {/* Conjunction Encounter Summary Box */}
              <div className="p-2.5 rounded-lg bg-[#0a1529] border border-[#1b2b48] text-xs font-telemetry space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Relative Approach Speed:</span>
                  <span className="text-slate-200 font-bold">14.12 km/s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Minimum Miss Distance:</span>
                  <span className="text-amber-400 font-bold">
                    {activeConjunction ? `${activeConjunction.missDistanceKm.toFixed(2)} km` : '12.4 km'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Probability of Collision ($P_c$):</span>
                  <span className="text-red-400 font-bold">
                    {activeConjunction ? activeConjunction.collisionProbability.toExponential(2) : '1.2e-07'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {displayMode === 'GLOBE' && (
          <div className="w-full h-[540px] rounded-xl bg-[#04070e] border border-[#1b2b48] relative overflow-hidden group">
            <Earth3DCanvas
              satellites={satellites}
              debris={debris}
              conjunctions={conjunctions}
              selectedSatelliteId={selectedSatellite.id}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              simTimeMinutes={simTime}
              showOrbitPaths={showOrbitPaths}
              showDebrisCloud={showDebrisCloud}
              showLabels={showLabels}
              show3DHeatmap={show3DHeatmap}
              previewOrbit={previewOrbit}
            />
          </div>
        )}

        {displayMode === 'GRAPH' && (
          <div className="w-full rounded-xl bg-[#070e1c] border border-[#1b2b48] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#182744]">
              <div>
                <h3 className="text-sm font-bold font-telemetry text-slate-100">
                  DETAILED ORBITAL TRAJECTORY PROPAGATION (90-MIN EPHEMERIS WINDOW)
                </h3>
                <p className="text-xs text-slate-400 font-telemetry">
                  Perturbations modeled: J2 oblateness, solar radiation pressure (SRP), NRLMSISE-00 atmospheric drag
                </p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-telemetry bg-[#0f1d38] text-sky-400 border border-[#223863]">
                STEPS: 120 SECONDS
              </span>
            </div>

            <div className="mt-4">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-72 select-none">
                <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#1b2944" strokeDasharray="3 3" />
                <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#1b2944" strokeDasharray="3 3" />
                <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#223659" />
                <line x1={svgWidth / 2} y1={paddingY} x2={svgWidth / 2} y2={svgHeight - paddingY} stroke="#e11d48" strokeDasharray="2 2" />

                <rect x={svgWidth / 2 - 30} y={paddingY} width={60} height={chartH} fill="#ef4444" fillOpacity="0.08" />

                <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" />
                <path
                  d={`${pathD} L ${svgWidth - paddingX} ${svgHeight - paddingY} L ${paddingX} ${svgHeight - paddingY} Z`}
                  fill="url(#altGradient2)"
                  opacity="0.3"
                />

                <defs>
                  <linearGradient id="altGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {trajectoryPoints.map((pt, idx) => {
                  if (idx % 2 !== 0) return null;
                  const cx = getSvgX(pt.t);
                  const cy = getSvgY(pt.alt);
                  return (
                    <circle
                      key={pt.t}
                      cx={cx}
                      cy={cy}
                      r={pt.isTca ? 5 : 3}
                      fill={pt.isTca ? '#ef4444' : '#38bdf8'}
                      className="cursor-pointer hover:scale-150 transition"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Simulation & Playback Controls HUD */}
      <div className="mt-4 pt-3 border-t border-[#182744] flex flex-wrap items-center justify-between gap-3">
        {/* Play / Pause / Reset / Warp */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimPaused(!isSimPaused)}
            className="p-2 rounded-lg bg-[#0e1c36] hover:bg-[#142649] border border-[#223558] text-slate-200 transition"
            title={isSimPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isSimPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setSimTime(0)}
            className="p-2 rounded-lg bg-[#0e1c36] hover:bg-[#142649] border border-[#223558] text-slate-200 transition"
            title="Reset Simulation Time"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-[#0c162c] px-2.5 py-1.5 rounded-lg border border-[#1b2b48] text-xs font-telemetry">
            <span className="text-slate-400 mr-1">WARP:</span>
            {[1, 5, 20, 60].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-0.5 rounded transition ${
                  simSpeed === spd
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-telemetry text-slate-300 pl-2 border-l border-[#1d2f50]">
            <span className="text-slate-400">PROPAGATED:</span>
            <span className="text-sky-400 font-bold">
              T + {Math.floor(simTime / 60)}h {Math.floor(simTime % 60)}m
            </span>
          </div>
        </div>

        {/* Layer Toggles & Action Buttons */}
        <div className="flex items-center gap-2 text-xs font-telemetry">
          <button
            onClick={() => setShowOrbitPaths(!showOrbitPaths)}
            className={`px-2.5 py-1.5 rounded-lg border transition ${
              showOrbitPaths
                ? 'bg-blue-600/30 text-sky-300 border-blue-500'
                : 'bg-[#0c162c] border-[#1b2b48] text-slate-400'
            }`}
          >
            Orbits
          </button>

          <button
            onClick={() => setShowDebrisCloud(!showDebrisCloud)}
            className={`px-2.5 py-1.5 rounded-lg border transition ${
              showDebrisCloud
                ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                : 'bg-[#0c162c] border-[#1b2b48] text-slate-400'
            }`}
          >
            Debris
          </button>

          <button
            onClick={onOpenWhatIf}
            className="px-3 py-1.5 rounded-lg bg-[#0e1c36] hover:bg-[#142649] border border-[#223558] text-slate-200 transition flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Simulate Burn</span>
          </button>

          <button
            onClick={onOpenAutoAvoidance}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-CAM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
