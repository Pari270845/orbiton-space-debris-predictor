import React, { useState, useEffect, useRef } from 'react';
import { SpaceObject, ConjunctionEvent, LeaderboardEntry } from '../types/space';
import { soundEngine } from '../utils/audioAlerts';
import confetti from 'canvas-confetti';
import { X, Gamepad2, ShieldAlert, ShieldCheck, Flame, Zap, Trophy, AlertTriangle, RefreshCw, Heart, Fuel } from 'lucide-react';

interface MissionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  satellite: SpaceObject;
  onSaveScore: (entry: Omit<LeaderboardEntry, 'id' | 'rank' | 'date'>) => void;
}

interface ThreatWave {
  id: number;
  debrisName: string;
  type: string;
  closureSpeedKmS: number;
  initialMissKm: number;
  tcaSeconds: number;
  riskScore: number;
}

const MISSION_WAVES: ThreatWave[] = [
  {
    id: 1,
    debrisName: 'Cosmos-2251 Frag #1128',
    type: 'Shrapnel',
    closureSpeedKmS: 12.4,
    initialMissKm: 0.38,
    tcaSeconds: 22,
    riskScore: 92,
  },
  {
    id: 2,
    debrisName: 'Zenit-2 Upper Stage SL-16',
    type: 'Rocket Body (8.2 tons)',
    closureSpeedKmS: 11.2,
    initialMissKm: 0.85,
    tcaSeconds: 20,
    riskScore: 88,
  },
  {
    id: 3,
    debrisName: 'Fengyun-1C Kinetic Frag #481',
    type: 'Titanium Shrapnel',
    closureSpeedKmS: 14.6,
    initialMissKm: 0.22,
    tcaSeconds: 18,
    riskScore: 97,
  },
  {
    id: 4,
    debrisName: 'Cosmos-1408 ASAT Fragment #904',
    type: 'High-Density Fragment',
    closureSpeedKmS: 13.1,
    initialMissKm: 0.44,
    tcaSeconds: 16,
    riskScore: 94,
  },
  {
    id: 5,
    debrisName: 'Envisat Secondary Debris Cloud',
    type: 'Multi-Object Cluster',
    closureSpeedKmS: 15.2,
    initialMissKm: 0.15,
    tcaSeconds: 15,
    riskScore: 99,
  },
];

