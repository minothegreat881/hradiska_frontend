"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Mountain, RotateCcw, ZoomIn, ZoomOut, Layers, MapPin, Loader2 } from 'lucide-react';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { slovakiaBorderDetailed } from '../data/slovakia-border';

// Slovakia bounding box
const SLOVAKIA_BOUNDS = {
  minLon: 16.8,
  maxLon: 22.6,
  minLat: 47.7,
  maxLat: 49.7,
  width: 22.6 - 16.8,  // 5.8 degrees
  height: 49.7 - 47.7  // 2.0 degrees
};

// Hypsometric color palette (elevation -> color)
const HYPSOMETRIC_COLORS = [
  { elevation: 0, color: new THREE.Color(0.27, 0.64, 0.35) },     // Dark green (lowlands)
  { elevation: 200, color: new THREE.Color(0.53, 0.74, 0.45) },   // Light green
  { elevation: 400, color: new THREE.Color(0.96, 0.91, 0.63) },   // Yellow
  { elevation: 600, color: new THREE.Color(0.93, 0.80, 0.51) },   // Light brown
  { elevation: 800, color: new THREE.Color(0.84, 0.67, 0.42) },   // Brown
  { elevation: 1200, color: new THREE.Color(0.73, 0.57, 0.34) },  // Dark brown
  { elevation: 2000, color: new THREE.Color(0.61, 0.46, 0.28) },  // Very dark brown
  { elevation: 2655, color: new THREE.Color(0.95, 0.95, 0.95) },  // Snow white (peaks)
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
  uniform float opacity;

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

    // Combine lighting
    vec3 ambient = ambientStrength * baseColor;
    vec3 diffuse = diff * baseColor * 0.6;

    vec3 finalColor = (ambient + diffuse) * ao;

    // Add subtle rim lighting for depth
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    finalColor += rim * 0.1 * baseColor;

    gl_FragColor = vec4(finalColor, opacity);
  }
