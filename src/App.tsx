import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SpaceObject,
  ConjunctionEvent,
  OrbitalElements,
  LeaderboardEntry,
  SpaceAlert,
  AvoidanceBurn,
} from './types/space';
import {
  INITIAL_SATELLITES,
  INITIAL_DEBRIS,
  INITIAL_CONJUNCTIONS,
  INITIAL_LEADERBOARD,
  INITIAL_ALERTS,
} from './data/spaceCatalog';
import { soundEngine } from './utils/audioAlerts';

// Layout & Section Components
import { Sidebar, NavSection } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { MissionTrajectoryCard } from './components/MissionTrajectoryCard';
import { PropulsionSystemsCard } from './components/PropulsionSystemsCard';
import { EnvironmentalControlsCard } from './components/EnvironmentalControlsCard';
import { ConjunctionThreatRadarCard } from './components/ConjunctionThreatRadarCard';

// Modal & Additional Tool Components
import { InitiateSequenceModal } from './components/InitiateSequenceModal';
import { ConjunctionAlertBar } from './components/ConjunctionAlertBar';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { AutoAvoidanceModal } from './components/AutoAvoidanceModal';
import { ExplainablePredictionModal } from './components/ExplainablePredictionModal';
import { DebrisHeatmapView } from './components/DebrisHeatmapView';
import { SatelliteHealthDashboard } from './components/SatelliteHealthDashboard';
import { MissionModeModal } from './components/MissionModeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { IncidentReplayModal } from './components/IncidentReplayModal';
import { SmartAlertsPanel } from './components/SmartAlertsPanel';
import { RiskScoreBadge } from './components/RiskScoreBadge';

