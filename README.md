# Orbiton: Space Debris Collision Predictor & Orbital Defense Console

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.dot.js&logoColor=white)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Orbiton** is a real-time Space Situational Awareness (SSA) and orbital collision risk mitigation platform. Designed for satellite operators, aerospace researchers, and flight dynamics teams, Orbiton delivers interactive 3D Low Earth Orbit (LEO) visualization, conjunction assessment (TCA countdowns), "What-If" avoidance maneuver simulation, and an interactive satellite defense training simulator.

---

## Key Features

### 1. Interactive 3D Orbital Earth & Debris Cloud
- High-fidelity 3D Globe with atmosphere glow, realistic satellite trajectories, and debris clusters.
- Real-time orbital propagation based on Keplerian orbital elements (semi-major axis, eccentricity, inclination, RAAN, argument of perigee, and true anomaly).
- Dynamic threat filtering: Filter active satellites, rocket bodies, fragmentation debris, and active conjunction vectors.

### 2. Conjunction Assessment & Collision Prediction
- **Time of Closest Approach (TCA)** countdowns with real-time miss distance calculations (km).
- Hypervelocity closure rate (km/s) and impact kinetic energy assessment (MJ).
- Threat categorization (CRITICAL, HIGH, ELEVATED, NOMINAL) adhering to standard space traffic management protocols.
- Covariance ellipsoid volume visualization around primary operational assets.

### 3. "What-If" Burn Simulator (Collision Avoidance)
- Test reactive delta-v (ΔV) burns before committing maneuvers to flight hardware.
- Prograde/Retrograde, Radial In/Out, and Normal/Cross-track impulse vectors.
- Instant re-calculation of predicted miss distance, revised post-burn orbit, and fuel consumption penalty (kg and ΔV).

### 4. Historical Replays & Real Orbital Incidents
- Step-by-step telemetry replays of landmark orbital events:
  - **Iridium 33 vs Cosmos 2251** (2009 hypervelocity collision).
  - **Fengyun-1C Anti-Satellite (ASAT) Test** debris field.
  - **Cosmos 1408 Fragment near ISS** emergency shelter event.

### 5. Operation Orbiton: Satellite Defense Simulator
- Interactive flight director mini-game: Pilot **Orbiton Sentinel-4** through escalating Kessler syndrome debris corridors.
- Balance thruster reaction timing, avoid incoming debris fragments, preserve fuel reserves, and record high scores on the flight roster.

### 6. Space Weather & Solar Flux Telemetry
- Atmospheric density indices ($F_{10.7}$ Solar Flux, Geomagnetic $Kp$ index).
- Coronal Mass Ejection (CME) alerts and solar storm impact on atmospheric drag and orbital decay.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **3D Graphics & Physics:** Three.js, Lucide Icons, Canvas API
- **Styling:** Tailwind CSS, Custom Aerospace Telemetry Fonts (`IBM Plex Mono`, `JetBrains Mono`)
- **AI Diagnostics:** Google Gemini API integration for automated orbital telemetry risk analysis and avoidance recommendations

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm / yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/orbiton.git
   cd orbiton
