"use client";

import { useRef, useState, useEffect, useMemo, Suspense, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Mountain, RotateCcw, ZoomIn, ZoomOut, MapPin, Loader2, Calendar, Hammer, Sparkles, ExternalLink, X } from 'lucide-react';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { slovakiaBorderDetailed } from '../data/slovakia-border';

// ---------- Vintage pin ikony pre markery ----------
const PIN_CREAM = '#F5E9D0';
const PIN_UNESCO = '#E8C56E';
const PIN_FILL = {
  hrad: '#8B2E2E',
  hradisko: '#7D5A2A',
  zamok: '#3A2A5A',
} as const;
type PinKind = keyof typeof PIN_FILL;
const PIN_PATH = 'M18 47 C 13 41, 4 31, 4 18 A 14 14 0 1 1 32 18 C 32 31, 23 41, 18 47 Z';

function pinInner(type: PinKind): string {
  if (type === 'hrad') {
    return `
      <g fill="${PIN_CREAM}" stroke="${PIN_CREAM}" stroke-linejoin="round" stroke-width="0.4">
        <rect x="10" y="10" width="2.5" height="3.5"/>
        <rect x="13.75" y="10" width="2.5" height="3.5"/>
        <rect x="17.5" y="10" width="2.5" height="3.5"/>
        <rect x="21.25" y="10" width="2.5" height="3.5"/>
        <rect x="10" y="13.5" width="14" height="1.8"/>
        <rect x="10" y="13.5" width="14" height="13"/>
        <rect x="16.25" y="17.5" width="1.5" height="3.2" fill="${PIN_FILL.hrad}" stroke="none"/>
        <path d="M14 26.5 v-3.2 a3 3 0 0 1 6 0 v3.2 z" fill="${PIN_FILL.hrad}" stroke="none"/>
      </g>
    `;
  }
  if (type === 'hradisko') {
    return `
      <g stroke="${PIN_CREAM}" stroke-linecap="round" fill="none">
        <circle cx="17" cy="18" r="7.5" stroke-width="1.4"/>
        <g stroke-width="1.3">
          <line x1="17" y1="7.6" x2="17" y2="10"/>
          <line x1="23.4" y1="9.9" x2="22" y2="11.6"/>
          <line x1="27.4" y1="18" x2="25" y2="18"/>
          <line x1="23.4" y1="26.1" x2="22" y2="24.4"/>
          <line x1="10.6" y1="26.1" x2="12" y2="24.4"/>
          <line x1="6.6" y1="18" x2="9" y2="18"/>
          <line x1="10.6" y1="9.9" x2="12" y2="11.6"/>
        </g>
        <line x1="15" y1="25.5" x2="15" y2="28" stroke-width="1.3"/>
        <line x1="19" y1="25.5" x2="19" y2="28" stroke-width="1.3"/>
      </g>
    `;
  }
  return `
    <g fill="${PIN_CREAM}" stroke="${PIN_CREAM}" stroke-linejoin="round" stroke-width="0.4">
      <rect x="7.5" y="14" width="5" height="12.5"/>
      <polygon points="6,14 10,8.5 14,14"/>
      <rect x="21.5" y="14" width="5" height="12.5"/>
      <polygon points="20,14 24,8.5 28,14"/>
      <rect x="12.5" y="17.5" width="9" height="9"/>
      <path d="M15 26.5 v-3 a2 2 0 0 1 4 0 v3 z" fill="${PIN_FILL.zamok}" stroke="none"/>
    </g>
  `;
}

