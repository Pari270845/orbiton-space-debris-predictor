import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SpaceObject, ConjunctionEvent, OrbitalElements } from '../types/space';
import { propagateOrbit, generateOrbitPathPoints } from '../utils/orbitalPhysics';
import { Compass, Eye, Maximize2, ZoomIn, ZoomOut, RotateCcw, Layers, ShieldAlert, Sparkles } from 'lucide-react';

export interface Earth3DCanvasProps {
  satellites: SpaceObject[];
  debris: SpaceObject[];
  conjunctions?: ConjunctionEvent[];
  selectedSatellite?: SpaceObject | null;
  selectedSatelliteId?: string;
  selectedDebris?: SpaceObject | null;
  selectedObjectId?: string | null;
  activeConjunction?: ConjunctionEvent | null;
  whatIfOrbitElements?: OrbitalElements | null;
  previewOrbit?: OrbitalElements | null;
  simTimeMinutes: number;
  showDebrisSwarm?: boolean;
  showDebrisCloud?: boolean;
  showOrbits?: boolean;
  showOrbitPaths?: boolean;
  showHeatmap?: boolean;
  show3DHeatmap?: boolean;
  showLabels?: boolean;
  showCovariance?: boolean;
  onSelectSatellite?: (sat: SpaceObject) => void;
  onSelectDebris?: (deb: SpaceObject) => void;
  onSelectObject?: (id: string) => void;
}

// Coordinate scaling: Earth radius 6378 km -> 10 units in 3D scene
const SCALE = 10 / 6378.137;

