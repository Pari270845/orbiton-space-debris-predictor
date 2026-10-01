export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'SSO' | 'HEO';

export type ThreatLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface OrbitalElements {
  semiMajorAxisKm: number; // a (e.g. 6900 km for ~520km altitude)
  eccentricity: number;    // e (0 to 1)
  inclinationDeg: number;  // i (degrees)
  raanDeg: number;         // Right Ascension of Ascending Node (degrees)
  argOfPerigeeDeg: number; // Argument of Perigee (degrees)
  meanAnomalyDeg: number;  // Mean Anomaly at epoch (degrees)
  periodMinutes: number;   // Orbital period in minutes
}

export interface SpaceObject {
  id: string;
  name: string;
  catalogNumber: number; // NORAD ID
  type: 'SATELLITE' | 'DEBRIS' | 'ROCKET_BODY' | 'PAYLOAD_ADAPTER';
  orbitRegime: OrbitRegime;
  elements: OrbitalElements;
  altitudeKm: number;
  speedKmS: number;
  velocityKmS: number;
  sizeMeters: number;
  massKg: number;
  radarCrossSectionM2: number;
  launchYear: number;
  originCountry: string;
  status: 'ACTIVE' | 'DECAYING' | 'FRAGMENT' | 'DERELICT';
  fuelKg?: number;
  maxFuelKg?: number;
  deltaVAvailableMS?: number;
  health?: {
    batteryPercent: number;
    solarPowerWatts: number;
    decayRateKmYear: number;
    structuralIntegrity: number; // 0 - 100
    thrusterStatus: 'READY' | 'WARMING' | 'COOLDOWN' | 'DEPLETED';
  };
}

export interface ConjunctionEvent {
  id: string;
  primaryObjectId: string;
  secondaryObjectId: string;
  primaryObjectName: string;
  secondaryObjectName: string;
  secondaryObjectType: 'DEBRIS' | 'ROCKET_BODY' | 'SATELLITE';
  missDistanceKm: number;      // Current predicted closest distance
  relativeVelocityKmS: number; // Closure velocity
  collisionRiskScore: number;  // 0 - 100
  collisionProbability: number;// e.g. 2.4e-3
  tcaMinutes: number;          // Time to closest approach in minutes
  tcaTimestamp: number;        // Epoch millis of closest approach
  impactEnergyMj: number;      // 0.5 * m * v^2
  covarianceVolumeKm3: number; // Uncertainty ellipsoid volume
  altitudeKm: number;
  threatLevel: ThreatLevel;
  status: 'ACTIVE' | 'MITIGATED' | 'PASSED' | 'COLLIDED';
  mitigationBurn?: AvoidanceBurn;
}

export interface AvoidanceBurn {
  id: string;
  name: string;
  strategy: 'MIN_FUEL' | 'MAX_SEPARATION' | 'EMERGENCY_RADIAL';
  burnType: 'PROGRADE' | 'RETROGRADE' | 'OUT_OF_PLANE' | 'RADIAL_OUT';
  deltaVMS: number;            // delta-V in m/s
  fuelCostKg: number;          // fuel consumed
  leadTimeMinutes: number;     // when to execute before TCA
  newMissDistanceKm: number;   // projected new miss distance
  newRiskScore: number;        // projected risk score after burn
  successProbability: number;  // 0 - 100%
  description: string;
}

export interface WhatIfParameters {
  deltaVProgradeMS: number;    // -10 to +10 m/s
  deltaVNormalMS: number;      // -10 to +10 m/s (out of plane)
  deltaVRadialMS: number;      // -10 to +10 m/s
  burnTimeOffsetMinutes: number; // 5 to 120 minutes before TCA
  customAltitudeChangeKm: number;
}

export interface ReplayScenario {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  description: string;
  primaryObject: string;
  secondaryObject: string;
  relativeVelocityKmS: number;
  missDistanceKm: number;
  outcome: 'COLLISION' | 'NEAR_MISS_AVOIDED' | 'UNCONTROLLED_PASS';
  initialTcaMinutes: number;
  fragmentsGenerated?: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  callsign: string;
  score: number;
  avoidancesCount: number;
  fuelSavedPercent: number;
  avgMissDistanceKm: number;
  badge: string;
  date: string;
}

export interface SpaceAlert {
  id: string;
  conjunctionId: string;
  timestamp: number;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  acknowledged: boolean;
}

export interface SmartAlertSettings {
  soundEnabled: boolean;
  minRiskThreshold: number;       // default 60
  maxMissDistanceKm: number;      // default 5.0 km
  maxTcaMinutes: number;          // default 90 min
  notifyHighKineticEnergy: boolean;
}

export interface MissionState {
  isActive: boolean;
  isPaused: boolean;
  missionTimeSeconds: number;
  score: number;
  satelliteHealth: number;       // 0 - 100
  fuelRemainingKg: number;       // e.g. 45.0 kg
  totalDeltaVExpendedMS: number;
  conjunctionsEvaded: number;
  incomingConjunctions: ConjunctionEvent[];
  activeThreat: ConjunctionEvent | null;
  gameOver: boolean;
  missionSuccess: boolean;
  log: string[];
}