function makePinSvg(type: PinKind, isUnesco = false, size = 36): string {
  const stroke = isUnesco ? PIN_UNESCO : PIN_CREAM;
  const strokeW = isUnesco ? 2.2 : (type === 'hradisko' ? 2 : 1.5);
  const h = Math.round(size * (48 / 36));
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 36 48" style="overflow:visible; display:block;">
      <path d="${PIN_PATH}" fill="${PIN_FILL[type]}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
      ${pinInner(type)}
    </svg>
  `;
}

// Slovakia bounding box
const SLOVAKIA_BOUNDS = {
  minLon: 16.8,
  maxLon: 22.6,
  minLat: 47.7,
  maxLat: 49.7,
  width: 22.6 - 16.8,  // 5.8 degrees
  height: 49.7 - 47.7  // 2.0 degrees
};

// Hypsometric color palette – vintage parchment tones zladené s hnedo-zlatým UI
const HYPSOMETRIC_COLORS = [
  { elevation: 0,    color: new THREE.Color('#8B9670') },  // šalvia – nížiny
  { elevation: 200,  color: new THREE.Color('#9CA87A') },  // olivovo-šalviová
  { elevation: 400,  color: new THREE.Color('#C8B88A') },  // bledá okrová – pahorky
  { elevation: 600,  color: new THREE.Color('#C4A574') },  // teplá okra (UI tón)
  { elevation: 800,  color: new THREE.Color('#B58955') },  // svetlohnedá
  { elevation: 1200, color: new THREE.Color('#9A7042') },  // teplá hnedá
  { elevation: 2000, color: new THREE.Color('#D4C3A3') },  // bledý pergament – vyššie polohy
  { elevation: 2655, color: new THREE.Color('#F1E6CC') },  // krémová – hrebene
];

// Custom shader material for hypsometric coloring
const terrainVertexShader = `
  uniform sampler2D heightMap;
  uniform float heightScale;
  uniform float maxElevation;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;

    // Sample heightmap
    vec4 heightData = texture2D(heightMap, uv);
    float height = heightData.r;

    // Calculate elevation in meters (0-1 maps to 0-maxElevation)
    vElevation = height * maxElevation;

    // Displace vertex
    vec3 newPosition = position;
    newPosition.z = height * heightScale;

    // Calculate normal from heightmap for lighting - higher res
    float texelSize = 1.0 / 1024.0;
    float hL = texture2D(heightMap, uv - vec2(texelSize, 0.0)).r;
    float hR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r;
    float hD = texture2D(heightMap, uv - vec2(0.0, texelSize)).r;
    float hU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r;

    vec3 normal = normalize(vec3(
      (hL - hR) * heightScale * 2.0,
      (hD - hU) * heightScale * 2.0,
      1.0
    ));

    vNormal = normalMatrix * normal;
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const terrainFragmentShader = `
  uniform vec3 lightDirection;
  uniform float ambientStrength;
  uniform vec3 color0, color1, color2, color3, color4, color5, color6, color7;
  uniform float elev0, elev1, elev2, elev3, elev4, elev5, elev6, elev7;
  uniform float maxElevation;
  uniform sampler2D heightMap;
  uniform sampler2D maskTex;
  uniform vec3 bgColor;
  uniform float opacity;
  uniform float fogActive;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 getHypsometricColor(float elevation) {
    // Interpolate between color bands
    if (elevation < elev1) {
      return mix(color0, color1, (elevation - elev0) / (elev1 - elev0));
    } else if (elevation < elev2) {
      return mix(color1, color2, (elevation - elev1) / (elev2 - elev1));
    } else if (elevation < elev3) {
      return mix(color2, color3, (elevation - elev2) / (elev3 - elev2));
    } else if (elevation < elev4) {
      return mix(color3, color4, (elevation - elev3) / (elev4 - elev3));
    } else if (elevation < elev5) {
      return mix(color4, color5, (elevation - elev4) / (elev5 - elev4));
    } else if (elevation < elev6) {
      return mix(color5, color6, (elevation - elev5) / (elev6 - elev5));
    } else {
      return mix(color6, color7, clamp((elevation - elev6) / (elev7 - elev6), 0.0, 1.0));
    }
  }

  void main() {
    // Get base color from elevation
    vec3 baseColor = getHypsometricColor(vElevation);

    // Calculate lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightDirection);

    // Diffuse lighting
    float diff = max(dot(normal, lightDir), 0.0);

    // Ambient occlusion simulation from heightmap
    float texelSize = 1.0 / 1024.0;
    float centerHeight = texture2D(heightMap, vUv).r;
    float avgHeight = 0.0;
    for (float x = -2.0; x <= 2.0; x += 1.0) {
      for (float y = -2.0; y <= 2.0; y += 1.0) {
        avgHeight += texture2D(heightMap, vUv + vec2(x, y) * texelSize).r;
      }
    }
    avgHeight /= 25.0;
    float ao = 0.5 + 0.5 * smoothstep(-0.1, 0.1, centerHeight - avgHeight);

    // Combine lighting – tlmené, pergamenové
    vec3 ambient = ambientStrength * baseColor;
    vec3 diffuse = diff * baseColor * 0.45;

    vec3 finalColor = (ambient + diffuse) * mix(0.85, 1.0, ao);

    // Jemný rim pre dojem hĺbky bez prepalovania
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    finalColor += rim * 0.06 * baseColor;

    // Desaturovať – mierne posunúť k luminancii (vintage feeling)
    float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor = mix(finalColor, vec3(lum), 0.12);

    // Fade mimo hraníc SR do farby pozadia – maska má biele vnútri SR, čierne mimo, soft blur na hraniciach
    float mask = texture2D(maskTex, vUv).r;
    float smoothMask = smoothstep(0.0, 0.85, mask);
    finalColor = mix(bgColor, finalColor, smoothMask);

    // Atmosférický fog – iba v 3D, mixuje s farbou pozadia podľa vzdialenosti
    if (fogActive > 0.5) {
      float depth = length(vPosition);
      float fogFactor = smoothstep(fogNear, fogFar, depth);
      finalColor = mix(finalColor, fogColor, fogFactor * 0.7);
    }

    gl_FragColor = vec4(finalColor, opacity * smoothMask);
  }
`;


// Convert geo coords to mesh coords
function geoToMesh(lon: number, lat: number, meshWidth: number, meshHeight: number): [number, number] {
  const x = ((lon - SLOVAKIA_BOUNDS.minLon) / SLOVAKIA_BOUNDS.width) * meshWidth - meshWidth / 2;
  const y = ((lat - SLOVAKIA_BOUNDS.minLat) / SLOVAKIA_BOUNDS.height) * meshHeight - meshHeight / 2;
  return [x, y];
}

// Generuje alpha masku SR (biele vnútri, čierne mimo, s jemným blur na hraniciach)
// Slúži na fade okrajov terénu do farby pozadia
let _maskTextureCache: THREE.CanvasTexture | null = null;
function getSlovakiaMaskTexture(): THREE.CanvasTexture {
  if (_maskTextureCache) return _maskTextureCache;
  const W = 1024;
  const aspect = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
  const H = Math.round(W / aspect);

  // Krok 1: nakresliť polygon SR do offscreen canvasu
  const polyCanvas = document.createElement('canvas');
  polyCanvas.width = W;
  polyCanvas.height = H;
  const pctx = polyCanvas.getContext('2d')!;
  pctx.fillStyle = '#000';
  pctx.fillRect(0, 0, W, H);
  pctx.fillStyle = '#fff';
  pctx.beginPath();
  slovakiaBorderDetailed.forEach(([lon, lat], i) => {
    const px = ((lon - SLOVAKIA_BOUNDS.minLon) / SLOVAKIA_BOUNDS.width) * W;
    // Canvas y rastie nadol, takže sever (vyšší lat) má y blízko 0
    const py = H - ((lat - SLOVAKIA_BOUNDS.minLat) / SLOVAKIA_BOUNDS.height) * H;
    if (i === 0) pctx.moveTo(px, py);
    else pctx.lineTo(px, py);
  });
  pctx.closePath();
  pctx.fill();

  // Krok 2: kopia s blurom pre soft fade na okraji
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = W;
  blurCanvas.height = H;
  const bctx = blurCanvas.getContext('2d')!;
  bctx.fillStyle = '#000';
  bctx.fillRect(0, 0, W, H);
  bctx.filter = 'blur(10px)';
  bctx.drawImage(polyCanvas, 0, 0);

  const tex = new THREE.CanvasTexture(blurCanvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  _maskTextureCache = tex;
  return tex;
}

// Terrain mesh component
function TerrainMesh({
  heightScale = 0.4,
  is3D = true,
  onHover
}: {
  heightScale?: number;
  is3D?: boolean;
  onHover?: (info: { elevation: number; lat: number; lon: number } | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [heightMap, setHeightMap] = useState<THREE.Texture | null>(null);

  // Load heightmap texture with high quality settings
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/heightmaps/slovakia_heightmap.png', (texture) => {
      texture.minFilter = THREE.LinearMipMapLinearFilter;  // Better quality when zoomed out
      texture.magFilter = THREE.LinearFilter;  // Smooth when zoomed in
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = true;
      texture.anisotropy = 16;  // Better detail at angles
      setHeightMap(texture);
    });
  }, []);

  // Create shader material
  const shaderMaterial = useMemo(() => {
    if (!heightMap) return null;

    const maskTex = getSlovakiaMaskTexture();

    return new THREE.ShaderMaterial({
      uniforms: {
        heightMap: { value: heightMap },
        maskTex: { value: maskTex },
        bgColor: { value: new THREE.Color('#3a332a') }, // ladí so scene background
        fogActive: { value: is3D ? 1.0 : 0.0 },
        fogColor: { value: new THREE.Color('#3a332a') },
        fogNear: { value: 6.0 },
        fogFar: { value: 22.0 },
        heightScale: { value: is3D ? heightScale : 0.0 },
        maxElevation: { value: 2655.0 }, // Gerlach peak
        lightDirection: { value: new THREE.Vector3(1, 1, 2).normalize() },
        ambientStrength: { value: 0.55 },
        opacity: { value: 1.0 },
        // Hypsometric colors
        color0: { value: HYPSOMETRIC_COLORS[0].color },
        color1: { value: HYPSOMETRIC_COLORS[1].color },
        color2: { value: HYPSOMETRIC_COLORS[2].color },
        color3: { value: HYPSOMETRIC_COLORS[3].color },
        color4: { value: HYPSOMETRIC_COLORS[4].color },
        color5: { value: HYPSOMETRIC_COLORS[5].color },
        color6: { value: HYPSOMETRIC_COLORS[6].color },
        color7: { value: HYPSOMETRIC_COLORS[7].color },
        // Elevation thresholds
        elev0: { value: HYPSOMETRIC_COLORS[0].elevation },
        elev1: { value: HYPSOMETRIC_COLORS[1].elevation },
        elev2: { value: HYPSOMETRIC_COLORS[2].elevation },
        elev3: { value: HYPSOMETRIC_COLORS[3].elevation },
        elev4: { value: HYPSOMETRIC_COLORS[4].elevation },
        elev5: { value: HYPSOMETRIC_COLORS[5].elevation },
        elev6: { value: HYPSOMETRIC_COLORS[6].elevation },
        elev7: { value: HYPSOMETRIC_COLORS[7].elevation },
      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });
  }, [heightMap, is3D, heightScale]);

  // Update height scale + fog when toggling 2D/3D
  useEffect(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.heightScale.value = is3D ? heightScale : 0.0;
      shaderMaterial.uniforms.fogActive.value = is3D ? 1.0 : 0.0;
    }
  }, [is3D, heightScale, shaderMaterial]);

  // Create geometry with proper aspect ratio - HIGH RESOLUTION for zoom detail
  const geometry = useMemo(() => {
    const aspectRatio = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
    const width = 20;
    const height = width / aspectRatio;
    return new THREE.PlaneGeometry(width, height, 512, 512);  // Higher resolution mesh
  }, []);

  if (!heightMap || !shaderMaterial) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={shaderMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    />
  );
}