/**
 * Creates procedural high-fidelity Earth map texture using HTML5 Canvas
 */
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep oceanic gradient (realistic bathymetric navy)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#040b17');
  oceanGrad.addColorStop(0.2, '#061326');
  oceanGrad.addColorStop(0.5, '#0a1e38');
  oceanGrad.addColorStop(0.8, '#061326');
  oceanGrad.addColorStop(1, '#040b17');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle coordinate graticules (15° spacing)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;
  for (let lat = 0; lat <= height; lat += height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, lat);
    ctx.lineTo(width, lat);
    ctx.stroke();
  }
  for (let lon = 0; lon <= width; lon += width / 24) {
    ctx.beginPath();
    ctx.moveTo(lon, 0);
    ctx.lineTo(lon, height);
    ctx.stroke();
  }

  // Draw realistic continents with coastal contours
  const drawLandmass = (
    pathPoints: [number, number][],
    fillCol = '#152b22',
    shelfCol = '#0d3852',
    borderCol = '#254a3a'
  ) => {
    const toPx = (lon: number, lat: number): [number, number] => [
      ((lon + 180) / 360) * width,
      ((90 - lat) / 180) * height,
    ];

    // Continental shelf (shallow marine glow)
    ctx.strokeStyle = shelfCol;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathPoints.forEach(([lon, lat], idx) => {
      const [px, py] = toPx(lon, lat);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // Land surface
    ctx.fillStyle = fillCol;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    pathPoints.forEach(([lon, lat], idx) => {
      const [px, py] = toPx(lon, lat);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // North America
  drawLandmass([
    [-168, 65], [-160, 71], [-140, 70], [-125, 71], [-95, 73], [-80, 65],
    [-60, 60], [-55, 48], [-65, 43], [-76, 35], [-81, 25], [-97, 20],
    [-105, 23], [-115, 30], [-124, 40], [-124, 49], [-135, 57], [-155, 58],
    [-165, 60], [-168, 65]
  ], '#182f25', '#0f3750', '#2d4d3c');

  // Greenland (Ice covered)
  drawLandmass([
    [-55, 83], [-20, 81], [-25, 70], [-45, 60], [-55, 70], [-55, 83]
  ], '#cbd5e1', '#0f3750', '#94a3b8');

  // South America
  drawLandmass([
    [-76, 12], [-60, 8], [-50, 0], [-35, -5], [-35, -12], [-40, -22],
    [-50, -32], [-58, -42], [-68, -55], [-75, -50], [-73, -40], [-71, -30],
    [-77, -15], [-81, -5], [-76, 12]
  ], '#1b3829', '#0f3750', '#2d543e');

  // Europe & Scandinavia
  drawLandmass([
    [-10, 36], [0, 43], [5, 48], [10, 54], [15, 56], [22, 71],
    [30, 70], [32, 60], [25, 55], [20, 45], [25, 40], [15, 38],
    [5, 36], [-5, 36], [-10, 36]
  ], '#203c2e', '#0f3750', '#345e47');

  // British Isles
  drawLandmass([
    [-5, 58], [-2, 58], [1, 52], [-5, 50], [-5, 58]
  ], '#203c2e', '#0f3750', '#345e47');

  // Africa (Sahara arid + Central forest)
  drawLandmass([
    [-17, 32], [-5, 36], [12, 37], [25, 32], [33, 31], [35, 27],
    [43, 12], [51, 10], [42, 0], [40, -12], [32, -28], [28, -34],
    [18, -34], [12, -18], [9, 4], [0, 6], [-14, 12], [-17, 22], [-17, 32]
  ], '#2a3322', '#0f3750', '#424a35');

  // Asia / Siberia / India
  drawLandmass([
    [35, 32], [42, 40], [55, 42], [65, 35], [70, 22], [78, 8],
    [85, 20], [92, 22], [100, 15], [105, 10], [108, 22], [120, 25],
    [122, 38], [130, 42], [140, 50], [165, 60], [175, 65], [180, 70],
    [150, 74], [110, 76], [80, 73], [60, 68], [50, 55], [40, 45], [35, 32]
  ], '#22382a', '#0f3750', '#3a5442');

  // Japan
  drawLandmass([
    [130, 32], [136, 35], [141, 43], [145, 44], [140, 36], [130, 32]
  ], '#203c2e', '#0f3750', '#345e47');

  // Australia & New Zealand
  drawLandmass([
    [114, -22], [120, -14], [136, -12], [142, -11], [153, -28],
    [150, -37], [138, -35], [128, -32], [115, -34], [114, -22]
  ], '#3b3a27', '#0f3750', '#544f35');

  // Antarctica (Ice continent)
  drawLandmass([
    [-180, -70], [180, -70], [180, -90], [-180, -90]
  ], '#dbeafe', '#0f3750', '#93c5fd');

  // Equator reference (subtle dash)
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates procedural semi-transparent cloud texture
 */
function createProceduralCloudTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Soft atmospheric cloud bands
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = 80 + Math.random() * (height - 160);
    const radiusX = 50 + Math.random() * 120;
    const radiusY = 15 + Math.random() * 35;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radiusX);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, Math.random() * 0.4 - 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const Earth3DCanvas: React.FC<Earth3DCanvasProps> = ({
  satellites,
  debris,
  conjunctions,
  selectedSatellite,
  selectedSatelliteId,
  selectedDebris,
  selectedObjectId,
  activeConjunction,
  whatIfOrbitElements,
  previewOrbit,
  simTimeMinutes,
  showDebrisSwarm,
  showDebrisCloud,
  showOrbits,
  showOrbitPaths,
  showHeatmap,
  show3DHeatmap,
  showCovariance,
  onSelectSatellite,
  onSelectDebris,
  onSelectObject,
}) => {
  // Resolve effective active objects and toggles
  const effectiveSat =
    selectedSatellite ||
    satellites.find((s) => s.id === (selectedSatelliteId || selectedObjectId)) ||
    satellites[0] ||
    null;

  const effectiveDeb =
    selectedDebris ||
    debris.find((d) => d.id === selectedObjectId) ||
    null;

  const effectiveConj =
    activeConjunction ||
    conjunctions?.find(
      (c) =>
        (c.primaryObjectId === effectiveSat?.id || c.secondaryObjectId === effectiveSat?.id) &&
        c.status === 'ACTIVE'
    ) ||
    conjunctions?.[0] ||
    null;

  const effectiveWhatIf = whatIfOrbitElements || previewOrbit || null;
  const effectiveShowOrbits = showOrbits ?? showOrbitPaths ?? true;
  const effectiveShowDebris = showDebrisSwarm ?? showDebrisCloud ?? true;
  const effectiveShowHeatmap = showHeatmap ?? show3DHeatmap ?? false;
  const effectiveShowCovariance = showCovariance ?? true;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Groups for dynamic content
  const orbitsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const satellitesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const debrisGroupRef = useRef<THREE.Group>(new THREE.Group());
  const conjunctionGroupRef = useRef<THREE.Group>(new THREE.Group());
  const swarmGroupRef = useRef<THREE.Group>(new THREE.Group());
  const whatIfGroupRef = useRef<THREE.Group>(new THREE.Group());
  const heatmapShellsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const earthMeshRef = useRef<THREE.Mesh | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(26);
  const cameraThetaRef = useRef(0.6); // azimuthal
  const cameraPhiRef = useRef(1.1);   // polar

  const [cameraMode, setCameraMode] = useState<'FREE' | 'FOCUS_ASSET' | 'CONJUNCTION' | 'POLAR'>('FREE');

  // Update camera position from spherical coords
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const r = cameraDistanceRef.current;
    const theta = cameraThetaRef.current;
    const phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhiRef.current));

    cameraRef.current.position.x = r * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = r * Math.cos(phi);
    cameraRef.current.position.z = r * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // slate-950
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / (height || 1), 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL not available or initialization failed:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="display:flex;height:100%;align-items:center;justify-content:center;background:#030712;color:#38bdf8;font-family:monospace;font-size:12px;padding:20px;text-align:center;">
            ORBITAL TELEMETRY DISPLAY<br/>(3D Canvas active in 2D vector fallback mode)
          </div>
        `;
      }
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(50, 20, 40);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-40, -10, -30);
    scene.add(rimLight);

    // Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 250 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 1.2, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Earth Sphere (radius = 10)
    const earthGeo = new THREE.SphereGeometry(10, 64, 64);
    const earthTex = createProceduralEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.75,
      metalness: 0.1,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMeshRef.current = earthMesh;
    scene.add(earthMesh);

    // Subtle cloud layer
    const cloudGeo = new THREE.SphereGeometry(10.08, 64, 64);
    const cloudTex = createProceduralCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.NormalBlending,
      roughness: 0.9,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);

    // Subtle atmospheric rim glow (soft Rayleigh scattering, non-neon)
    const atmosGeo = new THREE.SphereGeometry(10.22, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Equatorial reference ring
    const eqGeo = new THREE.RingGeometry(10.02, 10.06, 64);
    const eqMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const eqRing = new THREE.Mesh(eqGeo, eqMat);
    eqRing.rotation.x = Math.PI / 2;
    scene.add(eqRing);

    // Add Groups to Scene
    scene.add(orbitsGroupRef.current);
    scene.add(satellitesGroupRef.current);
    scene.add(debrisGroupRef.current);
    scene.add(conjunctionGroupRef.current);
    scene.add(swarmGroupRef.current);
    scene.add(whatIfGroupRef.current);
    scene.add(heatmapShellsGroupRef.current);

    // Create realistic background debris swarm (LEO shells)
    const swarmCount = 850;
    const swarmGeo = new THREE.BufferGeometry();
    const swarmPos = new Float32Array(swarmCount * 3);
    const swarmColors = new Float32Array(swarmCount * 3);

    for (let i = 0; i < swarmCount; i++) {
      const altRadius = 10.4 + Math.pow(Math.random(), 1.6) * 2.2;
      const inc = (Math.random() > 0.4 ? 70 + Math.random() * 30 : Math.random() * 60) * (Math.PI / 180);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.sin(inc) * Math.PI;

      const x = altRadius * Math.cos(theta) * Math.cos(phi);
      const y = altRadius * Math.sin(phi);
      const z = altRadius * Math.sin(theta) * Math.cos(phi);

      swarmPos[i * 3] = x;
      swarmPos[i * 3 + 1] = y;
      swarmPos[i * 3 + 2] = z;

      if (altRadius > 10.8 && altRadius < 11.4) {
        swarmColors[i * 3] = 0.95;     // r
        swarmColors[i * 3 + 1] = 0.35; // g
        swarmColors[i * 3 + 2] = 0.2;  // b
      } else {
        swarmColors[i * 3] = 0.5;
        swarmColors[i * 3 + 1] = 0.6;
        swarmColors[i * 3 + 2] = 0.7;
      }
    }
    swarmGeo.setAttribute('position', new THREE.BufferAttribute(swarmPos, 3));
    swarmGeo.setAttribute('color', new THREE.BufferAttribute(swarmColors, 3));

    const swarmMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const swarmPoints = new THREE.Points(swarmGeo, swarmMat);
    swarmGroupRef.current.add(swarmPoints);

    // Heatmap Altitude Shells (LEO dense shell at 800km)
    const shellGeo = new THREE.SphereGeometry(11.2, 48, 48);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    heatmapShellsGroupRef.current.add(shellMesh);

    // Animation loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Rotate Earth slowly
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.0003;
      }

      // Rotate debris swarm slightly
      if (swarmGroupRef.current) {
        swarmGroupRef.current.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || 600;
      cameraRef.current.aspect = w / (h || 1);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer?.dispose();
    };
  }, [updateCameraPosition]);

  // Handle Dynamic Visibility of Groups
  useEffect(() => {
    swarmGroupRef.current.visible = effectiveShowDebris;
  }, [effectiveShowDebris]);

  useEffect(() => {
    orbitsGroupRef.current.visible = effectiveShowOrbits;
  }, [effectiveShowOrbits]);

  useEffect(() => {
    heatmapShellsGroupRef.current.visible = effectiveShowHeatmap;
  }, [effectiveShowHeatmap]);

  // Render Orbital Lines and Satellite / Debris Nodes on state change
  useEffect(() => {
    // Clear dynamic groups
    while (orbitsGroupRef.current.children.length > 0) {
      orbitsGroupRef.current.remove(orbitsGroupRef.current.children[0]);
    }
    while (satellitesGroupRef.current.children.length > 0) {
      satellitesGroupRef.current.remove(satellitesGroupRef.current.children[0]);
    }
    while (debrisGroupRef.current.children.length > 0) {
      debrisGroupRef.current.remove(debrisGroupRef.current.children[0]);
    }
    while (conjunctionGroupRef.current.children.length > 0) {
      conjunctionGroupRef.current.remove(conjunctionGroupRef.current.children[0]);
    }
    while (whatIfGroupRef.current.children.length > 0) {
      whatIfGroupRef.current.remove(whatIfGroupRef.current.children[0]);
    }

    // 1. Draw Satellite Orbits and Meshes
    satellites.forEach((sat) => {
      const isSelected = effectiveSat?.id === sat.id;

      // Orbit Path
      const pathPoints = generateOrbitPathPoints(sat.elements, 128);
      const scaledPoints = pathPoints.map(([x, y, z]) => new THREE.Vector3(x * SCALE, y * SCALE, z * SCALE));
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(scaledPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x06b6d4 : 0x3b82f6, // bright cyan or blue
        transparent: true,
        opacity: isSelected ? 0.9 : 0.45,
        linewidth: isSelected ? 2 : 1,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitsGroupRef.current.add(orbitLine);

      // Satellite Mesh at current sim time
      const currentPos = propagateOrbit(sat.elements, simTimeMinutes);
      const satPosVec = new THREE.Vector3(currentPos.x * SCALE, currentPos.y * SCALE, currentPos.z * SCALE);

      // Satellite Body Group
      const satGroup = new THREE.Group();
      satGroup.position.copy(satPosVec);
      satGroup.userData = { id: sat.id, type: 'SATELLITE' };

      // Central bus
      const busGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const busMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      });
      const bus = new THREE.Mesh(busGeo, busMat);
      bus.userData = { id: sat.id, type: 'SATELLITE' };
      satGroup.add(bus);

      // Solar Panels
      const panelGeo = new THREE.BoxGeometry(0.7, 0.12, 0.02);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // dark solar blue
        metalness: 0.8,
        roughness: 0.3,
      });
      const panels = new THREE.Mesh(panelGeo, panelMat);
      panels.userData = { id: sat.id, type: 'SATELLITE' };
      satGroup.add(panels);

      // Selection Halo
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(0.4, 0.46, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        satGroup.add(ring);
      }

      satellitesGroupRef.current.add(satGroup);
    });

    // 2. Draw Debris Orbits & Fragment Meshes
    debris.forEach((deb) => {
      const isSelected = effectiveDeb?.id === deb.id;
      const isConjunctionThreat = effectiveConj?.secondaryObjectId === deb.id;

      // Color code based on threat
      const debrisColor = isConjunctionThreat ? 0xef4444 : deb.type === 'ROCKET_BODY' ? 0xf59e0b : 0x94a3b8;

      // Orbit Path
      const pathPoints = generateOrbitPathPoints(deb.elements, 96);
      const scaledPoints = pathPoints.map(([x, y, z]) => new THREE.Vector3(x * SCALE, y * SCALE, z * SCALE));
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(scaledPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: debrisColor,
        transparent: true,
        opacity: isConjunctionThreat ? 0.8 : isSelected ? 0.6 : 0.25,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitsGroupRef.current.add(orbitLine);

      // Current position
      const currentPos = propagateOrbit(deb.elements, simTimeMinutes);
      const debPosVec = new THREE.Vector3(currentPos.x * SCALE, currentPos.y * SCALE, currentPos.z * SCALE);

      const debMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(deb.type === 'ROCKET_BODY' ? 0.22 : 0.14),
        new THREE.MeshStandardMaterial({
          color: debrisColor,
          metalness: 0.7,
          roughness: 0.3,
          emissive: isConjunctionThreat ? 0xef4444 : 0x000000,
          emissiveIntensity: isConjunctionThreat ? 0.6 : 0,
        })
      );
      debMesh.position.copy(debPosVec);
      debMesh.userData = { id: deb.id, type: 'DEBRIS' };
      debrisGroupRef.current.add(debMesh);

      // Pulsing threat halo for active conjunction secondary
      if (isConjunctionThreat) {
        const haloGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(debPosVec);
        conjunctionGroupRef.current.add(halo);
      }
    });

    // 3. Draw Active Conjunction Vector & Uncertainty Ellipsoid
    if (effectiveConj && effectiveSat) {
      const targetDebris = debris.find((d) => d.id === effectiveConj.secondaryObjectId);
      if (targetDebris) {
        const satPos = propagateOrbit(effectiveSat.elements, simTimeMinutes);
        const debPos = propagateOrbit(targetDebris.elements, simTimeMinutes);

        const vSat = new THREE.Vector3(satPos.x * SCALE, satPos.y * SCALE, satPos.z * SCALE);
        const vDeb = new THREE.Vector3(debPos.x * SCALE, debPos.y * SCALE, debPos.z * SCALE);

        // Conjunction connecting line (glowing yellow/red)
        const lineGeo = new THREE.BufferGeometry().setFromPoints([vSat, vDeb]);
        const lineMat = new THREE.LineDashedMaterial({
          color: effectiveConj.collisionRiskScore > 75 ? 0xef4444 : 0xf59e0b,
          dashSize: 0.2,
          gapSize: 0.1,
          linewidth: 2,
        });
        const conjLine = new THREE.Line(lineGeo, lineMat);
        conjLine.computeLineDistances();
        conjunctionGroupRef.current.add(conjLine);

        // 3D Covariance Uncertainty Ellipsoid at debris location
        if (effectiveShowCovariance) {
          const ellipsoidGeo = new THREE.SphereGeometry(0.45, 16, 16);
          ellipsoidGeo.scale(1.8, 0.8, 0.8); // 3-sigma along-track, cross-track, radial
          const ellipsoidMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            wireframe: true,
            transparent: true,
            opacity: 0.45,
          });
          const ellipsoid = new THREE.Mesh(ellipsoidGeo, ellipsoidMat);
          ellipsoid.position.copy(vDeb);
          ellipsoid.lookAt(vSat);
          conjunctionGroupRef.current.add(ellipsoid);
        }
      }
    }

    // 4. Draw What-If Modified Orbit Trajectory
    if (effectiveWhatIf) {
      const whatIfPoints = generateOrbitPathPoints(effectiveWhatIf, 128);
      const whatIfScaled = whatIfPoints.map(([x, y, z]) => new THREE.Vector3(x * SCALE, y * SCALE, z * SCALE));
      const whatIfGeo = new THREE.BufferGeometry().setFromPoints(whatIfScaled);
      const whatIfMat = new THREE.LineDashedMaterial({
        color: 0x10b981, // vibrant emerald green for safe modified path
        dashSize: 0.3,
        gapSize: 0.15,
      });
      const whatIfLine = new THREE.Line(whatIfGeo, whatIfMat);
      whatIfLine.computeLineDistances();
      whatIfGroupRef.current.add(whatIfLine);
    }
  }, [
    satellites,
    debris,
    effectiveSat,
    effectiveDeb,
    effectiveConj,
    effectiveWhatIf,
    simTimeMinutes,
    effectiveShowCovariance,
  ]);

  // Mouse drag Orbit Controls & Click Raycaster handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraThetaRef.current -= deltaX * 0.006;
    cameraPhiRef.current -= deltaY * 0.006;

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);

    // If mouse didn't drag significantly, perform click raycasting
    if (dx < 6 && dy < 6 && containerRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const interactiveTargets = [
        ...satellitesGroupRef.current.children,
        ...debrisGroupRef.current.children,
      ];
      const hits = raycaster.intersectObjects(interactiveTargets, true);

      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.id) {
          obj = obj.parent;
        }
        if (obj?.userData?.id) {
          const hitId = obj.userData.id;
          if (onSelectObject) onSelectObject(hitId);
          const foundSat = satellites.find((s) => s.id === hitId);
          if (foundSat && onSelectSatellite) onSelectSatellite(foundSat);
          const foundDeb = debris.find((d) => d.id === hitId);
          if (foundDeb && onSelectDebris) onSelectDebris(foundDeb);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.015;
    cameraDistanceRef.current = Math.max(12.5, Math.min(65, cameraDistanceRef.current + zoomDelta));
    updateCameraPosition();
  };

  // Preset Camera Buttons
  const handleCameraPreset = (mode: 'FREE' | 'FOCUS_ASSET' | 'CONJUNCTION' | 'POLAR') => {
    setCameraMode(mode);
    if (mode === 'POLAR') {
      cameraDistanceRef.current = 28;
      cameraPhiRef.current = 0.1;
      cameraThetaRef.current = 0;
    } else if (mode === 'FOCUS_ASSET' && effectiveSat) {
      cameraDistanceRef.current = 18;
      cameraPhiRef.current = 1.0;
      cameraThetaRef.current = 0.8;
    } else if (mode === 'CONJUNCTION') {
      cameraDistanceRef.current = 15;
      cameraPhiRef.current = 1.2;
      cameraThetaRef.current = 0.5;
    } else {
      cameraDistanceRef.current = 26;
      cameraPhiRef.current = 1.1;
      cameraThetaRef.current = 0.6;
    }
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full min-h-[480px] select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Left HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="p-3 rounded-xl bg-[#0b121e]/90 backdrop-blur-md border border-slate-800 text-xs font-telemetry text-slate-200 shadow-xl min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] text-slate-200 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE ORBITAL TRACKING</span>
            </div>
            <span className="text-[10px] text-blue-400 font-semibold">SGP4</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Objects tracked:</span>
              <span className="text-slate-100 font-semibold">{satellites.length + debris.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Satellites:</span>
              <span className="text-sky-400 font-semibold">{satellites.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Debris:</span>
              <span className="text-slate-300 font-semibold">{debris.length}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Active conjunctions:</span>
              <span className="text-amber-400 font-bold font-telemetry">
                {activeConjunction ? (activeConjunction.status === 'ACTIVE' ? 1 : 0) : (conjunctions?.filter((c) => c.status === 'ACTIVE').length ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {effectiveSat && (
          <div className="px-3 py-2 rounded-xl bg-[#0b121e]/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 max-w-xs shadow-xl">
            <div className="text-sky-300 font-bold tracking-wide uppercase font-telemetry flex items-center justify-between border-b border-slate-800 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>{effectiveSat.name}</span>
              </div>
              <span className="text-[10px] text-slate-400">#{effectiveSat.catalogNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 text-[11px] font-telemetry">
              <div>Alt: <span className="text-slate-100">{effectiveSat.altitudeKm} km</span></div>
              <div>Vel: <span className="text-slate-100">{(effectiveSat.velocityKmS ?? effectiveSat.speedKmS ?? 0).toFixed(2)} km/s</span></div>
              <div>Inc: <span className="text-slate-100">{effectiveSat.elements.inclinationDeg}°</span></div>
              <div>Fuel: <span className="text-emerald-400">{effectiveSat.fuelKg != null ? effectiveSat.fuelKg.toFixed(1) : 'N/A'} kg</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Top Right Camera Presets & Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#0b121e]/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl">
        <button
          id="btn-cam-free"
          onClick={() => handleCameraPreset('FREE')}
          className={`px-2.5 py-1 text-xs rounded-lg transition font-telemetry ${
            cameraMode === 'FREE' ? 'bg-blue-600/20 text-sky-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Free Orbit Camera"
        >
          Free
        </button>
        <button
          id="btn-cam-asset"
          onClick={() => handleCameraPreset('FOCUS_ASSET')}
          className={`px-2.5 py-1 text-xs rounded-lg transition font-telemetry ${
            cameraMode === 'FOCUS_ASSET' ? 'bg-blue-600/20 text-sky-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Focus on Primary Asset"
        >
          Asset
        </button>
        <button
          id="btn-cam-conj"
          onClick={() => handleCameraPreset('CONJUNCTION')}
          className={`px-2.5 py-1 text-xs rounded-lg transition font-telemetry ${
            cameraMode === 'CONJUNCTION' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Focus on Conjunction Zone"
        >
          Encounter
        </button>
        <button
          id="btn-cam-polar"
          onClick={() => handleCameraPreset('POLAR')}
          className={`px-2.5 py-1 text-xs rounded-lg transition font-telemetry ${
            cameraMode === 'POLAR' ? 'bg-blue-600/20 text-sky-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Polar North Projection"
        >
          Polar
        </button>
      </div>

      {/* Bottom Right Zoom & Compass Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          id="btn-zoom-in"
          onClick={() => {
            cameraDistanceRef.current = Math.max(12.5, cameraDistanceRef.current - 3);
            updateCameraPosition();
          }}
          className="p-2 rounded-lg bg-[#0b121e]/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-xl"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => {
            cameraDistanceRef.current = Math.min(65, cameraDistanceRef.current + 3);
            updateCameraPosition();
          }}
          className="p-2 rounded-lg bg-[#0b121e]/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-xl"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-view"
          onClick={() => handleCameraPreset('FREE')}
          className="p-2 rounded-lg bg-[#0b121e]/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-xl"
          title="Reset Orientation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-10 px-3 py-2 rounded-xl bg-[#0b121e]/90 backdrop-blur-md border border-slate-800 text-[11px] font-telemetry text-slate-400 flex items-center gap-4 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-sky-400 inline-block" />
          <span className="text-slate-200">Satellite Orbit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-red-500 inline-block" />
          <span className="text-slate-200">Debris Threat</span>
        </div>
        {whatIfOrbitElements && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
            <span className="text-emerald-300 font-semibold">Simulated Burn</span>
          </div>
        )}
      </div>
    </div>
  );
};
