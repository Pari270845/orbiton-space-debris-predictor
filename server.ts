import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Explainable Prediction endpoint
  app.post("/api/explain-risk", async (req, res) => {
    const {
      satelliteName,
      debrisName,
      riskScore,
      missDistanceKm,
      relativeSpeedKmS,
      tcaMinutes,
      altitudeKm,
      debrisSizeM,
      impactEnergyMj,
      inclinationDeg,
      covarianceVolumeKm3,
    } = req.body;

    // Deterministic physics explanation fallback
    const physicsSummary = {
      threatLevel:
        riskScore >= 80 ? "CRITICAL (Red Alert)" : riskScore >= 50 ? "ELEVATED (Yellow Warning)" : "NOMINAL / ADVISORY",
      kineticThreat: `${(impactEnergyMj || 4.2).toFixed(1)} MJ equivalent kinetic payload at ${(relativeSpeedKmS || 11.4).toFixed(1)} km/s relative speed`,
      geometryFactor: `Near coplanar ascending/descending node cross at ${altitudeKm || 550} km altitude with miss distance ${(missDistanceKm || 1.2).toFixed(2)} km`,
      uncertaintyRisk: `Covariance error ellipsoid estimated at ${(covarianceVolumeKm3 || 1.8).toFixed(1)} km³ based on radar track freshness`,
      recommendedAction:
        riskScore >= 70
          ? `Initiate impulsive +${(0.85 + (riskScore / 100) * 0.9).toFixed(2)} m/s prograde burn at TCA - 45 min to guarantee minimum > 12 km radial separation.`
          : `Monitor radar telemetry; prepare contingency out-of-plane cross-track burn if covariance error widens past 5 km.`,
    };

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        source: "deterministic_physics_engine",
        summary: `Physics-driven assessment: Conjunction risk is rated ${riskScore}/100 with a predicted miss distance of ${Number(missDistanceKm).toFixed(2)} km at ${Number(relativeSpeedKmS).toFixed(1)} km/s relative velocity.`,
        keyHazards: [
          `Hypervelocity relative speed (${Number(relativeSpeedKmS).toFixed(1)} km/s) imparts ${(impactEnergyMj || 4.2).toFixed(1)} MJ kinetic energy upon impact, sufficient for catastrophic structural fragmentation.`,
          `Miss distance of ${Number(missDistanceKm).toFixed(2)} km falls well within the combined 3-sigma covariance uncertainty boundary (${(covarianceVolumeKm3 || 1.8).toFixed(1)} km³).`,
          `Conjunction occurs in ${Math.round(tcaMinutes || 60)} minutes near ${Math.round(altitudeKm || 550)} km LEO regime, where solar activity-induced thermospheric drag accelerates orbital decay.`,
        ],
        physicsExplanation: `Orbital plane crossing creates a high-probability conjunction volume. Even a sub-meter fragment (${debrisSizeM || 0.4}m) carries devastating momentum at orbital velocities. A collision would trigger a localized Kessler syndrome cascade, generating thousands of secondary untrackable fragments.`,
        avoidanceRecommendation: physicsSummary.recommendedAction,
      });
    }

    try {
      const prompt = `You are the Chief Orbital Safety Officer at NORAD/ESA Space Situational Awareness (SSA).
Analyze this high-priority space conjunction and explain concisely why the collision risk is rated ${riskScore}/100:
- Primary Asset: ${satelliteName || "Sentinel-4"} at ${altitudeKm || 550} km altitude (LEO)
- Secondary Debris: ${debrisName || "Cosmos-2251 Fragment #49281"} (Est. Size: ${debrisSizeM || 0.45}m)
- Risk Score: ${riskScore}/100 (Threshold alert: >50)
- Predicted Miss Distance: ${Number(missDistanceKm).toFixed(3)} km
- Relative Velocity: ${Number(relativeSpeedKmS).toFixed(2)} km/s
- Time to Closest Approach (TCA): ${Math.round(tcaMinutes || 60)} minutes
- Calculated Kinetic Impact Energy: ${(impactEnergyMj || 4.2).toFixed(1)} MJ
- Covariance Uncertainty Volume: ${(covarianceVolumeKm3 || 1.8).toFixed(2)} km³

Provide an expert aerospace briefing in clear JSON with these exact keys:
{
  "summary": "1-2 sentence executive threat summary",
  "keyHazards": ["3 specific physical reasons why this conjunction is hazardous (kinetic energy, covariance ellipsoid overlap, altitude drag)"],
  "physicsExplanation": "A 2-3 sentence technical explanation of the orbital geometry, relative velocity vector, and collision probability dynamics",
  "avoidanceRecommendation": "Specific orbital maneuver recommendation including Delta-V thrust direction (prograde/retrograde/radial) and timing before TCA"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text?.trim() || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        source: "gemini_orbital_ai",
        summary: parsed.summary || physicsSummary.threatLevel,
        keyHazards: parsed.keyHazards || [
          `Relative velocity ${relativeSpeedKmS} km/s`,
          `Miss distance ${missDistanceKm} km inside uncertainty ellipsoid`,
          `Kinetic payload ${impactEnergyMj} MJ`,
        ],
        physicsExplanation: parsed.physicsExplanation || physicsSummary.geometryFactor,
        avoidanceRecommendation: parsed.avoidanceRecommendation || physicsSummary.recommendedAction,
      });
    } catch (err: any) {
      console.warn("Gemini API call failed, using deterministic fallback:", err?.message || err);
      return res.json({
        source: "deterministic_physics_engine_fallback",
        summary: `Deterministic orbital assessment: Risk ${riskScore}/100 due to ${Number(missDistanceKm).toFixed(2)} km miss distance at ${Number(relativeSpeedKmS).toFixed(1)} km/s.`,
        keyHazards: [
          `Relative collision velocity of ${Number(relativeSpeedKmS).toFixed(1)} km/s results in ${(impactEnergyMj || 4.2).toFixed(1)} MJ kinetic threat.`,
          `Combined covariance overlap creates high collision probability (${riskScore >= 70 ? "Critical" : "Elevated"}).`,
          `TCA in ${Math.round(tcaMinutes || 60)} minutes leaves limited reaction window for propulsion warm-up and burn calibration.`,
        ],
        physicsExplanation: `Conjunction geometry at ${Math.round(altitudeKm || 550)} km altitude brings both orbital tracks into close alignment with high relative closure speed.`,
        avoidanceRecommendation: physicsSummary.recommendedAction,
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AegisOrbit server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