// Border line component - uses detailed Slovakia border coordinates with smooth interpolation
function BorderLine({ is3D, heightScale }: { is3D: boolean; heightScale: number }) {
  const linePoints = useMemo(() => {
    const aspectRatio = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
    const meshWidth = 20;
    const meshHeight = meshWidth / aspectRatio;

    // Convert geo coordinates to mesh coordinates
    const rawPoints = slovakiaBorderDetailed.map(([lon, lat]) => {
      const [x, y] = geoToMesh(lon, lat, meshWidth, meshHeight);
      return new THREE.Vector3(x, 0.04, -y);
    });

    // Create smooth curve using CatmullRom interpolation
    const curve = new THREE.CatmullRomCurve3(rawPoints, true, 'catmullrom', 0.5);

    // Get more points for smoother line (3x the original points)
    const smoothPoints = curve.getPoints(slovakiaBorderDetailed.length * 3);

    return smoothPoints.map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, []);

  if (linePoints.length < 2) return null;

  return (
    <group>
      {/* Jemný tmavý podklad pre čitateľnosť proti svetlejším okrovým plochám */}
      <Line
        points={linePoints}
        color="#2a2318"
        lineWidth={2.2}
        transparent
        opacity={0.45}
      />
      {/* Hlavná linka – jedna plynulá, tenká, vintage zlatá */}
      <Line
        points={linePoints}
        color="#c4a574"
        lineWidth={1.2}
        transparent
        opacity={0.95}
      />
    </group>
  );
}

// Detekcia reálnej fotky – place-hold.it / placeholder.com sú placeholdery
function hasRealPhoto(h: Hradisko): boolean {
  if (!h.fotka) return false;
  const lower = h.fotka.toLowerCase();
  if (lower.includes('place-hold.it')) return false;
  if (lower.includes('placeholder.com')) return false;
  if (lower.includes('placehold.co')) return false;
  return true;
}

// Pergamenový fallback pre lokality bez reálnej fotky:
// tmavé hnedé pozadie + veľká poloprozradčná ikona kategórie
function PhotoFallback({ type, className, style }: { type: PinKind; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background:
          'radial-gradient(ellipse at 30% 25%, #4a3f30 0%, #3a2f22 45%, #251d14 100%)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Subtle noise overlay pre pergamen-feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
          opacity: 0.25,
        }}
      />
      {/* Veľká poloprozradčná ikona kategórie */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.22 }}
      >
        <svg
          viewBox="0 0 36 48"
          width="62%"
          height="80%"
          style={{ maxWidth: 320, color: PIN_FILL[type] }}
          dangerouslySetInnerHTML={{ __html: pinInner(type) }}
        />
      </div>
      {/* Drobný popisok */}
      <div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          bottom: 14,
          color: 'rgba(245,233,208,0.55)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
        }}
      >
        Fotografia nie je k dispozícii
      </div>
    </div>
  );
}

// City marker component - Simple HTML sprite markers
function CityMarker({
  hradisko,
  is3D,
  heightScale,
  onClick,
  onZoomTo,
  isSelected,
  isDetailOpen,
  hoveredHradisko,
  onHover,
  enableTooltip,
  tooltipDomRef,
}: {
  hradisko: Hradisko;
  is3D: boolean;
  heightScale: number;
  onClick: () => void;
  onZoomTo: (position: [number, number, number]) => void;
  isSelected: boolean;
  isDetailOpen: boolean;
  hoveredHradisko: string | null;
  onHover: (name: string | null) => void;
  enableTooltip: boolean;
  tooltipDomRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const isHovered = hoveredHradisko === hradisko.name;

  const aspectRatio = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
  const meshWidth = 20;
  const meshHeight = meshWidth / aspectRatio;

  const [x, y] = geoToMesh(hradisko.coordinates[0], hradisko.coordinates[1], meshWidth, meshHeight);
  const estimatedElevation = (hradisko.nadmorskaVyska || 400) / 2655;
  const z = is3D ? estimatedElevation * heightScale * 2 + 0.15 : 0.15;

  // Premietnu 3D pozíciu pinu na screen a updatne shared tooltip DOM
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const { camera, size, gl } = useThree();

  // Helper – synchronne vypočíta a nastaví pozíciu tooltipu z aktuálnej kamery
  const updateTooltipPos = () => {
    const el = tooltipDomRef.current;
    if (!el) return;
    tmpVec.set(x, z, -y).project(camera);
    if (tmpVec.z > 1) {
      el.style.visibility = 'hidden';
      return;
    }
    const sx = (tmpVec.x * 0.5 + 0.5) * size.width;
    const sy = (-tmpVec.y * 0.5 + 0.5) * size.height;
    const rect = gl.domElement.getBoundingClientRect();
    el.style.left = `${Math.round(rect.left + sx)}px`;
    el.style.top = `${Math.round(rect.top + sy)}px`;
    el.style.visibility = 'visible';
  };

  // Pri prvom hover nastav pozíciu IHNEĎ po commit – bez čakania na ďalší RAF cyklus
  useEffect(() => {
    if (isHovered && enableTooltip) {
      updateTooltipPos();
    }
  });

  // Pri rotácii/zoome ďalej sleduj pin cez useFrame
  useFrame(() => {
    if (!isHovered || !enableTooltip) return;
    updateTooltipPos();
  });

  // Hide ALL markers when detail is open
  if (isDetailOpen) {
    return null;
  }

  const pinSvg = makePinSvg(hradisko.type as PinKind, !!hradisko.unesco, 34);
  const baseShadow = 'drop-shadow(0 3px 3px rgba(0,0,0,0.5))';
  const hoverShadow = hradisko.unesco
    ? 'drop-shadow(0 6px 7px rgba(0,0,0,0.6)) drop-shadow(0 0 4px rgba(232,197,110,0.8))'
    : 'drop-shadow(0 6px 7px rgba(0,0,0,0.6)) drop-shadow(0 0 4px rgba(245,233,208,0.7))';
  const showHi = isHovered || isSelected;

  return (
    <group position={[x, z, -y]}>
      <Html
        center
        distanceFactor={10}
        zIndexRange={isHovered ? [999998, 999999] : [1, 100]}
        style={{
          pointerEvents: 'auto',
          zIndex: isHovered ? 999999 : 1
        }}
      >
        {/* Outer wrapper – BEZ scale, slúži len ako anchor pre pin aj tooltip */}
        <div
          className="relative"
          style={{
            translate: '0 -50%',
            transformOrigin: '50% 100%',
            zIndex: isHovered ? 999999 : 1,
          }}
        >
          {/* Pin – scaled wrapper (transform sa nevzťahuje na tooltip) */}
          <div
            className="cursor-pointer"
            style={{
              transformOrigin: '50% 100%',
              transform: showHi ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.18s ease-out, filter 0.18s ease-out',
              filter: showHi ? hoverShadow : baseShadow,
              willChange: 'transform'
            }}
            onMouseEnter={() => onHover(hradisko.name)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onZoomTo([x, z, -y]);
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: pinSvg }} />
          </div>

          {/* Tooltip je renderovaný v hlavnom komponente mimo Canvas (HoverTooltipOverlay).
              CityMarker iba updatuje jeho pozíciu cez tooltipRef v useFrame. */}
        </div>
      </Html>
    </group>
  );
}

