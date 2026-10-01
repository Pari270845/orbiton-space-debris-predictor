import React, { useState } from 'react';
import { LeaderboardEntry } from '../types/space';
import { X, Trophy, Medal, Award, Fuel, ShieldCheck, Search } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = entries.filter((e) =>
    e.callsign.toLowerCase().includes(search.toLowerCase()) ||
    e.badge.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0b121e] border border-slate-800 shadow-2xl p-5 text-slate-100 overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/40 text-sky-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-telemetry tracking-wide text-slate-100 uppercase">
                Flight Operations Commendation Registry
              </h2>
              <p className="text-xs text-slate-400 font-telemetry">
                Performance evaluations across collision avoidance maneuvers, delta-v efficiency, and clearance margins
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

        {/* Search */}
        <div className="mt-3.5 relative font-telemetry">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by flight callsign or rating..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-lg bg-[#070b14] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 font-telemetry">
          {filtered.map((item, idx) => {
            const isTop3 = item.rank <= 3;
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition ${
                  isTop3
                    ? 'bg-[#0f172a] border-blue-600/50 shadow-sm'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 flex items-center justify-center font-bold text-xs">
                    {item.rank === 1 ? (
                      <Medal className="w-4 h-4 text-amber-400" />
                    ) : item.rank === 2 ? (
                      <Medal className="w-4 h-4 text-slate-300" />
                    ) : item.rank === 3 ? (
                      <Medal className="w-4 h-4 text-amber-600" />
                    ) : (
                      <span className="text-slate-500">#{item.rank}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{item.callsign}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-sky-400 border border-slate-700">
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{item.avoidancesCount} CAMs</span>
                      <span>•</span>
                      <span>{item.fuelSavedPercent}% Δv Saved</span>
                      <span>•</span>
                      <span>{item.avgMissDistanceKm} km Avg Clear</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-amber-400">
                    {item.score.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-telemetry">
          <span>Telemetry score log: Synchronized</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-800 font-telemetry"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
