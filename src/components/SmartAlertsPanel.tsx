import React, { useState } from 'react';
import { SpaceAlert } from '../types/space';
import { soundEngine } from '../utils/audioAlerts';
import { Bell, AlertTriangle, ShieldCheck, Volume2, VolumeX, Sliders, CheckCircle, Trash2, X } from 'lucide-react';

interface SmartAlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SpaceAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
  riskThreshold: number;
  onChangeRiskThreshold: (val: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SmartAlertsPanel: React.FC<SmartAlertsPanelProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledgeAlert,
  onClearAllAlerts,
  riskThreshold,
  onChangeRiskThreshold,
  soundEnabled,
  onToggleSound,
}) => {
  const [missThresholdKm, setMissThresholdKm] = useState(5.0);

  if (!isOpen) return null;

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-5 text-slate-100 overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                  Conjunction Alert Center
                </h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-telemetry bg-red-950 text-red-400 border border-red-700/50">
                    {unreadCount} UNACKNOWLEDGED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-telemetry">
                Threshold dispatch matrix & acoustic collision alarm telemetry
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

        {/* Threshold Configuration Controls */}
        <div className="mt-3.5 p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-2.5 font-telemetry">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Collision Risk Trigger Threshold</span>
            </span>
            <span className="text-xs font-bold text-amber-400">
              ≥ {riskThreshold} / 100
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            step="5"
            value={riskThreshold}
            onChange={(e) => onChangeRiskThreshold(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-sm cursor-pointer border border-slate-800"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Acoustic Klaxon Siren:</span>
              <span className={`font-bold ${soundEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {soundEnabled ? 'ARMED' : 'MUTED'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playCriticalAlert();
                }}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
              >
                Test Klaxon
              </button>
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg border transition ${
                  soundEnabled
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 font-telemetry">
          <span>Active Conjunction Log ({alerts.length})</span>
          {alerts.length > 0 && (
            <button
              onClick={onClearAllAlerts}
              className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge History</span>
            </button>
          )}
        </div>

        <div className="mt-2 flex-1 overflow-y-auto space-y-2 pr-1">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-telemetry">
              <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              NO CONJUNCTION THREATS DETECTED ABOVE THRESHOLD
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 rounded-lg border transition flex items-start justify-between gap-3 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-[#150a0a] border-red-900/60'
                    : alert.severity === 'WARNING'
                    ? 'bg-[#150f08] border-amber-900/60'
                    : 'bg-[#070b14] border-slate-800'
                } ${alert.acknowledged ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-1.5 rounded mt-0.5 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-telemetry text-slate-100">{alert.title}</span>
                      <span className="text-[10px] font-telemetry text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">{alert.message}</p>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="shrink-0 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-800 transition font-telemetry flex items-center gap-1"
                    title="Acknowledge Alert"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ACK</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