// Scene lighting
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />
    </>
  );
}

// ============================================================================
// Fit-to-bounds: vypočíta vzdialenosť kamery tak, aby sa celé Slovensko zmestilo
// do viewportu nezávisle na canvas aspect ratio.
// ============================================================================
const SLOVAKIA_MESH_W = 20;
const SLOVAKIA_MESH_H = SLOVAKIA_MESH_W / (SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height); // ≈ 6.897
const FIT_PADDING = 0.07; // 7 % padding na každej strane
const FOV_DEG = 60;

function computeFitDistance(canvasAspect: number): number {
  const fovY = (FOV_DEG * Math.PI) / 180;
  const halfH = SLOVAKIA_MESH_H / 2;
  const halfW = SLOVAKIA_MESH_W / 2;
  // Vertikálna distance: hĺbka mesha musí byť v zornom poli FOV
  const distV = halfH / Math.tan(fovY / 2);
  // Horizontálna distance: šírka mesha musí byť v zornom poli FOV * aspect
  const distH = halfW / (Math.tan(fovY / 2) * canvasAspect);
  // Vezmeme obmedzujúci rozmer (väčšiu vzdialenosť)
  return Math.max(distV, distH) * (1 + FIT_PADDING);
}

function fitCameraPosition(dist: number, is3D: boolean): [number, number, number] {
  if (is3D) {
    // Diagonálny pohľad pod uhlom 45° (vyšší + posunutý dozadu o rovnaký podiel)
    const angle = Math.PI / 4;
    return [0, dist * Math.sin(angle), dist * Math.cos(angle)];
  }
  // 2D pohľad zhora – Y = fit distance, drobný Z offset pre stabilný lookAt
  return [0, dist, 0.001];
}

// FitCamera – sleduje canvas size a is3D, nastaví kameru do fit pozície,
// rešpektuje user interakciu (po nej už neresetuje pri resize)
function FitCamera({
  is3D, onDistance, userInteractedRef, controlsRef,
}: {
  is3D: boolean;
  onDistance: (d: number) => void;
  userInteractedRef: React.MutableRefObject<boolean>;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const dist = computeFitDistance(aspect);
    onDistance(dist);

    if (!userInteractedRef.current) {
      const pos = fitCameraPosition(dist, is3D);
      camera.position.set(pos[0], pos[1], pos[2]);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [size.width, size.height, is3D, camera, onDistance, userInteractedRef, controlsRef]);

  return null;
}

// Loading component
function LoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-amber-100 font-serif">Načítavam mapu...</span>
      </div>
    </Html>
  );
}