export const MissionModeModal: React.FC<MissionModeModalProps> = ({
  isOpen,
  onClose,
  satellite,
  onSaveScore,
}) => {
  const [waveIndex, setWaveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [fuelKg, setFuelKg] = useState(38.0);
  const [evadedCount, setEvadedCount] = useState(0);
  const [missionLog, setMissionLog] = useState<string[]>([
    'MISSION STARTED: Defend Orbiton Sentinel-4 through active Kessler debris corridors.',
  ]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [callsign, setCallsign] = useState('Commander_V');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  const currentWave = MISSION_WAVES[waveIndex];

  // Game timer loop
  useEffect(() => {
    if (!isOpen || isGameOver || isSuccess) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Time expired without avoidance: Collision impact!
          handleCollisionImpact();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, waveIndex, isGameOver, isSuccess]);

  const handleCollisionImpact = () => {
    soundEngine.playCriticalAlert();
    const damage = Math.round(35 + Math.random() * 25);
    const newHealth = Math.max(0, health - damage);
    setHealth(newHealth);

    const logEntry = `CRITICAL IMPACT: ${currentWave?.debrisName} collided! Structural hull damaged (-${damage}%).`;
    setMissionLog((prev) => [logEntry, ...prev]);

    if (newHealth <= 0) {
      setIsGameOver(true);
    } else {
      nextWave();
    }
  };

  const nextWave = () => {
    if (waveIndex + 1 < MISSION_WAVES.length) {
      setWaveIndex((prev) => prev + 1);
      setSecondsLeft(MISSION_WAVES[waveIndex + 1].tcaSeconds);
    } else {
      // Mission Complete!
      setIsSuccess(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      soundEngine.playSuccessChime();
    }
  };

  const executeManeuver = (type: 'PROGRADE' | 'RETROGRADE' | 'RADIAL_BURST') => {
    soundEngine.playThrusterBurn();

    let cost = 2.4;
    let separationBoost = 18.2;
    let pts = 650;

    if (type === 'PROGRADE') {
      cost = 2.1;
      separationBoost = 16.4;
      pts = 600;
    } else if (type === 'RETROGRADE') {
      cost = 1.9;
      separationBoost = 15.1;
      pts = 620;
    } else if (type === 'RADIAL_BURST') {
      cost = 3.6;
      separationBoost = 24.5;
      pts = 750;
    }

    if (fuelKg < cost) {
      setMissionLog((prev) => ['ERROR: Insufficient fuel for thruster burn!', ...prev]);
      return;
    }

    const newFuel = Math.max(0, fuelKg - cost);
    setFuelKg(newFuel);
    const earnedScore = pts + Math.round(secondsLeft * 25);
    setScore((prev) => prev + earnedScore);
    setEvadedCount((prev) => prev + 1);

    const logEntry = `SUCCESSFUL CAM: Executed ${type} burn. Separated by +${(separationBoost ?? 0).toFixed(1)} km. Earned +${earnedScore} pts.`;
    setMissionLog((prev) => [logEntry, ...prev]);

    nextWave();
  };

  const handleSaveToLeaderboard = () => {
    onSaveScore({
      callsign: callsign || 'Anonymous_Pilot',
      score,
      avoidancesCount: evadedCount,
      fuelSavedPercent: Math.round((fuelKg / 38.0) * 100),
      avgMissDistanceKm: 21.4,
      badge: isSuccess ? 'Kessler Shield Master' : 'Orbital Sentinel',
    });
    setHasSavedScore(true);
  };

  const handleRestart = () => {
    setWaveIndex(0);
    setSecondsLeft(MISSION_WAVES[0].tcaSeconds);
    setScore(0);
    setHealth(100);
    setFuelKg(38.0);
    setEvadedCount(0);
    setIsGameOver(false);
    setIsSuccess(false);
    setHasSavedScore(false);
    setMissionLog(['MISSION RESTARTED: Defend Sentinel-4.']);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-5 text-slate-100 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  Operation Orbiton: Orbital Defense Simulator
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-telemetry bg-slate-800 text-slate-300 border border-slate-700">
                  SIMULATION EXERCISE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Mission Flight Director console: Command reactive thruster burns to navigate dense orbital debris clouds
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

        {/* Top Status Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 font-telemetry">
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">MISSION SCORE</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">HULL INTEGRITY</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-emerald-400">
              <Heart className={`w-3.5 h-3.5 ${health < 40 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
              <span>{health}%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">PROPELLANT</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-sky-400">
              <Fuel className="w-3.5 h-3.5 text-sky-400" />
              <span>{(fuelKg ?? 0).toFixed(1)} kg</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">THREAT CORRIDOR</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-slate-200">
              <span>{Math.min(waveIndex + 1, MISSION_WAVES.length)} / {MISSION_WAVES.length}</span>
            </div>
          </div>
        </div>

        {/* Active Wave Alert Box or Victory / Defeat screen */}
        {isGameOver ? (
          <div className="mt-4 p-5 rounded-lg bg-[#180a0a] border border-red-900/60 text-center font-telemetry">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-red-300 uppercase">Satellite Destroyed in Orbit</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 font-sans">
              Catastrophic impact breached primary structural frame. Total mission score: {score.toLocaleString()} pts.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Initialize Simulation
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="mt-4 p-5 rounded-lg bg-[#091510] border border-emerald-800/60 text-center font-telemetry">
            <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-emerald-300 uppercase">Mission Objective Achieved: Orbit Clear</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 font-sans">
              All 5 high-threat conjunction corridors cleared with {health}% health and {(fuelKg ?? 0).toFixed(1)} kg propellant remaining.
            </p>

            {/* Save score prompt */}
            {!hasSavedScore ? (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Enter Callsign"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-xs text-slate-100 font-telemetry w-full sm:w-auto"
                />
                <button
                  onClick={handleSaveToLeaderboard}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition border border-blue-400/40 whitespace-nowrap"
                >
                  Record Score ({score} pts)
                </button>
              </div>
            ) : (
              <div className="mt-4 text-xs font-bold text-emerald-400 font-telemetry">
                ✓ Recorded in Operations Registry
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-[#070b14] border border-red-900/40 relative overflow-hidden font-telemetry">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs uppercase font-bold text-red-400 tracking-wider">
                    Wave {waveIndex + 1} Target: {currentWave.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 mt-1">{currentWave.debrisName}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Speed: <strong className="text-slate-200">{currentWave.closureSpeedKmS} km/s</strong></span>
                  <span>•</span>
                  <span>Miss: <strong className="text-red-400 font-bold">{currentWave.initialMissKm} km</strong></span>
                  <span>•</span>
                  <span>Risk: <strong className="text-red-400 font-bold">{currentWave.riskScore}/100</strong></span>
                </div>
              </div>

              {/* Ticking countdown */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">TCA Countdown</span>
                <span className={`text-xl font-bold font-telemetry ${secondsLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-300'}`}>
                  T - 00:{String(secondsLeft).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {/* Thruster Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 font-sans">
              <button
                id="btn-mission-prograde"
                onClick={() => executeManeuver('PROGRADE')}
                className="p-3 rounded-lg bg-[#0b121e] hover:bg-slate-900 border border-slate-800 hover:border-blue-500 transition text-left group"
              >
                <div className="flex items-center justify-between font-telemetry">
                  <span className="text-xs font-bold text-sky-300">Prograde Burn</span>
                  <Flame className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Raises apoapsis. Extends crossing orbit timeline.</p>
                <div className="text-[10px] font-telemetry text-slate-500 mt-2 flex justify-between">
                  <span>Cost: 2.1 kg</span>
                  <span className="text-emerald-400">+600 pts</span>
                </div>
              </button>

              <button
                id="btn-mission-retrograde"
                onClick={() => executeManeuver('RETROGRADE')}
                className="p-3 rounded-lg bg-[#0b121e] hover:bg-slate-900 border border-slate-800 hover:border-amber-500 transition text-left group"
              >
                <div className="flex items-center justify-between font-telemetry">
                  <span className="text-xs font-bold text-amber-300">Retrograde Decel</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Lowers periapsis altitude below fragment intersection.</p>
                <div className="text-[10px] font-telemetry text-slate-500 mt-2 flex justify-between">
                  <span>Cost: 1.9 kg</span>
                  <span className="text-emerald-400">+620 pts</span>
                </div>
              </button>

              <button
                id="btn-mission-radial"
                onClick={() => executeManeuver('RADIAL_BURST')}
                className="p-3 rounded-lg bg-[#0b121e] hover:bg-slate-900 border border-slate-800 hover:border-blue-500 transition text-left group"
              >
                <div className="flex items-center justify-between font-telemetry">
                  <span className="text-xs font-bold text-slate-200">Radial Orthogonal</span>
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">High-deflection burn across encounter normal plane.</p>
                <div className="text-[10px] font-telemetry text-slate-500 mt-2 flex justify-between">
                  <span>Cost: 3.6 kg</span>
                  <span className="text-emerald-400">+750 pts</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Mission Event Telemetry Log */}
        <div className="mt-4 p-3 rounded-lg bg-[#070b14] border border-slate-800 font-telemetry">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Operational Telemetry Log
          </span>
          <div className="space-y-1 max-h-24 overflow-y-auto text-[11px]">
            {missionLog.map((log, idx) => (
              <div key={idx} className="text-slate-300 border-l border-blue-500/60 pl-2">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