// Icons
import {
  Shield,
  Menu,
  X,
  AlertTriangle,
  ChevronRight,
  Flame,
  Thermometer,
  Layers,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // State: Objects
  const [satellites, setSatellites] = useState<SpaceObject[]>(INITIAL_SATELLITES);
  const [debris, setDebris] = useState<SpaceObject[]>(INITIAL_DEBRIS);
  const [selectedSatellite, setSelectedSatellite] = useState<SpaceObject>(INITIAL_SATELLITES[0]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(INITIAL_SATELLITES[0].id);

  // State: Conjunctions
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>(INITIAL_CONJUNCTIONS);

  // State: Leaderboard & Alerts
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [alerts, setAlerts] = useState<SpaceAlert[]>(INITIAL_ALERTS);
  const [riskThreshold, setRiskThreshold] = useState<number>(60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // State: Navigation Section
  const [activeSection, setActiveSection] = useState<NavSection>('OVERVIEW');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State: Simulation Controls
  const [simTime, setSimTime] = useState<number>(0); // in minutes
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 20x, 60x
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);

  // State: 3D Visualization Toggles
  const [showOrbitPaths, setShowOrbitPaths] = useState<boolean>(true);
  const [showDebrisCloud, setShowDebrisCloud] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [show3DHeatmap, setShow3DHeatmap] = useState<boolean>(false);
  const [previewOrbit, setPreviewOrbit] = useState<OrbitalElements | null>(null);

  // State: Modals
  const [isInitiateSequenceOpen, setIsInitiateSequenceOpen] = useState<boolean>(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isAutoAvoidOpen, setIsAutoAvoidOpen] = useState<boolean>(false);
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isMissionOpen, setIsMissionOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find active conjunction for the currently selected satellite
  const activeConjunction = useMemo(() => {
    const list = conjunctions.filter(
      (c) =>
        (c.primaryObjectId === selectedSatellite.id || c.secondaryObjectId === selectedSatellite.id) &&
        c.status === 'ACTIVE'
    );
    if (list.length === 0) return conjunctions[0] || null;
    return [...list].sort((a, b) => b.collisionRiskScore - a.collisionRiskScore)[0];
  }, [conjunctions, selectedSatellite.id]);

  // Handle sound mute/unmute
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setMuted(!next);
  };

  // Main simulation tick loop
  useEffect(() => {
    if (isSimPaused) return;

    const interval = setInterval(() => {
      setSimTime((prev) => prev + (0.1 * simSpeed));
    }, 100);

    return () => clearInterval(interval);
  }, [isSimPaused, simSpeed]);

  // Check alert thresholds when active conjunction risk changes
  useEffect(() => {
    if (!activeConjunction) return;

    if (activeConjunction.collisionRiskScore >= riskThreshold) {
      setAlerts((prev) => {
        const existingAlert = prev.find(
          (a) => a.conjunctionId === activeConjunction.id && !a.acknowledged
        );
        if (existingAlert) return prev;

        if (soundEnabled) {
          soundEngine.playCriticalAlert();
        }
        const newAlert: SpaceAlert = {
          id: `alert-${Date.now()}`,
          conjunctionId: activeConjunction.id,
          timestamp: Date.now(),
          title: `Collision Risk Alert: ${activeConjunction.primaryObjectName}`,
          severity: activeConjunction.collisionRiskScore >= 80 ? 'CRITICAL' : 'WARNING',
          message: `High collision risk (${activeConjunction.collisionRiskScore}/100) detected between ${activeConjunction.primaryObjectName} and ${activeConjunction.secondaryObjectName}!`,
          acknowledged: false,
        };
        return [newAlert, ...prev];
      });
    }
  }, [activeConjunction, riskThreshold, soundEnabled]);

  // Handle sequence completion (from INITIATE SEQUENCE)
  const handleSequenceComplete = (result: {
    deltaVApplied: number;
    fuelUsedKg: number;
    newAltitudeKm: number;
  }) => {
    setSatellites((prev) =>
      prev.map((sat) => {
        if (sat.id === selectedSatellite.id) {
          const updatedFuel = Math.max(0, (sat.fuelKg || 0) - result.fuelUsedKg);
          const updatedDeltaV = Math.max(0, (sat.deltaVAvailableMS || 0) - result.deltaVApplied);
          return {
            ...sat,
            altitudeKm: parseFloat(result.newAltitudeKm.toFixed(1)),
            fuelKg: parseFloat(updatedFuel.toFixed(1)),
            deltaVAvailableMS: parseFloat(updatedDeltaV.toFixed(1)),
          };
        }
        return sat;
      })
    );

    // Mitigate active conjunction
    if (activeConjunction) {
      setConjunctions((prev) =>
        prev.map((c) => {
          if (c.id === activeConjunction.id) {
            return {
              ...c,
              status: 'MITIGATED',
              missDistanceKm: c.missDistanceKm + 8.4,
              collisionRiskScore: Math.max(4, Math.round(c.collisionRiskScore * 0.1)),
            };
          }
          return c;
        })
      );
    }

    showToast(`Sequence Nominal! Orbital Altitude raised to ${result.newAltitudeKm.toFixed(1)} km. Collision threat cleared.`);
  };

  // Execute What-If burn into state
  const handleApplyBurn = (burn: AvoidanceBurn) => {
    setSatellites((prev) =>
      prev.map((sat) => {
        if (sat.id === selectedSatellite.id) {
          const updatedFuel = Math.max(0, (sat.fuelKg || 0) - burn.fuelCostKg);
          const updatedDeltaV = Math.max(0, (sat.deltaVAvailableMS || 0) - burn.deltaVMS);
          return {
            ...sat,
            fuelKg: updatedFuel,
            deltaVAvailableMS: updatedDeltaV,
          };
        }
        return sat;
      })
    );

    if (activeConjunction) {
      setConjunctions((prev) =>
        prev.map((c) => {
          if (c.id === activeConjunction.id) {
            return {
              ...c,
              status: 'MITIGATED',
              missDistanceKm: burn.newMissDistanceKm,
              collisionRiskScore: burn.newRiskScore,
            };
          }
          return c;
        })
      );
    }

    showToast(`Planned Burn Executed: Risk reduced to ${burn.newRiskScore}/100.`);
    soundEngine.playSuccessChime();
  };

  // Execute CAM (Auto Avoidance)
  const handleExecuteAutoAvoidance = (burn: AvoidanceBurn) => {
    setSatellites((prev) =>
      prev.map((sat) => {
        if (sat.id === selectedSatellite.id) {
          const updatedFuel = Math.max(0, (sat.fuelKg || 0) - burn.fuelCostKg);
          const updatedDeltaV = Math.max(0, (sat.deltaVAvailableMS || 0) - burn.deltaVMS);
          return {
            ...sat,
            fuelKg: updatedFuel,
            deltaVAvailableMS: updatedDeltaV,
          };
        }
        return sat;
      })
    );

    if (activeConjunction) {
      setConjunctions((prev) =>
        prev.map((c) => {
          if (c.id === activeConjunction.id) {
            return {
              ...c,
              status: 'MITIGATED',
              missDistanceKm: burn.newMissDistanceKm,
              collisionRiskScore: burn.newRiskScore,
            };
          }
          return c;
        })
      );
    }

    showToast(`Autonomous CAM Successful! Risk reduced to ${burn.newRiskScore}/100.`);
  };

  // Add new leaderboard entry from Mission Mode
  const handleSaveScore = (entry: Omit<LeaderboardEntry, 'id' | 'rank' | 'date'>) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `lb-${Date.now()}`,
      rank: 1,
      date: 'Just now',
    };

    const updated = [newEntry, ...leaderboard]
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    setLeaderboard(updated);
    showToast(`Score submitted to Global Leaderboard! Rank #${newEntry.rank}`);
  };

  // Alert actions
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    showToast('Alert history cleared.');
  };

  // Currently inspected object
  const inspectedObject = useMemo(() => {
    if (!selectedObjectId) return selectedSatellite;
    return (
      satellites.find((s) => s.id === selectedObjectId) ||
      debris.find((d) => d.id === selectedObjectId) ||
      selectedSatellite
    );
  }, [selectedObjectId, satellites, debris, selectedSatellite]);

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-row selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#091326] border border-blue-500/80 text-sky-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-telemetry animate-bounce">
          <Shield className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation (Desktop) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={(sat) => {
            setSelectedSatellite(sat);
            setSelectedObjectId(sat.id);
            soundEngine.playRadarPing();
          }}
          activeSection={activeSection}
          onChangeSection={setActiveSection}
          alerts={alerts}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
          onOpenReplay={() => setIsReplayOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenMission={() => setIsMissionOpen(true)}
          isInitiateSequenceOpen={isInitiateSequenceOpen}
          onInitiateSequence={() => setIsInitiateSequenceOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/70 backdrop-blur-sm">
          <div className="relative w-72 max-w-[85vw] h-full">
            <Sidebar
              satellites={satellites}
              selectedSatellite={selectedSatellite}
              onSelectSatellite={(sat) => {
                setSelectedSatellite(sat);
                setSelectedObjectId(sat.id);
                setIsMobileMenuOpen(false);
                soundEngine.playRadarPing();
              }}
              activeSection={activeSection}
              onChangeSection={(s) => {
                setActiveSection(s);
                setIsMobileMenuOpen(false);
              }}
              alerts={alerts}
              onOpenWhatIf={() => {
                setIsWhatIfOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenAutoAvoidance={() => {
                setIsAutoAvoidOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenReplay={() => {
                setIsReplayOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenLeaderboard={() => {
                setIsLeaderboardOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenMission={() => {
                setIsMissionOpen(true);
                setIsMobileMenuOpen(false);
              }}
              isInitiateSequenceOpen={isInitiateSequenceOpen}
              onInitiateSequence={() => {
                setIsInitiateSequenceOpen(true);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex-1 p-4 text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Mission Control Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar with "STATUS: READY FOR LAUNCH" and "INITIATE SEQUENCE" */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-3 bg-[#0a1224] text-slate-300 border-b border-[#1b2b48]"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <TopHeader
              selectedSatellite={selectedSatellite}
              alerts={alerts}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onOpenAlerts={() => setIsAlertsOpen(true)}
              onInitiateSequence={() => setIsInitiateSequenceOpen(true)}
              isSequenceActive={isInitiateSequenceOpen}
            />
          </div>
        </div>

        {/* Workspace Body */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1700px] w-full mx-auto">
          {/* Top Conjunction Alert Bar if High Risk */}
          <ConjunctionAlertBar
            conjunction={activeConjunction}
            onOpenWhatIf={() => setIsWhatIfOpen(true)}
            onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
            onOpenExplain={() => setIsExplainOpen(true)}
          />

          {/* Section: Overview or Trajectory (Default Primary Aerospace View) */}
          {(activeSection === 'OVERVIEW' || activeSection === 'TRAJECTORY') && (
            <div className="space-y-4">
              {/* Centerpiece: "MISSION TRAJECTORY PREDICTION" Card with Globe & Graph */}
              <MissionTrajectoryCard
                satellites={satellites}
                debris={debris}
                conjunctions={conjunctions}
                selectedSatellite={selectedSatellite}
                selectedObjectId={selectedObjectId}
                onSelectObject={(id) => {
                  setSelectedObjectId(id);
                  const sat = satellites.find((s) => s.id === id);
                  if (sat) setSelectedSatellite(sat);
                }}
                activeConjunction={activeConjunction}
                simTime={simTime}
                setSimTime={setSimTime}
                simSpeed={simSpeed}
                setSimSpeed={setSimSpeed}
                isSimPaused={isSimPaused}
                setIsSimPaused={setIsSimPaused}
                showOrbitPaths={showOrbitPaths}
                setShowOrbitPaths={setShowOrbitPaths}
                showDebrisCloud={showDebrisCloud}
                setShowDebrisCloud={setShowDebrisCloud}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                show3DHeatmap={show3DHeatmap}
                setShow3DHeatmap={setShow3DHeatmap}
                previewOrbit={previewOrbit}
                onOpenWhatIf={() => setIsWhatIfOpen(true)}
                onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
              />

              {/* Bottom 3-Card Grid Matching the User Design Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* 1. PROPULSION SYSTEMS Card */}
                <PropulsionSystemsCard
                  satellite={selectedSatellite}
                  onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
                  onInitiateSequence={() => setIsInitiateSequenceOpen(true)}
                />

                {/* 2. ENVIRONMENTAL CONTROLS Card */}
                <EnvironmentalControlsCard satellite={selectedSatellite} />

                {/* 3. CONJUNCTION THREAT RADAR Card */}
                <ConjunctionThreatRadarCard
                  conjunction={activeConjunction}
                  onOpenExplain={() => setIsExplainOpen(true)}
                  onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
                  onOpenWhatIf={() => setIsWhatIfOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Section: Propulsion Detailed View */}
          {activeSection === 'PROPULSION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PropulsionSystemsCard
                  satellite={selectedSatellite}
                  onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
                  onInitiateSequence={() => setIsInitiateSequenceOpen(true)}
                />
                <EnvironmentalControlsCard satellite={selectedSatellite} />
              </div>
              <SatelliteHealthDashboard
                satellite={selectedSatellite}
                conjunctions={conjunctions}
                allSatellites={satellites}
                onSelectSatellite={(sat) => {
                  setSelectedSatellite(sat);
                  setSelectedObjectId(sat.id);
                }}
              />
            </div>
          )}

          {/* Section: Environmental Detailed View */}
          {activeSection === 'ENVIRONMENTAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EnvironmentalControlsCard satellite={selectedSatellite} />
                <PropulsionSystemsCard
                  satellite={selectedSatellite}
                  onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
                  onInitiateSequence={() => setIsInitiateSequenceOpen(true)}
                />
              </div>
              <SatelliteHealthDashboard
                satellite={selectedSatellite}
                conjunctions={conjunctions}
                allSatellites={satellites}
                onSelectSatellite={(sat) => {
                  setSelectedSatellite(sat);
                  setSelectedObjectId(sat.id);
                }}
              />
            </div>
          )}

          {/* Section: Conjunctions Table & Threat Radar */}
          {activeSection === 'CONJUNCTIONS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <ConjunctionThreatRadarCard
                    conjunction={activeConjunction}
                    onOpenExplain={() => setIsExplainOpen(true)}
                    onOpenAutoAvoidance={() => setIsAutoAvoidOpen(true)}
                    onOpenWhatIf={() => setIsWhatIfOpen(true)}
                  />
                </div>

                {/* All Monitored Conjunctions Table */}
                <div className="lg:col-span-2 p-4 rounded-2xl bg-[#091122] border border-[#1b2b48] shadow-xl font-telemetry">
                  <div className="flex items-center justify-between pb-3 border-b border-[#182744]">
                    <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                      Active Conjunction Threat Catalog ({conjunctions.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      SGP4 72-Hour Auto-screening
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {conjunctions.map((c) => {
                      const isTargeted = activeConjunction?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            const sat = satellites.find((s) => s.id === c.primaryObjectId);
                            if (sat) setSelectedSatellite(sat);
                            setSelectedObjectId(c.secondaryObjectId);
                          }}
                          className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                            isTargeted
                              ? 'bg-[#101e3b] border-blue-500 shadow-md'
                              : 'bg-[#0b1426] border-[#1b2b48] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                c.status === 'MITIGATED'
                                  ? 'bg-emerald-400'
                                  : c.collisionRiskScore >= 75
                                  ? 'bg-red-500 animate-pulse'
                                  : c.collisionRiskScore >= 50
                                  ? 'bg-orange-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <div>
                              <div className="font-bold text-slate-200">
                                {c.primaryObjectName} ⇄ {c.secondaryObjectName}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Miss Distance: {c.missDistanceKm.toFixed(2)} km • Rel Vel: {c.relativeVelocityKmS.toFixed(1)} km/s
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">TCA</span>
                              <span className="text-slate-300 font-bold">
                                {(c.tcaMinutes ?? 60).toFixed(1)}m
                              </span>
                            </div>
                            <RiskScoreBadge score={c.collisionRiskScore} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Debris Density Heatmap */}
          {activeSection === 'HEATMAP' && (
            <DebrisHeatmapView
              show3DHeatmap={show3DHeatmap}
              onToggle3DHeatmap={() => setShow3DHeatmap(!show3DHeatmap)}
            />
          )}
        </main>
      </div>

      {/* Interactive Mission Modals */}
      {/* 1. INITIATE SEQUENCE Modal */}
      <InitiateSequenceModal
        satellite={selectedSatellite}
        activeConjunction={activeConjunction}
        isOpen={isInitiateSequenceOpen}
        onClose={() => setIsInitiateSequenceOpen(false)}
        onSequenceComplete={handleSequenceComplete}
      />

      {/* 2. What-If Simulator Modal */}
      {activeConjunction && (
        <WhatIfSimulatorModal
          satellite={selectedSatellite}
          conjunction={activeConjunction}
          isOpen={isWhatIfOpen}
          onClose={() => setIsWhatIfOpen(false)}
          onPreviewOrbit={(preview) => setPreviewOrbit(preview)}
          onCommitManeuver={(burnDeltaV, fuelCostKg, newMissKm, newRisk) => {
            handleApplyBurn({
              id: `burn-${Date.now()}`,
              name: 'Manual What-If Burn',
              strategy: 'MIN_FUEL',
              burnType: 'PROGRADE',
              deltaVMS: burnDeltaV,
              fuelCostKg: fuelCostKg,
              leadTimeMinutes: 45,
              newMissDistanceKm: newMissKm,
              newRiskScore: newRisk,
              successProbability: 99.2,
              description: 'Custom maneuver simulated via What-If flight computer',
            });
            setIsWhatIfOpen(false);
          }}
        />
      )}

      {/* 3. Autonomous Avoidance Modal */}
      <AutoAvoidanceModal
        satellite={selectedSatellite}
        conjunction={activeConjunction}
        isOpen={isAutoAvoidOpen}
        onClose={() => setIsAutoAvoidOpen(false)}
        onExecuteManeuver={handleExecuteAutoAvoidance}
      />

      {/* 4. Explainable Prediction Modal */}
      {activeConjunction && (
        <ExplainablePredictionModal
          satellite={selectedSatellite}
          conjunction={activeConjunction}
          isOpen={isExplainOpen}
          onClose={() => setIsExplainOpen(false)}
        />
      )}

      {/* 5. Incident Replay Modal */}
      <IncidentReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
      />

      {/* 6. Mission Mode Game */}
      <MissionModeModal
        isOpen={isMissionOpen}
        onClose={() => setIsMissionOpen(false)}
        satellite={selectedSatellite}
        onSaveScore={handleSaveScore}
      />

      {/* 7. Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboard}
      />

      {/* 8. Smart Alerts Panel */}
      <SmartAlertsPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        riskThreshold={riskThreshold}
        onChangeRiskThreshold={setRiskThreshold}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onClearAllAlerts={handleClearAlerts}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    </div>
  );
}