// Hover tooltip overlay – renderuje sa MIMO Canvas (v normálnom DOM tree),
// vnútorne cez createPortal do document.body, čím je zaručene nad WebGL canvasom.
// CityMarker iba updatuje style.left/top na vnútornom ref v useFrame – tooltip ostáva v body.
const HoverTooltipOverlay = forwardRef<HTMLDivElement, { hradisko: Hradisko }>(
  function HoverTooltipOverlay({ hradisko }, ref) {
    if (typeof document === 'undefined') return null;
    const pinColor = PIN_FILL[hradisko.type as PinKind];
    const typeLabel = hradisko.type === 'hrad' ? 'Hrad' : hradisko.type === 'zamok' ? 'Zámok' : 'Hradisko';
    const fact1 = hradisko.rok;
    const fact2 = hradisko.stav;
    const location = hradisko.okres ? `${hradisko.okres} · ${hradisko.kraj}` : hradisko.kraj;
    return createPortal(
      <div
        ref={ref}
        className="animate-tooltip-in"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          // Tooltip "vyrastá" zo špičky pinu nahor: bottom-center anchor (-50%, -100%) + posun nad pin (-58 px)
          transform: 'translate(-50%, calc(-100% - 58px))',
          width: 240,
          pointerEvents: 'none',
          zIndex: 2147483647,
          visibility: 'hidden', // useFrame v CityMarker ihneď v ďalšom frame nastaví správnu pozíciu a visible
          willChange: 'left, top',
        }}
      >
        <div
          style={{
            backgroundColor: '#1a1510',
            border: '1px solid #c4a574',
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(0,0,0,0.7), 0 0 0 3px rgba(0,0,0,0.4)',
            padding: '9px 12px 10px',
            position: 'relative',
          }}
        >
          {/* Badge typu + UNESCO */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(245,233,208,0.10)',
              border: `1px solid ${pinColor}aa`,
              color: PIN_CREAM,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: pinColor }} />
              {typeLabel}
            </span>
            {hradisko.unesco && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 6px',
                borderRadius: 999,
                background: PIN_UNESCO,
                color: '#3a2a10',
                fontSize: 8.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>★ UNESCO</span>
            )}
          </div>
          {/* Názov */}
          <div style={{
            fontFamily: 'Georgia, serif',
            color: '#fdfbf6',
            fontSize: 14,
            lineHeight: 1.2,
            fontWeight: 600,
          }}>
            {hradisko.name}
          </div>
          {/* Lokalita */}
          <div style={{
            color: '#c8b89a',
            fontSize: 11,
            marginTop: 2,
          }}>
            {location}
          </div>
          {/* 2 fakty */}
          <div style={{
            color: '#f0e3c8',
            fontSize: 11,
            marginTop: 4,
            letterSpacing: '0.02em',
          }}>
            {fact1} <span style={{ color: '#c4a574', margin: '0 4px' }}>·</span> {fact2}
          </div>
          {/* Mikro-hint */}
          <div style={{
            color: '#c4a574',
            fontSize: 9,
            marginTop: 6,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
            opacity: 0.9,
          }}>
            kliknite pre detail
          </div>
          {/* Šípka dole – outline (amber) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(100% + 1px)',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #c4a574',
          }} />
          {/* Šípka dole – fill (matches tooltip bg) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid #1a1510',
          }} />
        </div>
      </div>,
      document.body,
    );
  }
);

// Main map component
export default function Slovakia3DReliefMap() {
  // Mapa je permanentne v 2D pohľade (3D toggle bol odstránený)
  const is3D = false;
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [hoveredHradisko, setHoveredHradisko] = useState<string | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState<Record<PinKind, boolean>>({
    hrad: true,
    hradisko: true,
    zamok: true,
  });
  const toggleType = (t: PinKind) =>
    setEnabledTypes(prev => ({ ...prev, [t]: !prev[t] }));

  // Touch detection – na zariadeniach bez hovera vypneme hover tooltip (ide rovno modal)
  const enableTooltip = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(hover: none)').matches;
  }, []);

  // Zdielaný DOM ref pre hover tooltip overlay – tooltip žije v <body>,
  // CityMarker v useFrame iba mutuje style.left/top
  const tooltipDomRef = useRef<HTMLDivElement | null>(null);

  // Anti-flicker hover handler – mouseleave debounced o 60ms,
  // aby prechod medzi blízkymi markermi nezablikal
  const hoverTimeoutRef = useRef<number | null>(null);
  const handleHover = (name: string | null) => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (name) {
      setHoveredHradisko(name);
    } else {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredHradisko(null);
        hoverTimeoutRef.current = null;
      }, 60);
    }
  };
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Fit-to-bounds: distance ktorú vypočítal FitCamera + flag či user manuálne nezačal interagovať
  const [fitDistance, setFitDistance] = useState(8);
  const userInteractedRef = useRef(false);
  const heightScale = 1.0;  // More pronounced relief

  // Handle click outside to deactivate map zoom
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMapActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC zatvára detail modal
  useEffect(() => {
    if (!selectedHradisko) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedHradisko(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedHradisko]);

  // Scroll v ľubovoľnom smere zatvára modal (grace period 300 ms aby sa nezatvoril ihneď po otvorení)
  useEffect(() => {
    if (!selectedHradisko) return;
    const openedAt = Date.now();
    const onWheel = (e: WheelEvent) => {
      if (Date.now() - openedAt < 300) return;
      if (Math.abs(e.deltaY) > 20) setSelectedHradisko(null);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [selectedHradisko]);

  // Verejné API: window event 'focus-hradisko' { detail: { name } }
  // – scrollne k mape a zoom-tne na marker zodpovedajúci názvu hradiska
  useEffect(() => {
    const onFocus = (e: Event) => {
      const ev = e as CustomEvent<{ name: string }>;
      const targetName = ev.detail?.name;
      if (!targetName) return;
      const target = hradiskaData.find(h => h.name === targetName);
      if (!target) return;
      // 1. Scroll do view + aktivuj mapu
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsMapActive(true);
      // 2. Po krátkej pauze (aby scroll dobiehal) zoomni na marker
      setTimeout(() => {
        const aspect = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
        const mw = 20;
        const mh = mw / aspect;
        const [mx, my] = geoToMesh(target.coordinates[0], target.coordinates[1], mw, mh);
        const mz = 0.15;
        zoomToPosition([mx, mz, -my]);
      }, 600);
    };
    window.addEventListener('focus-hradisko', onFocus as EventListener);
    return () => window.removeEventListener('focus-hradisko', onFocus as EventListener);
  }, []);

  // Po navigácii z inej stránky (napr. /aktuality) zachyť pending focus zo sessionStorage
  useEffect(() => {
    const pending = sessionStorage.getItem('pending-focus-hradisko');
    if (!pending) return;
    sessionStorage.removeItem('pending-focus-hradisko');
    // Krátky delay aby sa scéna stihla namountovať
    const t = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('focus-hradisko', { detail: { name: pending } }));
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  const resetView = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const pos = fitCameraPosition(fitDistance, is3D);
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    userInteractedRef.current = false; // ďalší resize bude opäť fit
  };

  const zoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.8);
      controlsRef.current.update();
      userInteractedRef.current = true; // používateľ priblížil, resize už nesmie resetovať
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.2);
      controlsRef.current.update();
      userInteractedRef.current = true;
    }
  };

  // Zoom to specific position with smooth animation
  const zoomToPosition = (targetPos: [number, number, number]) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;

      // Set new target for OrbitControls
      controls.target.set(targetPos[0], targetPos[1], targetPos[2]);

      // Move camera to look at target from above and slightly back
      const newCameraPos = {
        x: targetPos[0],
        y: targetPos[1] + 2,
        z: targetPos[2] + 2
      };

      // Animate camera position
      const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        camera.position.x = startPos.x + (newCameraPos.x - startPos.x) * eased;
        camera.position.y = startPos.y + (newCameraPos.y - startPos.y) * eased;
        camera.position.z = startPos.z + (newCameraPos.z - startPos.z) * eased;

        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
      setIsMapActive(true);
    }
  };

  return (
    <div
      className="relative w-full"
      style={{
        minHeight: '820px',
        background: 'linear-gradient(180deg, #3d352a 0%, #4a4035 15%, #3d352a 50%, #342d24 85%, #2c2418 100%)'
      }}
    >
      {/* Parchment texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 20%, rgba(212, 192, 160, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(212, 192, 160, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(196, 165, 116, 0.1) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
          `
        }}
      />

      {/* Decorative top border pattern */}
      <div
        className="absolute top-0 left-0 right-0 h-3 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #8b7355 10%, #c4a574 50%, #8b7355 90%, transparent 100%)',
          opacity: 0.6
        }}
      />
      <div
        className="absolute top-3 left-0 right-0 h-1 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #5d4e37 10%, #8b7355 50%, #5d4e37 90%, transparent 100%)',
          opacity: 0.4
        }}
      />

      {/* Decorative corner flourishes - larger and more ornate */}
      <div className="absolute top-6 left-6 text-6xl opacity-30 pointer-events-none" style={{ color: '#c4a574', fontFamily: 'Georgia, serif' }}>❦</div>
      <div className="absolute top-6 right-6 text-6xl opacity-30 pointer-events-none" style={{ color: '#c4a574', fontFamily: 'Georgia, serif', transform: 'scaleX(-1)' }}>❦</div>
      <div className="absolute bottom-6 left-6 text-6xl opacity-30 pointer-events-none" style={{ color: '#c4a574', fontFamily: 'Georgia, serif', transform: 'scaleY(-1)' }}>❦</div>
      <div className="absolute bottom-6 right-6 text-6xl opacity-30 pointer-events-none" style={{ color: '#c4a574', fontFamily: 'Georgia, serif', transform: 'scale(-1)' }}>❦</div>

      {/* Additional corner ornaments */}
      <div className="absolute top-16 left-16 text-2xl opacity-20 pointer-events-none" style={{ color: '#d4c0a0' }}>✧</div>
      <div className="absolute top-16 right-16 text-2xl opacity-20 pointer-events-none" style={{ color: '#d4c0a0' }}>✧</div>
      <div className="absolute bottom-16 left-16 text-2xl opacity-20 pointer-events-none" style={{ color: '#d4c0a0' }}>✧</div>
      <div className="absolute bottom-16 right-16 text-2xl opacity-20 pointer-events-none" style={{ color: '#d4c0a0' }}>✧</div>

      {/* Decorative border lines - double line effect */}
      <div className="absolute top-14 left-14 right-14 h-px opacity-40 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #c4a574, transparent)' }} />
      <div className="absolute top-16 left-20 right-20 h-px opacity-25 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #d4c0a0, transparent)' }} />
      <div className="absolute bottom-14 left-14 right-14 h-px opacity-40 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #c4a574, transparent)' }} />
      <div className="absolute bottom-16 left-20 right-20 h-px opacity-25 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #d4c0a0, transparent)' }} />
      <div className="absolute top-14 bottom-14 left-14 w-px opacity-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
      <div className="absolute top-20 bottom-20 left-16 w-px opacity-25 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, #d4c0a0, transparent)' }} />
      <div className="absolute top-14 bottom-14 right-14 w-px opacity-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
      <div className="absolute top-20 bottom-20 right-16 w-px opacity-25 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, #d4c0a0, transparent)' }} />

      {/* Side decorative elements */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block">
        <div className="flex flex-col items-center gap-4" style={{ color: '#c4a574' }}>
          <span className="text-2xl">⚜</span>
          <div className="w-px h-20" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
          <span className="text-lg">❧</span>
          <div className="w-px h-20" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
          <span className="text-2xl">⚜</span>
        </div>
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block">
        <div className="flex flex-col items-center gap-4" style={{ color: '#c4a574' }}>
          <span className="text-2xl">⚜</span>
          <div className="w-px h-20" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
          <span className="text-lg" style={{ transform: 'scaleX(-1)' }}>❧</span>
          <div className="w-px h-20" style={{ background: 'linear-gradient(180deg, transparent, #c4a574, transparent)' }} />
          <span className="text-2xl">⚜</span>
        </div>
      </div>

      {/* Decorative Header - parchment style */}
      <div
        className="relative border-b py-5 px-6"
        style={{
          background: 'linear-gradient(180deg, rgba(44, 36, 24, 0.9) 0%, rgba(26, 21, 16, 0.95) 100%)',
          borderColor: 'rgba(196, 165, 116, 0.3)'
        }}
      >
        {/* Header ornamental line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ color: '#c4a574' }}>
          <span className="opacity-60">═══</span>
          <span className="text-xl">⚜</span>
          <span className="opacity-60">═══</span>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-center md:text-left flex-1">
            {/* Title with decorative elements */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <span className="hidden md:inline text-2xl opacity-60" style={{ color: '#c4a574' }}>☙</span>
              <h2
                className="text-2xl md:text-4xl tracking-widest"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.15em',
                  color: '#e8dcc8',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                MAPA HRADÍSK
              </h2>
              <span className="hidden md:inline text-2xl opacity-60" style={{ color: '#c4a574', transform: 'scaleX(-1)' }}>☙</span>
            </div>
            <p
              className="text-sm mt-2 tracking-wide"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#a89f8f',
                fontStyle: 'italic'
              }}
            >
              ~ Preskúmajte {hradiskaData.length} hradísk, hradov a zámkov Slovenska ~
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <span
              className="px-4 py-2 rounded-lg text-xs tracking-wider"
              style={{
                background: 'rgba(196, 165, 116, 0.15)',
                border: '1px solid rgba(196, 165, 116, 0.3)',
                color: '#c4a574',
                fontFamily: 'Georgia, serif'
              }}
            >
              ⟲ Ťahaj pre rotáciu
            </span>
            <span
              className="px-4 py-2 rounded-lg text-xs tracking-wider"
              style={{
                background: 'rgba(196, 165, 116, 0.15)',
                border: '1px solid rgba(196, 165, 116, 0.3)',
                color: '#c4a574',
                fontFamily: 'Georgia, serif'
              }}
            >
              ⊕ Koliesko pre zoom
            </span>
          </div>
        </div>
      </div>

      {/* Map Container with ornate Frame and Sidebar */}
      <div className="p-2 md:p-4 relative">
        <div className="relative">
          {/* Map with ornate frame */}
          <div
            className="relative rounded-2xl p-1"
            style={{
              background: 'linear-gradient(135deg, #c4a574 0%, #8b7355 25%, #5d4e37 50%, #8b7355 75%, #c4a574 100%)'
            }}
          >
            {/* Inner shadow frame */}
            <div
              className="rounded-xl p-0.5"
              style={{
                background: 'linear-gradient(135deg, #3d3426 0%, #2a2318 50%, #3d3426 100%)'
              }}
            >
            <div
              ref={containerRef}
              className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                isMapActive
                  ? 'shadow-2xl shadow-amber-900/50'
                  : 'hover:shadow-xl hover:shadow-amber-900/30'
              }`}
              style={{ height: 'calc(100vh - 140px)', minHeight: '700px' }}
              onClick={() => setIsMapActive(true)}
            >
              {/* Ornate corner decorations */}
              <div className="absolute top-2 left-2 text-3xl z-20 pointer-events-none opacity-40" style={{ color: '#c4a574' }}>╔</div>
              <div className="absolute top-2 right-2 text-3xl z-20 pointer-events-none opacity-40" style={{ color: '#c4a574' }}>╗</div>
              <div className="absolute bottom-2 left-2 text-3xl z-20 pointer-events-none opacity-40" style={{ color: '#c4a574' }}>╚</div>
              <div className="absolute bottom-2 right-2 text-3xl z-20 pointer-events-none opacity-40" style={{ color: '#c4a574' }}>╝</div>

              {/* Activation hint overlay - hide when detail is open */}
              {!isMapActive && !selectedHradisko && (
                <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                  <div
                    className="px-4 py-2 rounded-lg backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(44, 36, 24, 0.9) 0%, rgba(26, 21, 16, 0.9) 100%)',
                      border: '1px solid rgba(196, 165, 116, 0.4)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}
                  >
                    <p
                      className="text-sm tracking-wide"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        color: '#e8dcc8'
                      }}
                    >
                      ✦ Klikni na mapu pre aktiváciu ✦
                    </p>
                  </div>
                </div>
              )}

              {/*
                PERF: pôvodný setup bol `dpr={[1, 2]}` bez `frameloop` (default "always" = render 60fps non-stop).
                Po optimalizácii: `dpr={[1, 1.5]}` (nižší GPU load na hi-DPI) + `frameloop="demand"`
                (R3F renderuje len keď sa zmení state — hover/orbit/marker). Ak by mapa "stuhla"
                alebo bola potreba kontinuálnej animácie, vráť späť `dpr={[1, 2]}` a odstráň `frameloop`.
              */}
              <Canvas
                camera={{ position: [0, 5, 5], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}
                frameloop="demand"
                style={{ width: '100%', height: '100%' }}
              >
                {/* Warm parchment-like background */}
                <color attach="background" args={['#3a332a']} />
            <Suspense fallback={<LoadingScreen />}>
              <SceneLighting />
              <FitCamera
                is3D={is3D}
                onDistance={setFitDistance}
                userInteractedRef={userInteractedRef}
                controlsRef={controlsRef}
              />
              <TerrainMesh heightScale={heightScale} is3D={is3D} />
              <BorderLine is3D={is3D} heightScale={heightScale} />
              {hradiskaData
                .filter(h => enabledTypes[h.type as PinKind])
                .map((hradisko) => (
                <CityMarker
                  key={hradisko.name}
                  hradisko={hradisko}
                  is3D={is3D}
                  heightScale={heightScale}
                  onClick={() => setSelectedHradisko(hradisko)}
                  onZoomTo={zoomToPosition}
                  isSelected={selectedHradisko?.name === hradisko.name}
                  isDetailOpen={selectedHradisko !== null}
                  hoveredHradisko={hoveredHradisko}
                  onHover={handleHover}
                  enableTooltip={enableTooltip}
                  tooltipDomRef={tooltipDomRef}
                />
              ))}
              <OrbitControls
                ref={controlsRef}
                enablePan={isMapActive}
                enableZoom={isMapActive}
                enableRotate={is3D && isMapActive}
                minDistance={2}
                // max oddialenie = fit × 0.9 (cap aby sa nedalo ujsť do prázdna)
                maxDistance={fitDistance * 1.1}
                maxPolarAngle={is3D ? Math.PI / 2.2 : Math.PI / 2}
                minPolarAngle={0}
                onStart={() => { userInteractedRef.current = true; }}
              />
              </Suspense>
              </Canvas>

              {/* Compact floating controls - top right (jednotný štýl) */}
              {!selectedHradisko && (() => {
                const iconBtn: React.CSSProperties = {
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid rgba(196, 165, 116, 0.5)',
                  background: 'rgba(31, 26, 20, 0.95)',
                  color: '#c4a574',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'filter 0.18s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                };

                return (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <button onClick={zoomIn} style={iconBtn} className="hover:brightness-125" title="Priblížiť">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <button onClick={zoomOut} style={iconBtn} className="hover:brightness-125" title="Oddialiť">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <button onClick={resetView} style={iconBtn} className="hover:brightness-125" title="Reset pohľadu">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Compact legend bar - bottom center, horizontal */}
              {!selectedHradisko && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-lg px-4 py-2 shadow-lg flex items-center gap-6"
                style={{
                  background: 'rgba(31, 26, 20, 0.95)',
                  border: '1px solid rgba(196, 165, 116, 0.4)'
                }}
              >
                {/* Location types – klikateľné filtre */}
                <div className="flex items-center gap-3">
                  {(['hrad', 'hradisko', 'zamok'] as PinKind[]).map((t) => {
                    const labels: Record<PinKind, string> = { hrad: 'Hrad', hradisko: 'Hradisko', zamok: 'Zámok' };
                    const isOn = enabledTypes[t];
                    return (
                      <button
                        key={t}
                        onClick={(e) => { e.stopPropagation(); toggleType(t); }}
                        className="flex items-center gap-1.5 cursor-pointer select-none"
                        style={{
                          opacity: isOn ? 1 : 0.35,
                          transition: 'opacity 0.18s ease-out',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                        }}
                        aria-label={isOn ? `Skryť ${labels[t]}` : `Zobraziť ${labels[t]}`}
                        aria-pressed={isOn}
                        title={isOn ? `Skryť: ${labels[t]}` : `Zobraziť: ${labels[t]}`}
                      >
                        <span
                          style={{ width: 14, height: 19, display: 'inline-flex', alignItems: 'flex-end' }}
                          dangerouslySetInnerHTML={{ __html: makePinSvg(t, false, 14) }}
                        />
                        <span
                          className="text-[10px]"
                          style={{
                            color: isOn ? '#e8dcc8' : '#a89f8f',
                            textDecoration: isOn ? 'none' : 'line-through',
                            fontFamily: 'Georgia, serif',
                          }}
                        >
                          {labels[t]}
                        </span>
                      </button>
                    );
                  })}
                  {/* UNESCO indikátor – zlatý outline */}
                  <span
                    className="flex items-center gap-1.5"
                    style={{ paddingLeft: 4, borderLeft: '1px solid rgba(196,165,116,0.25)' }}
                  >
                    <span
                      style={{ width: 14, height: 19, display: 'inline-flex', alignItems: 'flex-end' }}
                      dangerouslySetInnerHTML={{ __html: makePinSvg('hrad', true, 14) }}
                    />
                    <span className="text-[10px]" style={{ color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>UNESCO</span>
                  </span>
                </div>

                {/* Divider */}
                <div className="w-px h-4" style={{ background: 'rgba(196, 165, 116, 0.3)' }} />

                {/* Elevation gradient bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: '#a89f8f' }}>0m</span>
                  <div
                    className="w-24 h-2.5 rounded-sm"
                    style={{
                      background: `linear-gradient(to right,
                        rgb(${Math.round(HYPSOMETRIC_COLORS[0].color.r * 255)}, ${Math.round(HYPSOMETRIC_COLORS[0].color.g * 255)}, ${Math.round(HYPSOMETRIC_COLORS[0].color.b * 255)}),
                        rgb(${Math.round(HYPSOMETRIC_COLORS[2].color.r * 255)}, ${Math.round(HYPSOMETRIC_COLORS[2].color.g * 255)}, ${Math.round(HYPSOMETRIC_COLORS[2].color.b * 255)}),
                        rgb(${Math.round(HYPSOMETRIC_COLORS[4].color.r * 255)}, ${Math.round(HYPSOMETRIC_COLORS[4].color.g * 255)}, ${Math.round(HYPSOMETRIC_COLORS[4].color.b * 255)}),
                        rgb(${Math.round(HYPSOMETRIC_COLORS[6].color.r * 255)}, ${Math.round(HYPSOMETRIC_COLORS[6].color.g * 255)}, ${Math.round(HYPSOMETRIC_COLORS[6].color.b * 255)})
                      )`
                    }}
                  />
                  <span className="text-[10px]" style={{ color: '#a89f8f' }}>2655m</span>
                </div>

                {/* Divider */}
                <div className="w-px h-4" style={{ background: 'rgba(196, 165, 116, 0.3)' }} />

                {/* Count – zobrazí viditeľné z celkového počtu */}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" style={{ color: '#c4a574' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#e8dcc8' }}>
                    {hradiskaData.filter(h => enabledTypes[h.type as PinKind]).length} / {hradiskaData.length} lokalít
                  </span>
                </div>
              </div>
              )}

            </div>
          </div>
          </div>

          {/* Hover tooltip je teraz ukotvený priamo k markeru (vnútri CityMarker cez drei Html) */}
        </div>
      </div>

      {/* Detail Modal – moderný čistý dizajn s vintage paletou */}
      <AnimatePresence>
        {selectedHradisko && (() => {
          const pinColor = PIN_FILL[selectedHradisko.type as PinKind];
          const typeLabel = selectedHradisko.type === 'hrad' ? 'Hrad' : selectedHradisko.type === 'zamok' ? 'Zámok' : 'Hradisko';
          // DEMO: vždy zobraz fotku – buď zo skutočných dát, alebo zdielanú demo URL
          const DEMO_PHOTO = 'https://images.unsplash.com/photo-1568797629485-c2a3f1e37e14?w=1280&h=720&fit=crop&q=80';
          const photoUrl = hasRealPhoto(selectedHradisko) ? selectedHradisko.fotka! : DEMO_PHOTO;
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
              {/* Backdrop – glassmorphism */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'rgba(20, 16, 10, 0.6)',
                  backdropFilter: 'blur(10px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedHradisko(null)}
              />

              {/* Card */}
              <motion.div
                className="relative w-full max-w-3xl overflow-hidden"
                style={{
                  background: '#faf7f1',
                  borderRadius: 20,
                  boxShadow: '0 30px 70px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,165,116,0.4)',
                  maxHeight: 'calc(100vh - 64px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Hero 16:9 – DEMO: vždy fotka */}
                <div className="relative flex-shrink-0 w-full" style={{ aspectRatio: '16 / 9', maxHeight: 360 }}>
                  <img
                    src={photoUrl}
                    alt={selectedHradisko.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Spodný gradient pre čitateľnosť chipov */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(20,16,10,0.45) 0%, transparent 25%, transparent 75%, rgba(20,16,10,0.55) 100%)'
                  }} />

                  {/* Veľký close button v tmavom kruhu – nestratí sa ani na fotke ani na pergamen */}
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all hover:brightness-110"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'rgba(15,11,7,0.78)',
                      color: '#faf7f1',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(196,165,116,0.45)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    aria-label="Zavrieť"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Chipy vľavo hore */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
                      style={{ background: 'rgba(250,247,241,0.95)', color: pinColor, letterSpacing: '0.1em', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: pinColor }} />
                      {typeLabel}
                    </div>
                    {selectedHradisko.unesco && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                        style={{ background: PIN_UNESCO, color: '#3a2a10', letterSpacing: '0.1em', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                        <Sparkles className="w-3.5 h-3.5" /> UNESCO
                      </div>
                    )}
                  </div>
                </div>

                {/* Telo karty – title pod fotkou pre garantovanú čitateľnosť */}
                <div className="overflow-y-auto px-6 md:px-8 pt-6" style={{ flex: '1 1 auto', paddingBottom: 56 }}>
                  {/* Title */}
                  <h2 className="font-semibold leading-tight tracking-tight"
                    style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 36px)', color: '#2d1810' }}>
                    {selectedHradisko.name}
                  </h2>

                  {/* Lokalita so zlatou pin ikonkou */}
                  <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: '#7d4f1d' }}>
                    <MapPin className="w-4 h-4" style={{ color: '#c4a574' }} />
                    {selectedHradisko.okres ? `${selectedHradisko.okres} · ${selectedHradisko.kraj} kraj` : `${selectedHradisko.kraj} kraj`}
                  </p>

                  {/* Tenká zlatá linka */}
                  <div className="h-px my-5" style={{
                    background: 'linear-gradient(90deg, transparent 0%, #c4a574 25%, #c4a574 75%, transparent 100%)'
                  }} />

                  {/* Popis – line-height 1.6, max ~70 znakov na riadok */}
                  {selectedHradisko.description && (
                    <p className="mb-6"
                      style={{ color: '#4a3f35', fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.65, maxWidth: '68ch' }}>
                      {selectedHradisko.description}
                    </p>
                  )}

                  {/* Info grid – 4 stĺpce desktop, 2×2 mobile */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { icon: Calendar, label: 'Obdobie', value: selectedHradisko.rok },
                      { icon: Hammer, label: 'Stav', value: selectedHradisko.stav },
                      { icon: MapPin, label: 'Okres', value: selectedHradisko.okres || '—' },
                      { icon: Mountain, label: 'Výška', value: `${selectedHradisko.nadmorskaVyska} m` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="px-3 py-3 rounded-xl"
                        style={{
                          background: 'rgba(196,165,116,0.10)',
                          border: '1px solid rgba(196,165,116,0.28)',
                        }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: '#c4a574' }} />
                          <span className="text-[10px] uppercase font-medium" style={{ color: '#8b7355', letterSpacing: '0.12em' }}>
                            {label}
                          </span>
                        </div>
                        <div className="text-[15px] font-medium leading-snug truncate" style={{ color: '#2d1810' }} title={String(value)}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Akcie – primárne tlačidlo dominantné, sekundárne outline (rovnaká výška) */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => window.open(`https://www.google.com/maps?q=${selectedHradisko.coordinates[1]},${selectedHradisko.coordinates[0]}`, '_blank')}
                      className="flex-1 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                      style={{
                        height: 44,
                        background: 'linear-gradient(135deg, #7d4f1d 0%, #a87437 100%)',
                        color: '#faf7f1',
                        boxShadow: '0 4px 12px rgba(125,79,29,0.4)',
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Otvoriť v Google Maps
                    </button>
                    <button
                      onClick={() => setSelectedHradisko(null)}
                      className="rounded-xl font-medium text-sm transition-all hover:bg-amber-50 sm:px-6"
                      style={{
                        height: 44,
                        background: 'transparent',
                        color: '#5d4e37',
                        border: '1px solid rgba(93,78,55,0.35)',
                      }}
                    >
                      Zavrieť
                    </button>
                  </div>
                  {/* Garantovaný spacer pod tlačidlami (Chrome scrollable-flex padding-bottom bug workaround) */}
                  <div aria-hidden="true" style={{ height: 8 }} />
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Hover tooltip overlay – renderovaný v body cez portál, mimo Canvas.
          Pozícia sa nastavuje v CityMarker useFrame cez tooltipDomRef. */}
      {hoveredHradisko && enableTooltip && !selectedHradisko && (() => {
        const h = hradiskaData.find(x => x.name === hoveredHradisko);
        return h ? <HoverTooltipOverlay ref={tooltipDomRef} hradisko={h} /> : null;
      })()}

      {/* Decorative Footer - matching parchment theme */}
      <div
        className="relative border-t py-5 px-8"
        style={{
          background: 'linear-gradient(180deg, rgba(26, 21, 16, 0.95) 0%, rgba(44, 36, 24, 0.9) 100%)',
          borderColor: 'rgba(196, 165, 116, 0.3)'
        }}
      >
        {/* Footer ornamental line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ color: '#c4a574' }}>
          <span className="opacity-60">═══</span>
          <span className="text-lg">❖</span>
          <span className="opacity-60">═══</span>
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#8b7355' }}>
            ✦ SRTM Data • © OpenStreetMap • GADM Boundaries ✦
          </p>
          <div className="flex items-center gap-4">
            {isMapActive && (
              <button
                onClick={() => setIsMapActive(false)}
                className="text-xs transition-colors hover:opacity-80"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#c4a574' }}
              >
                ⟨ Klikni mimo mapy pre scrollovanie ⟩
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
