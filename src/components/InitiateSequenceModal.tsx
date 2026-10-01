import React, { useState, useEffect } from 'react';
import { SpaceObject, ConjunctionEvent } from '../types/space';
import { soundEngine } from '../utils/audioAlerts';
import {
  Flame,
  X,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Fuel,
  Activity,
  Zap,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface InitiateSequenceModalProps {
  satellite: SpaceObject;
  activeConjunction: ConjunctionEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSequenceComplete: (result: { deltaVApplied: number; fuelUsedKg: number; newAltitudeKm: number }) => void;
}

type SequenceStage = 'IDLE' | 'ALIGNMENT' | 'PRESSURIZATION' | 'GUIDANCE_LOCK' | 'IGNITION' | 'BURNING' | 'COMPLETED' | 'ABORTED';

export const InitiateSequenceModal: React.FC<InitiateSequenceModalProps> = ({
  satellite,
  activeConjunction,
  isOpen,
  onClose,
  onSequenceComplete,
}) => {
  const [stage, setStage] = useState<SequenceStage>('IDLE');
  const [countdown, setCountdown] = useState<number>(10);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [thrustN, setThrustN] = useState<number>(0);
  const [chamberPressureMpa, setChamberPressureMpa] = useState<number>(0.2);
  const [deltaVAccumulated, setDeltaVAccumulated] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('IDLE');
      setCountdown(10);
      setBurnProgress(0);
      setThrustN(0);
      setChamberPressureMpa(0.2);
      setDeltaVAccumulated(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  // Sequence runner timer
  useEffect(() => {
    if (!isOpen || isPaused || stage === 'IDLE' || stage === 'COMPLETED' || stage === 'ABORTED') {
      return;
    }

    const timer = setInterval(() => {
      if (stage === 'ALIGNMENT') {
        setCountdown((c) => {
          if (c <= 7) {
            setStage('PRESSURIZATION');
            soundEngine.playRadarPing();
            return 7;
          }
          return c - 1;
        });
      } else if (stage === 'PRESSURIZATION') {
        setChamberPressureMpa((p) => Math.min(2.42, p + 0.5));
        setCountdown((c) => {
          if (c <= 4) {
            setStage('GUIDANCE_LOCK');
            soundEngine.playRadarPing();
            return 4;
          }
          return c - 1;
        });
      } else if (stage === 'GUIDANCE_LOCK') {
        setCountdown((c) => {
          if (c <= 1) {
            setStage('IGNITION');
            setThrustN(220);
            soundEngine.playCriticalAlert();
            return 0;
          }
          return c - 1;
        });
      } else if (stage === 'IGNITION') {
        setStage('BURNING');
      } else if (stage === 'BURNING') {
        setBurnProgress((p) => {
          const next = p + 5;
          const currentDv = (next / 100) * 14.8;
          setDeltaVAccumulated(parseFloat(currentDv.toFixed(2)));
          if (next >= 100) {
            setStage('COMPLETED');
            setThrustN(0);
            soundEngine.playSuccessChime();
            return 100;
          }
          return next;
        });
      }
    }, 400);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, stage]);

  if (!isOpen) return null;

  const handleStartSequence = () => {
    setStage('ALIGNMENT');
    soundEngine.playSuccessChime();
  };

  const handleAbort = () => {
    setStage('ABORTED');
    setThrustN(0);
    soundEngine.playCriticalAlert();
  };

  const handleConfirmCompletion = () => {
    onSequenceComplete({
      deltaVApplied: deltaVAccumulated || 14.8,
      fuelUsedKg: 2.1,
      newAltitudeKm: satellite.altitudeKm + 8.5,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#091122] border border-[#223558] shadow-2xl p-5 text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2b48]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  ORBITAL MANEUVER & INJECTION SEQUENCE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-telemetry bg-amber-950 text-amber-400 border border-amber-800">
                  {stage}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Target: {satellite.name} • NORAD #{satellite.catalogNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0e1c36] hover:bg-[#142649] text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Sequence Status Box */}
        <div className="mt-4 p-4 rounded-xl bg-[#0c162c] border border-[#1d2f50] text-center relative overflow-hidden">
          <div className="text-[11px] font-telemetry text-slate-400 uppercase tracking-widest">
            {stage === 'IDLE' && 'ARMED — READY TO COMMENCE TIMED LAUNCH / BURN SEQUENCE'}
            {stage === 'ALIGNMENT' && 'STAGE 1: 3-AXIS ATTITUDE INERTIAL HOLD VERIFICATION'}
            {stage === 'PRESSURIZATION' && 'STAGE 2: PROPELLANT TANK PRESSURIZATION & INLET VALVES OPEN'}
            {stage === 'GUIDANCE_LOCK' && 'STAGE 3: ORBITAL TRAJECTORY VECTOR CALCULATED & LOCKED'}
            {stage === 'IGNITION' && 'STAGE 4: PRIMARY THRUSTER MAIN IGNITION'}
            {stage === 'BURNING' && 'STAGE 5: CONTINUOUS DELTA-V ACCELERATION IN PROGRESS'}
            {stage === 'COMPLETED' && 'SEQUENCE COMPLETE — ORBITAL INJECTION SUCCESSFUL'}
            {stage === 'ABORTED' && 'SEQUENCE ABORTED BY FLIGHT DIRECTOR'}
          </div>

          {/* Large Countdown or Progress */}
          <div className="my-3 flex items-center justify-center gap-4">
            {stage === 'IDLE' && (
              <div className="text-4xl font-bold font-telemetry text-amber-400 tracking-tight">
                T - 00:10.0
              </div>
            )}
            {(stage === 'ALIGNMENT' || stage === 'PRESSURIZATION' || stage === 'GUIDANCE_LOCK') && (
              <div className="text-5xl font-black font-telemetry text-sky-400 animate-pulse">
                T - 00:0{countdown}.0
              </div>
            )}
            {(stage === 'IGNITION' || stage === 'BURNING') && (
              <div className="text-4xl font-bold font-telemetry text-amber-400">
                BURN: {burnProgress}%
              </div>
            )}
            {stage === 'COMPLETED' && (
              <div className="text-3xl font-bold font-telemetry text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                <span>TRAJECTORY NOMINAL</span>
              </div>
            )}
            {stage === 'ABORTED' && (
              <div className="text-3xl font-bold font-telemetry text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                <span>MANEUVER ABORTED</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#080e1c] h-2 rounded-full overflow-hidden border border-[#182642]">
            <div
              className={`h-full transition-all duration-300 ${
                stage === 'COMPLETED'
                  ? 'bg-emerald-400'
                  : stage === 'ABORTED'
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-amber-500 to-sky-400'
              }`}
              style={{
                width: `${
                  stage === 'IDLE'
                    ? 0
                    : stage === 'COMPLETED'
                    ? 100
                    : stage === 'BURNING'
                    ? burnProgress
                    : ((10 - countdown) / 10) * 50
                }%`,
              }}
            />
          </div>
        </div>

        {/* Telemetry Readouts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs font-telemetry">
          <div className="p-3 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 block uppercase">Thrust Output</span>
            <span className="text-base font-bold text-amber-400">{thrustN} N</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 block uppercase">Chamber Pressure</span>
            <span className="text-base font-bold text-sky-400">{chamberPressureMpa.toFixed(2)} MPa</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 block uppercase">ΔV Applied</span>
            <span className="text-base font-bold text-emerald-400">+{deltaVAccumulated} m/s</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c162c] border border-[#1b2b48]">
            <span className="text-[10px] text-slate-400 block uppercase">Orbit Apogee Shift</span>
            <span className="text-base font-bold text-slate-200">
              +{((deltaVAccumulated / 14.8) * 8.5).toFixed(1)} km
            </span>
          </div>
        </div>

        {/* Checklist Steps */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#081020] border border-[#192742] space-y-2 text-xs font-telemetry">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
            Flight Telemetry Verification Checklist
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>1. Inertial Gyroscope & Reaction Wheels Locked</span>
            </span>
            <span className={stage !== 'IDLE' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {stage !== 'IDLE' ? 'PASSED' : 'PENDING'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Propellant Isolation Valves Opened & Pressurized</span>
            </span>
            <span
              className={
                stage === 'PRESSURIZATION' || stage === 'GUIDANCE_LOCK' || stage === 'IGNITION' || stage === 'BURNING' || stage === 'COMPLETED'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-500'
              }
            >
              {stage === 'IDLE' || stage === 'ALIGNMENT' ? 'PENDING' : 'PASSED'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>3. Ground Station Uplink & SGP4 Trajectory Injection Validated</span>
            </span>
            <span
              className={
                stage === 'GUIDANCE_LOCK' || stage === 'IGNITION' || stage === 'BURNING' || stage === 'COMPLETED'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-500'
              }
            >
              {stage === 'COMPLETED' || stage === 'BURNING' || stage === 'IGNITION' || stage === 'GUIDANCE_LOCK' ? 'PASSED' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Actions Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-[#1b2b48] flex items-center justify-between gap-3">
          {stage === 'IDLE' ? (
            <>
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-[#0e1c36] hover:bg-[#142649] text-slate-400 text-xs font-telemetry transition"
              >
                Cancel
              </button>

              <button
                onClick={handleStartSequence}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs font-telemetry tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>CONFIRM & EXECUTE INITIATE SEQUENCE</span>
              </button>
            </>
          ) : stage === 'COMPLETED' ? (
            <button
              onClick={handleConfirmCompletion}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-telemetry tracking-wider uppercase shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <span>APPLY TRAJECTORY UPDATE TO FLEET</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : stage === 'ABORTED' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#0e1c36] hover:bg-[#142649] text-slate-400 text-xs font-telemetry transition"
              >
                Close Window
              </button>
              <button
                onClick={() => setStage('IDLE')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-telemetry transition flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sequence</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAbort}
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/60 text-red-400 hover:text-red-300 font-bold text-xs font-telemetry tracking-wider uppercase transition flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>ABORT SEQUENCE</span>
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-4 py-2 rounded-lg bg-[#0e1c36] hover:bg-[#142649] border border-[#223558] text-slate-200 text-xs font-telemetry transition flex items-center gap-2"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? 'Resume Count' : 'Hold Count'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