`;


// Convert geo coords to mesh coords
function geoToMesh(lon: number, lat: number, meshWidth: number, meshHeight: number): [number, number] {
  const x = ((lon - SLOVAKIA_BOUNDS.minLon) / SLOVAKIA_BOUNDS.width) * meshWidth - meshWidth / 2;
  const y = ((lat - SLOVAKIA_BOUNDS.minLat) / SLOVAKIA_BOUNDS.height) * meshHeight - meshHeight / 2;
  return [x, y];
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

    return new THREE.ShaderMaterial({
      uniforms: {
        heightMap: { value: heightMap },
        heightScale: { value: is3D ? heightScale : 0.0 },
        maxElevation: { value: 2655.0 }, // Gerlach peak
        lightDirection: { value: new THREE.Vector3(1, 1, 2).normalize() },
        ambientStrength: { value: 0.4 },
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

  // Update height scale when toggling 2D/3D
  useEffect(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.heightScale.value = is3D ? heightScale : 0.0;
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
      {/* Shadow/glow effect - dark outer */}
      <Line
        points={linePoints}
        color="#1c1917"
        lineWidth={5}
        transparent
        opacity={0.4}
      />
      {/* Outer glow - amber dark */}
      <Line
        points={linePoints}
        color="#78350f"
        lineWidth={3.5}
        transparent
        opacity={0.5}
      />
      {/* Main border line - golden/amber */}
      <Line
        points={linePoints}
        color="#d97706"
        lineWidth={2}
        transparent
        opacity={1}
      />
      {/* Inner highlight - bright */}
      <Line
        points={linePoints}
        color="#fbbf24"
        lineWidth={0.8}
        transparent
        opacity={0.6}
      />
    </group>
  );
}

// Placeholder images for each type - verified working URLs
const CASTLE_IMAGES: Record<string, string[]> = {
  hrad: [
    'https://images.unsplash.com/photo-1568797629485-c2a3f1e37e14?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555990538-1c5c9f04ca58?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=300&fit=crop',
  ],
  hradisko: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  ],
  zamok: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1594751543129-6701ad444259?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1564410267841-915d8e4d71ea?w=400&h=300&fit=crop',
  ]
};

// Get a consistent image for a hradisko based on its name
function getHradiskoImage(hradisko: Hradisko): string {
  const images = CASTLE_IMAGES[hradisko.type] || CASTLE_IMAGES.hradisko;
  const index = hradisko.name.length % images.length;
  return images[index];
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
  onHover
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
}) {
  const isHovered = hoveredHradisko === hradisko.name;

  const aspectRatio = SLOVAKIA_BOUNDS.width / SLOVAKIA_BOUNDS.height;
  const meshWidth = 20;
  const meshHeight = meshWidth / aspectRatio;

  const [x, y] = geoToMesh(hradisko.coordinates[0], hradisko.coordinates[1], meshWidth, meshHeight);
  const estimatedElevation = (hradisko.nadmorskaVyska || 400) / 2655;
  const z = is3D ? estimatedElevation * heightScale * 2 + 0.15 : 0.15;

  // SVG icons for each type
  const icons: Record<string, { svg: string; color: string; bg: string }> = {
    hrad: {
      color: '#dc2626',
      bg: '#7f1d1d',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 8v2h2v10h6v-4h4v4h6V10h2V8L12 2zm-4 8v2H6v-2h2zm4 0v2h-2v-2h2zm4 0v2h-2v-2h2z"/></svg>`
    },
    hradisko: {
      color: '#d97706',
      bg: '#78350f',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 6h2v2h-2V8zm0 4h2v4h-2v-4z"/></svg>`
    },
    zamok: {
      color: '#7c3aed',
      bg: '#4c1d95',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5zM11 11v6h2v-6h-2z"/><path d="M8 13h2v2H8zM14 13h2v2h-2z"/></svg>`
    }
  };

  const icon = icons[hradisko.type] || icons.hradisko;

  // Hide ALL markers when detail is open
  if (isDetailOpen) {
    return null;
  }

  return (
    <group position={[x, z, -y]}>
      <Html
        center
        distanceFactor={10}
        zIndexRange={isHovered ? [100000, 100001] : [1, 100]}
        style={{
          pointerEvents: 'auto',
          zIndex: isHovered ? 100000 : 1
        }}
      >
        <div
          className="relative cursor-pointer"
          style={{
            transform: isHovered || isSelected ? 'scale(1.2)' : 'scale(1)',
            zIndex: isHovered ? 100000 : 1,
            transition: 'transform 0.15s ease-out'
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
          {/* Marker icon */}
          <div
            className="relative flex items-center justify-center rounded-full shadow-lg border-2"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: icon.bg,
              borderColor: icon.color,
              color: 'white',
              boxShadow: isHovered ? `0 0 20px ${icon.color}` : `0 4px 12px rgba(0,0,0,0.4)`
            }}
          >
            <div
              style={{ width: '20px', height: '20px' }}
              dangerouslySetInnerHTML={{ __html: icon.svg }}
            />
            {hradisko.unesco && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px]">
                ★
              </div>
            )}
          </div>

          {/* Pin tail */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '34px',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `10px solid ${icon.bg}`
            }}
          />
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

// Camera controller
function CameraController({ is3D }: { is3D: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (is3D) {
      camera.position.set(0, 5, 5);  // Much closer to terrain
    } else {
      camera.position.set(0, 8, 0.1);  // Closer for 2D view
    }
    camera.lookAt(0, 0, 0);
  }, [is3D, camera]);

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

