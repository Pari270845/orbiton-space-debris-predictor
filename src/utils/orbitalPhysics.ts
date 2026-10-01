import { OrbitalElements, SpaceObject, AvoidanceBurn, WhatIfParameters } from '../types/space';

// Earth Constants
export const EARTH_RADIUS_KM = 6378.137;
export const MU_EARTH = 398600.4418; // km^3 / s^2 (Standard gravitational parameter)

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Solves Kepler's equation M = E - e * sin(E) for Eccentric Anomaly E using Newton-Raphson
 */
export function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  let E = meanAnomalyRad;
  const tolerance = 1e-6;
  const maxIter = 30;

  for (let i = 0; i < maxIter; i++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomalyRad;
    if (Math.abs(f) < tolerance) break;
    const fPrime = 1 - eccentricity * Math.cos(E);
    E = E - f / fPrime;
  }
  return E;
}

/**
 * Propagates an orbit to get 3D position in ECI (Earth-Centered Inertial) frame in km
 * @param elements Orbital elements
 * @param timeMinutes Elapsed time in minutes since epoch
 */
export function propagateOrbit(elements: OrbitalElements, timeMinutes: number): Vector3D {
  const { semiMajorAxisKm, eccentricity, inclinationDeg, raanDeg, argOfPerigeeDeg, meanAnomalyDeg, periodMinutes } = elements;

  // Mean motion in radians per minute
  const n = (2 * Math.PI) / (periodMinutes || 95);
  const currentMeanAnomaly = ((meanAnomalyDeg * Math.PI) / 180 + n * timeMinutes) % (2 * Math.PI);

  // Eccentric anomaly
  const E = solveKepler(currentMeanAnomaly, eccentricity);

  // True anomaly (nu)
  const sinNu = (Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E)) / (1 - eccentricity * Math.cos(E));
  const cosNu = (Math.cos(E) - eccentricity) / (1 - eccentricity * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Radius from center of Earth
  const r = (semiMajorAxisKm * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(nu));

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Euler angles
  const iRad = (inclinationDeg * Math.PI) / 180;
  const raanRad = (raanDeg * Math.PI) / 180;
  const omegaRad = (argOfPerigeeDeg * Math.PI) / 180;

  // Transform orbital plane to ECI frame
  const cosOmega = Math.cos(omegaRad);
  const sinOmega = Math.sin(omegaRad);
  const cosRaan = Math.cos(raanRad);
  const sinRaan = Math.sin(raanRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const Px = cosRaan * cosOmega - sinRaan * sinOmega * cosI;
  const Py = sinRaan * cosOmega + cosRaan * sinOmega * cosI;
  const Pz = sinOmega * sinI;

  const Qx = -cosRaan * sinOmega - sinRaan * cosOmega * cosI;
  const Qy = -sinRaan * sinOmega + cosRaan * cosOmega * cosI;
  const Qz = cosOmega * sinI;

  return {
    x: xOrb * Px + yOrb * Qx,
    y: xOrb * Py + yOrb * Qy,
    z: xOrb * Pz + yOrb * Qz,
  };
}

/**
 * Generates smooth points along an entire orbit for 3D trajectory visualization
 */
export function generateOrbitPathPoints(elements: OrbitalElements, samples = 128): [number, number, number][] {
  const points: [number, number, number][] = [];
  const period = elements.periodMinutes || 95;
  const step = period / samples;

  for (let i = 0; i <= samples; i++) {
    const pos = propagateOrbit(elements, i * step);
    points.push([pos.x, pos.y, pos.z]);
  }
  return points;
}

/**
 * Calculates Euclidean distance in km between two 3D vectors
 */
export function calculateDistanceKm(pos1: Vector3D, pos2: Vector3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate Collision Risk Score (0-100) based on miss distance, closure speed, and covariance
 */
export function calculateRiskScore(
  missDistanceKm: number,
  relativeVelocityKmS: number,
  covarianceVolumeKm3 = 1.5,
  tcaMinutes = 60
): number {
  // Safe distance threshold is ~15 km for operational alerts
  if (missDistanceKm > 25) return Math.max(1, Math.round(5 * Math.exp(-missDistanceKm / 10)));

  // Distance risk factor: 0.1km -> ~85 pts, 1km -> ~65 pts, 5km -> ~30 pts, 10km -> ~12 pts
  const distanceScore = 95 * Math.exp(-missDistanceKm / 2.8);

  // Velocity factor: higher relative speed means higher kinetic energy and less avoidance window
  const velocityFactor = Math.min(1.3, 0.8 + relativeVelocityKmS / 30);

  // Covariance uncertainty factor
  const covarianceFactor = Math.min(1.25, 0.9 + covarianceVolumeKm3 / 8);

  // Urgency factor: closer TCA raises operational threat score
  const urgencyFactor = tcaMinutes < 30 ? 1.15 : tcaMinutes < 90 ? 1.05 : 1.0;

  let rawScore = distanceScore * velocityFactor * covarianceFactor * urgencyFactor;

  // Constrain to 1-99 unless exact collision
  rawScore = Math.max(1, Math.min(99, Math.round(rawScore)));

  // Extra boost if inside lethal collision radius (< 0.25 km)
  if (missDistanceKm < 0.25) {
    rawScore = Math.max(92, rawScore);
  }

  return rawScore;
}

/**
 * Calculates collision probability Pc (Foster-1992 approximation order of magnitude)
 */
export function calculateCollisionProbability(missDistanceKm: number, combinedRadiusM = 5.0): number {
  const missDistanceM = missDistanceKm * 1000;
  const sigma = 350; // standard 1-sigma positional uncertainty in meters
  // 2D Gaussian probability density at miss distance
  const exponent = -(missDistanceM * missDistanceM) / (2 * sigma * sigma);
  const pc = (combinedRadiusM * combinedRadiusM) / (2 * sigma * sigma) * Math.exp(exponent);
  return Math.min(1.0, Math.max(1e-9, pc));
}

/**
 * Calculates kinetic impact energy in Megajoules (MJ)
 * Ek = 0.5 * m * v^2
 */
export function calculateImpactEnergyMj(massKg: number, relativeVelocityKmS: number): number {
  const velocityMS = relativeVelocityKmS * 1000;
  const energyJoules = 0.5 * massKg * (velocityMS * velocityMS);
  return energyJoules / 1e6; // MJ
}

/**
 * Calculates What-If modified orbital parameters and new miss distance after custom burn
 */
export function simulateWhatIfBurn(
  originalElements: OrbitalElements,
  baseMissDistanceKm: number,
  params: WhatIfParameters,
  tcaMinutes: number
): {
  newElements: OrbitalElements;
  newMissDistanceKm: number;
  newRiskScore: number;
  fuelExpendedKg: number;
  orbitAltitudeDeltaKm: number;
  isSuccessfulAvoidance: boolean;
} {
  const totalDeltaV = Math.sqrt(
    params.deltaVProgradeMS * params.deltaVProgradeMS +
    params.deltaVNormalMS * params.deltaVNormalMS +
    params.deltaVRadialMS * params.deltaVRadialMS
  );

  // Fuel consumption estimate (Tsiolkovsky rocket equation approximation, Isp ~ 220s for hydrazine thruster)
  const dryMassKg = 850;
  const g0 = 9.80665;
  const isp = 220;
  const fuelExpendedKg = dryMassKg * (Math.exp(totalDeltaV / (isp * g0)) - 1);

  // Prograde burn changes semi-major axis: da = 2 * a * v / mu * dv
  const rKm = originalElements.semiMajorAxisKm;
  const vOrbitalKmS = Math.sqrt(MU_EARTH / rKm);
  const deltaA = (2 * originalElements.semiMajorAxisKm * (params.deltaVProgradeMS / 1000)) / vOrbitalKmS;

  // Calculate new semi-major axis
  const newSemiMajorAxisKm = originalElements.semiMajorAxisKm + deltaA;

  // New period
  const newPeriodMinutes = (2 * Math.PI * Math.sqrt(Math.pow(newSemiMajorAxisKm, 3) / MU_EARTH)) / 60;

  // In-track along-track displacement after lead time: delta_s = 1.5 * n * delta_a * time
  const leadTimeSeconds = params.burnTimeOffsetMinutes * 60;
  const meanMotionRadS = (2 * Math.PI) / (originalElements.periodMinutes * 60);
  const alongTrackSeparationKm = Math.abs(1.5 * meanMotionRadS * deltaA * leadTimeSeconds);

  // Out-of-plane cross-track separation from normal burn
  const crossTrackSeparationKm = Math.abs((params.deltaVNormalMS / 1000) * (leadTimeSeconds / 100));

  // Radial separation
  const radialSeparationKm = Math.abs(deltaA / 2) + Math.abs((params.deltaVRadialMS / 1000) * 10);

  // Projected new miss distance
  const additionalDistance = Math.sqrt(
    alongTrackSeparationKm * alongTrackSeparationKm +
    crossTrackSeparationKm * crossTrackSeparationKm +
    radialSeparationKm * radialSeparationKm
  );

  const newMissDistanceKm = Number(((baseMissDistanceKm ?? 0) + additionalDistance).toFixed(3));
  const newRiskScore = calculateRiskScore(newMissDistanceKm, 11.2, 1.2, tcaMinutes);

  return {
    newElements: {
      ...originalElements,
      semiMajorAxisKm: Number((newSemiMajorAxisKm ?? 0).toFixed(2)),
      periodMinutes: Number((newPeriodMinutes ?? 0).toFixed(2)),
    },
    newMissDistanceKm,
    newRiskScore,
    fuelExpendedKg: Number((fuelExpendedKg ?? 0).toFixed(2)),
    orbitAltitudeDeltaKm: Number((deltaA ?? 0).toFixed(2)),
    isSuccessfulAvoidance: newRiskScore < 25 && newMissDistanceKm > 10.0,
  };
}

/**
 * Proposes automated Collision Avoidance Maneuver (CAM) options
 */
export function generateAutoAvoidanceProposals(
  satellite: SpaceObject,
  missDistanceKm: number,
  relativeSpeedKmS: number,
  tcaMinutes: number
): AvoidanceBurn[] {
  // Option 1: Fuel-optimal prograde burn (~45m prior to TCA)
  const minFuelDeltaV = 0.85; // m/s
  const minFuelLeadTime = Math.min(Math.max(30, Math.round(tcaMinutes * 0.7)), 60);
  const minFuelSeparation = Number(((missDistanceKm ?? 0) + 14.8).toFixed(2));
  const minFuelRisk = calculateRiskScore(minFuelSeparation, relativeSpeedKmS, 1.0, tcaMinutes);

  // Option 2: Maximum separation escape (dual-axis burn)
  const maxSepDeltaV = 2.4; // m/s
  const maxSepLeadTime = Math.min(Math.max(45, Math.round(tcaMinutes * 0.8)), 80);
  const maxSepSeparation = Number(((missDistanceKm ?? 0) + 38.4).toFixed(2));
  const maxSepRisk = calculateRiskScore(maxSepSeparation, relativeSpeedKmS, 0.8, tcaMinutes);

  // Option 3: Fast emergency radial out (short lead time)
  const emergencyDeltaV = 1.65; // m/s
  const emergencyLeadTime = Math.min(15, Math.round(tcaMinutes * 0.4));
  const emergencySeparation = Number(((missDistanceKm ?? 0) + 9.5).toFixed(2));
  const emergencyRisk = calculateRiskScore(emergencySeparation, relativeSpeedKmS, 1.2, tcaMinutes);

  return [
    {
      id: 'cam-min-fuel',
      name: 'Fuel-Optimal Prograde Boost',
      strategy: 'MIN_FUEL',
      burnType: 'PROGRADE',
      deltaVMS: minFuelDeltaV,
      fuelCostKg: 0.38,
      leadTimeMinutes: minFuelLeadTime,
      newMissDistanceKm: minFuelSeparation,
      newRiskScore: minFuelRisk,
      successProbability: 99.4,
      description: `Execute a gentle +${minFuelDeltaV} m/s prograde burn ${minFuelLeadTime} min before TCA. Uses minimal propellant while boosting separation past the 10km safety envelope.`,
    },
    {
      id: 'cam-max-sep',
      name: 'High-Margin Combined Vector Burn',
      strategy: 'MAX_SEPARATION',
      burnType: 'OUT_OF_PLANE',
      deltaVMS: maxSepDeltaV,
      fuelCostKg: 1.08,
      leadTimeMinutes: maxSepLeadTime,
      newMissDistanceKm: maxSepSeparation,
      newRiskScore: maxSepRisk,
      successProbability: 99.9,
      description: `Maximum safety clearance: +${maxSepDeltaV} m/s combined prograde and normal cross-track thrust. Establishes a massive >38 km buffer against high-covariance fragments.`,
    },
    {
      id: 'cam-emergency',
      name: 'Rapid Radial Reaction Burn',
      strategy: 'EMERGENCY_RADIAL',
      burnType: 'RADIAL_OUT',
      deltaVMS: emergencyDeltaV,
      fuelCostKg: 0.74,
      leadTimeMinutes: emergencyLeadTime,
      newMissDistanceKm: emergencySeparation,
      newRiskScore: emergencyRisk,
      successProbability: 97.2,
      description: `Rapid-response maneuver: +${emergencyDeltaV} m/s radial outward pulse ${emergencyLeadTime} min prior to TCA. Best for late-detected conjunctions or short reaction times.`,
    },
  ];
}