// Main map component
export default function Slovakia3DReliefMap() {
  const [is3D, setIs3D] = useState(true);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [hoveredHradisko, setHoveredHradisko] = useState<string | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.2);
      controlsRef.current.update();
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
        minHeight: '700px',
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
        className="relative border-b py-8 px-8"
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
                3D MAPA HRADÍSK
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
      <div className="p-6 md:p-10 relative">
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
              style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
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

              <Canvas
                camera={{ position: [0, 5, 5], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Warm parchment-like background */}
                <color attach="background" args={['#3a332a']} />
            <Suspense fallback={<LoadingScreen />}>
              <SceneLighting />
              <CameraController is3D={is3D} />
              <TerrainMesh heightScale={heightScale} is3D={is3D} />
              <BorderLine is3D={is3D} heightScale={heightScale} />
              {hradiskaData.map((hradisko) => (
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
                  onHover={setHoveredHradisko}
                />
              ))}
              <OrbitControls
                ref={controlsRef}
                enablePan={isMapActive}
                enableZoom={isMapActive}
                enableRotate={is3D && isMapActive}
                minDistance={2}
                maxDistance={15}
                maxPolarAngle={is3D ? Math.PI / 2.2 : Math.PI / 2}
                minPolarAngle={0}
              />
              </Suspense>
              </Canvas>

              {/* Compact floating controls - top right */}
              {!selectedHradisko && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  onClick={() => setIs3D(!is3D)}
                  className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
                  style={{
                    background: is3D ? '#c4a574' : 'rgba(31, 26, 20, 0.95)',
                    color: is3D ? '#1a1510' : '#e8dcc8',
                    border: '1px solid rgba(196, 165, 116, 0.5)'
                  }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {is3D ? '3D' : '2D'}
                </button>

                <button
                  onClick={zoomIn}
                  className="p-1.5 rounded-lg shadow-md transition-colors hover:bg-amber-900/50"
                  style={{
                    background: 'rgba(31, 26, 20, 0.95)',
                    color: '#c4a574',
                    border: '1px solid rgba(196, 165, 116, 0.4)'
                  }}
                  title="Priblížiť"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={zoomOut}
                  className="p-1.5 rounded-lg shadow-md transition-colors hover:bg-amber-900/50"
                  style={{
                    background: 'rgba(31, 26, 20, 0.95)',
                    color: '#c4a574',
                    border: '1px solid rgba(196, 165, 116, 0.4)'
                  }}
                  title="Oddialiť"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={resetView}
                  className="p-1.5 rounded-lg shadow-md transition-colors hover:bg-amber-900/50"
                  style={{
                    background: 'rgba(31, 26, 20, 0.95)',
                    color: '#c4a574',
                    border: '1px solid rgba(196, 165, 116, 0.4)'
                  }}
                  title="Reset pohľadu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              )}

              {/* Compact legend bar - bottom center, horizontal */}
              {!selectedHradisko && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-lg px-4 py-2 shadow-lg flex items-center gap-6"
                style={{
                  background: 'rgba(31, 26, 20, 0.95)',
                  border: '1px solid rgba(196, 165, 116, 0.4)'
                }}
              >
                {/* Location types */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span className="text-[10px]" style={{ color: '#a89f8f' }}>Hrad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span className="text-[10px]" style={{ color: '#a89f8f' }}>Hradisko</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                    <span className="text-[10px]" style={{ color: '#a89f8f' }}>Zámok</span>
                  </div>
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

                {/* Count */}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" style={{ color: '#c4a574' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#e8dcc8' }}>{hradiskaData.length} lokalít</span>
                </div>
              </div>
              )}

            </div>
          </div>
          </div>

          {/* Sidebar Panel - appears on hover as overlay */}
          <div
            className={`absolute top-0 right-0 rounded-2xl overflow-hidden shadow-2xl z-50 transition-all duration-200 ${
              hoveredHradisko && !selectedHradisko ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
            style={{
              background: 'linear-gradient(135deg, #f9f6f0 0%, #f5f1e8 50%, #ebe5d8 100%)',
              border: '3px solid #c4a574',
              width: '280px',
              minWidth: '280px',
              maxWidth: '280px',
              height: '450px'
            }}
          >
            {(() => {
              const hovered = hoveredHradisko ? hradiskaData.find(h => h.name === hoveredHradisko) : null;
              if (!hovered) return (
                <div className="h-full flex items-center justify-center p-6">
                  <p className="text-center" style={{ color: '#8b7355', fontFamily: 'Georgia, serif' }}>
                    ✦ Prejdite kurzorom na lokalitu ✦
                  </p>
                </div>
              );

              const imageUrl = getHradiskoImage(hovered);
              const typeColor = hovered.type === 'hrad' ? '#dc2626' : hovered.type === 'zamok' ? '#7c3aed' : '#d97706';

              return (
                <>
                  {/* Top decorative border */}
                  <div className="h-2" style={{ background: 'linear-gradient(90deg, #8b7355, #c4a574, #8b7355)' }} />

                  {/* Image - fixed height */}
                  <div className="relative" style={{ height: '140px' }}>
                    <img
                      src={imageUrl}
                      alt={hovered.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] uppercase font-bold text-white"
                      style={{ backgroundColor: typeColor }}
                    >
                      {hovered.type === 'hrad' ? 'Hrad' : hovered.type === 'zamok' ? 'Zámok' : 'Hradisko'}
                    </div>
                    {hovered.unesco && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 rounded text-[10px] font-bold">★ UNESCO</div>
                    )}
                  </div>

                  {/* Content - fixed layout */}
                  <div className="p-4">
                    {/* Title */}
                    <h3
                      className="font-bold text-lg mb-1 truncate"
                      style={{ color: '#2d1810', fontFamily: 'Georgia, serif' }}
                    >
                      {hovered.name}
                    </h3>

                    {/* Divider */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }} />
                      <span style={{ color: '#c4a574', fontSize: '10px' }}>✦</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }} />
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded" style={{ backgroundColor: 'rgba(196, 165, 116, 0.2)' }}>
                        <span className="text-[9px] uppercase block" style={{ color: '#8b7355' }}>Obdobie</span>
                        <p className="font-semibold text-xs" style={{ color: '#2d1810' }}>{hovered.rok}</p>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'rgba(196, 165, 116, 0.2)' }}>
                        <span className="text-[9px] uppercase block" style={{ color: '#8b7355' }}>Stav</span>
                        <p className="font-semibold text-xs" style={{ color: '#2d1810' }}>{hovered.stav}</p>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'rgba(196, 165, 116, 0.2)' }}>
                        <span className="text-[9px] uppercase block" style={{ color: '#8b7355' }}>Okres</span>
                        <p className="font-semibold text-xs truncate" style={{ color: '#2d1810' }}>{hovered.okres || '-'}</p>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'rgba(196, 165, 116, 0.2)' }}>
                        <span className="text-[9px] uppercase block" style={{ color: '#8b7355' }}>Výška</span>
                        <p className="font-semibold text-xs" style={{ color: '#2d1810' }}>{hovered.nadmorskaVyska} m</p>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => setSelectedHradisko(hovered)}
                      className="w-full py-2 rounded-lg font-semibold text-xs"
                      style={{
                        background: 'linear-gradient(135deg, #8b7355, #a08563, #8b7355)',
                        color: '#f9f6f0',
                        border: '2px solid #5d4e37'
                      }}
                    >
                      Zobraziť detail →
                    </button>
                  </div>

                  {/* Bottom border */}
                  <div className="h-2 mt-auto" style={{ background: 'linear-gradient(90deg, #8b7355, #c4a574, #8b7355)' }} />
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Detail Card - Parchment style overlay with historical motifs */}
      {selectedHradisko && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Decorative overlay with texture */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(44, 36, 24, 0.97) 0%, rgba(26, 21, 16, 0.98) 50%, rgba(44, 36, 24, 0.97) 100%)'
            }}
            onClick={() => setSelectedHradisko(null)}
          />

          {/* Overlay decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-10 text-8xl opacity-5" style={{ color: '#c4a574' }}>❦</div>
            <div className="absolute top-10 right-10 text-8xl opacity-5" style={{ color: '#c4a574', transform: 'scaleX(-1)' }}>❦</div>
            <div className="absolute bottom-10 left-10 text-8xl opacity-5" style={{ color: '#c4a574', transform: 'scaleY(-1)' }}>❦</div>
            <div className="absolute bottom-10 right-10 text-8xl opacity-5" style={{ color: '#c4a574', transform: 'scale(-1)' }}>❦</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[300px] opacity-[0.02]" style={{ color: '#c4a574' }}>⚜</div>
          </div>

          {/* Card - parchment style - larger with decorations */}
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #f9f6f0 0%, #f5f1e8 25%, #ebe5d8 50%, #f5f1e8 75%, #f9f6f0 100%)',
              border: '4px solid #c4a574',
              boxShadow: '0 0 0 2px #8b7355, 0 0 0 6px rgba(196, 165, 116, 0.3), 0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Top decorative border with pattern */}
            <div className="h-4 flex items-center justify-center relative" style={{ background: 'linear-gradient(90deg, #8b7355, #c4a574, #d4b896, #c4a574, #8b7355)' }}>
              <div className="absolute inset-0 flex items-center justify-center gap-6">
                <span style={{ color: '#5d4e37' }}>◈</span>
                <span style={{ color: '#5d4e37' }}>❖</span>
                <span style={{ color: '#5d4e37' }}>⚜</span>
                <span style={{ color: '#5d4e37' }}>❖</span>
                <span style={{ color: '#5d4e37' }}>◈</span>
              </div>
            </div>

            {/* Decorative line under top border */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, transparent, #8b7355, #5d4e37, #8b7355, transparent)' }} />

            {/* Corner ornaments - more elaborate */}
            <div className="absolute top-8 left-8 text-4xl opacity-25" style={{ color: '#8b7355' }}>❧</div>
            <div className="absolute top-8 right-8 text-4xl opacity-25" style={{ color: '#8b7355', transform: 'scaleX(-1)' }}>❧</div>
            <div className="absolute top-14 left-14 text-xl opacity-15" style={{ color: '#c4a574' }}>✧</div>
            <div className="absolute top-14 right-14 text-xl opacity-15" style={{ color: '#c4a574' }}>✧</div>

            <div className="p-10 flex gap-8 items-start">
              {/* Left: Photo - larger */}
              <div className="flex-shrink-0 mt-4">
                <div
                  className="relative rounded-xl overflow-hidden shadow-xl"
                  style={{ width: '280px', height: '280px', border: '4px solid #c4a574' }}
                >
                  <img
                    src={getHradiskoImage(selectedHradisko)}
                    alt={selectedHradisko.name}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{ minWidth: '100%', minHeight: '100%' }}
                  />
                  {/* Type badge */}
                  <div
                    className="absolute bottom-0 left-0 right-0 py-2 text-center text-sm text-white font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: selectedHradisko.type === 'hrad' ? '#dc2626' :
                                       selectedHradisko.type === 'zamok' ? '#7c3aed' : '#d97706'
                    }}
                  >
                    {selectedHradisko.type === 'hrad' ? 'Hrad' :
                     selectedHradisko.type === 'zamok' ? 'Zámok' : 'Hradisko'}
                  </div>
                </div>

                {/* Decorative element under photo */}
                <div className="text-center mt-3" style={{ color: '#c4a574' }}>
                  ═══════════
                </div>
              </div>

              {/* Right: Info */}
              <div className="flex-1 min-w-0">
                {/* Header with ornament */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ color: '#c4a574', fontSize: '20px' }}>⚜</span>
                      <h3
                        className="font-bold text-4xl"
                        style={{ color: '#2d1810', fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {selectedHradisko.name}
                      </h3>
                      <span style={{ color: '#c4a574', fontSize: '20px' }}>⚜</span>
                    </div>
                    {selectedHradisko.unesco && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 rounded-lg text-sm text-stone-900 font-bold uppercase">
                        ★ UNESCO Pamiatka
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                  >
                    <span style={{ color: '#5d4e37', fontSize: '28px' }}>✕</span>
                  </button>
                </div>

                {/* Decorative divider */}
                <div className="flex items-center gap-2 mb-5" style={{ color: '#c4a574' }}>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }}></div>
                  <span>✦</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }}></div>
                </div>

                {/* Description if available */}
                {selectedHradisko.description && (
                  <p
                    className="mb-5 text-base leading-relaxed"
                    style={{ color: '#4a3f35', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
                  >
                    "{selectedHradisko.description.substring(0, 150)}..."
                  </p>
                )}

                {/* Info grid - larger with ornate styling */}
                <div
                  className="grid grid-cols-2 gap-5 mb-6 p-5 rounded-xl relative"
                  style={{ backgroundColor: 'rgba(194, 164, 118, 0.2)', border: '2px solid #c4a574' }}
                >
                  {/* Corner decorations */}
                  <span className="absolute -top-2 -left-2 text-lg" style={{ color: '#c4a574' }}>┌</span>
                  <span className="absolute -top-2 -right-2 text-lg" style={{ color: '#c4a574' }}>┐</span>
                  <span className="absolute -bottom-2 -left-2 text-lg" style={{ color: '#c4a574' }}>└</span>
                  <span className="absolute -bottom-2 -right-2 text-lg" style={{ color: '#c4a574' }}>┘</span>

                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>⏳ Obdobie</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.rok}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>📜 Stav</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.stav}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>📍 Okres</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.okres || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>⛰️ Nadmorská výška</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.nadmorskaVyska} m n.m.</p>
                  </div>
                </div>

                {/* Actions - larger buttons with historical styling */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      window.open(`https://www.google.com/maps?q=${selectedHradisko.coordinates[1]},${selectedHradisko.coordinates[0]}`, '_blank');
                    }}
                    className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all text-lg relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #8b7355 0%, #a08563 50%, #8b7355 100%)',
                      color: '#f9f6f0',
                      border: '2px solid #5d4e37',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="relative z-10">📍 Otvoriť v Google Maps</span>
                  </button>
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="px-6 py-3.5 rounded-xl font-semibold transition-all text-lg"
                    style={{
                      background: 'linear-gradient(135deg, #e8dcc8 0%, #f5f1e8 50%, #e8dcc8 100%)',
                      color: '#5d4e37',
                      border: '2px solid #c4a574',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    ✕ Zavrieť
                  </button>
                </div>

                {/* Decorative footer element */}
                <div className="mt-6 flex items-center justify-center gap-3" style={{ color: '#c4a574' }}>
                  <span className="text-xs opacity-60">═══</span>
                  <span className="text-sm">✦</span>
                  <span className="text-xs opacity-60">═══</span>
                </div>
              </div>
            </div>

            {/* Decorative line above bottom border */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, transparent, #8b7355, #5d4e37, #8b7355, transparent)' }} />

            {/* Bottom decorative border with pattern */}
            <div className="h-4 flex items-center justify-center relative" style={{ background: 'linear-gradient(90deg, #8b7355, #c4a574, #d4b896, #c4a574, #8b7355)' }}>
              <div className="absolute inset-0 flex items-center justify-center gap-6">
                <span style={{ color: '#5d4e37' }}>◈</span>
                <span style={{ color: '#5d4e37' }}>❖</span>
                <span style={{ color: '#5d4e37' }}>⚜</span>
                <span style={{ color: '#5d4e37' }}>❖</span>
                <span style={{ color: '#5d4e37' }}>◈</span>
              </div>
            </div>

            {/* Bottom corner ornaments */}
            <div className="absolute bottom-8 left-8 text-4xl opacity-25" style={{ color: '#8b7355', transform: 'rotate(180deg)' }}>❧</div>
            <div className="absolute bottom-8 right-8 text-4xl opacity-25" style={{ color: '#8b7355', transform: 'rotate(180deg) scaleX(-1)' }}>❧</div>
            <div className="absolute bottom-14 left-14 text-xl opacity-15" style={{ color: '#c4a574' }}>✧</div>
            <div className="absolute bottom-14 right-14 text-xl opacity-15" style={{ color: '#c4a574' }}>✧</div>
          </div>
        </div>
      )}

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
