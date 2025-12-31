"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Html, useTexture, Line, MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { X, Mountain, Layers, Droplets, Home } from 'lucide-react';

// Slovakia geographic bounds
const SLOVAKIA = {
  west: 16.833,
  east: 22.567,
  south: 47.733,
  north: 49.617,
  width: 22.567 - 16.833,
  height: 49.617 - 47.733,
};

// 3D scale
const SCALE = {
  x: 14,
  z: 7,
  height: 0.8,  // Subtle relief
};

// Convert geo to 3D
function geoTo3D(lng: number, lat: number): THREE.Vector3 {
  const u = (lng - SLOVAKIA.west) / SLOVAKIA.width;
  const v = (lat - SLOVAKIA.south) / SLOVAKIA.height;
  const x = (u - 0.5) * SCALE.x;
  const z = -(v - 0.5) * SCALE.z;
  return new THREE.Vector3(x, 0.02, z);
}

// Terrain with SRTM heightmap
function Terrain({ showHillshade }: { showHillshade: boolean }) {
  const heightmapTexture = useTexture('/heightmaps/slovakia_heightmap.png');
  const colorTexture = useTexture('/heightmaps/slovakia_colored.png');
  const hillshadeTexture = useTexture('/heightmaps/slovakia_hillshade.png');

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        heightMap: { value: heightmapTexture },
        colorMap: { value: colorTexture },
        hillshadeMap: { value: hillshadeTexture },
        heightScale: { value: SCALE.height },
        useHillshade: { value: showHillshade ? 1.0 : 0.0 },
      },
      vertexShader: `
        uniform sampler2D heightMap;
        uniform float heightScale;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vUv = uv;
          float height = texture2D(heightMap, uv).r * heightScale;
          vElevation = height;
          vec3 newPosition = position;
          newPosition.z = height;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D colorMap;
        uniform sampler2D hillshadeMap;
        uniform float useHillshade;
        varying vec2 vUv;
        varying float vElevation;

        void main() {
          vec3 color = texture2D(colorMap, vUv).rgb;
          float hillshade = texture2D(hillshadeMap, vUv).r;
          if (useHillshade > 0.5) {
            color = color * (0.6 + hillshade * 0.4);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, [heightmapTexture, colorTexture, hillshadeTexture, showHillshade]);

  useEffect(() => {
    if (material.uniforms) {
      material.uniforms.useHillshade.value = showHillshade ? 1.0 : 0.0;
    }
  }, [showHillshade, material]);

  return (
    <mesh
      geometry={new THREE.PlaneGeometry(SCALE.x, SCALE.z, 256, 256)}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    />
  );
}

// Slovakia border from real GeoJSON
function SlovakiaBorder({ visible }: { visible: boolean }) {
  const [borderPoints, setBorderPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    fetch('/geo/slovakia_border.json')
      .then(res => res.json())
      .then(data => {
        const coords = data.geometry.coordinates[0];
        const points = coords.map(([lng, lat]: [number, number]) => geoTo3D(lng, lat));
        setBorderPoints(points);
      })
      .catch(console.error);
  }, []);

  if (!visible || borderPoints.length === 0) return null;

  return (
    <Line
      points={borderPoints}
      color="#5d3a1a"
      lineWidth={4}
    />
  );
}

// Rivers from real GeoJSON
function Rivers({ visible }: { visible: boolean }) {
  const [rivers, setRivers] = useState<{ name: string; points: THREE.Vector3[] }[]>([]);

  useEffect(() => {
    fetch('/geo/slovakia_rivers.json')
      .then(res => res.json())
      .then(data => {
        const riverData = data.features.map((feature: any) => {
          const coords = feature.geometry.type === 'MultiLineString'
            ? feature.geometry.coordinates.flat()
            : feature.geometry.coordinates;

          return {
            name: feature.properties.name || 'River',
            points: coords.map(([lng, lat]: [number, number]) => geoTo3D(lng, lat))
          };
        });
        setRivers(riverData);
      })
      .catch(console.error);
  }, []);

  if (!visible) return null;

  return (
    <group>
      {rivers.map((river, i) => (
        <Line
          key={i}
          points={river.points}
          color="#3b82f6"
          lineWidth={2}
        />
      ))}
    </group>
  );
}

// Castle/Tower marker - tematicky hrad
function CastleMarker({
  hradisko,
  onClick,
  isSelected,
  isHovered,
  onHover
}: {
  hradisko: Hradisko;
  onClick: () => void;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hover: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = geoTo3D(hradisko.coordinates[0], hradisko.coordinates[1]);

  // Colors by type
  const colors = {
    hrad: '#b91c1c',
    hradisko: '#d97706',
    zamok: '#7c3aed'
  };
  const color = colors[hradisko.type] || '#6b7280';

  const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1;

  return (
    <group
      ref={groupRef}
      position={[pos.x, 0.05, pos.z]}
      scale={[scale, scale, scale]}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      {/* Tower base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.16, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Tower top */}
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.08, 0.1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Battlements */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 2) * 0.055,
          0.15,
          Math.sin(i * Math.PI / 2) * 0.055
        ]}>
          <boxGeometry args={[0.025, 0.04, 0.025]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* UNESCO flag */}
      {hradisko.unesco && (
        <group position={[0.08, 0.25, 0]}>
          <mesh>
            <cylinderGeometry args={[0.005, 0.005, 0.15, 6]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[0.025, 0.05, 0]}>
            <planeGeometry args={[0.05, 0.03]} />
            <meshStandardMaterial color="#fbbf24" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Tooltip */}
      {isHovered && (
        <Html position={[0, 0.35, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-stone-900/95 text-white px-3 py-2 rounded-lg shadow-xl border border-amber-600/50 whitespace-nowrap">
            <p className="font-bold text-amber-400 text-sm">{hradisko.name}</p>
            <p className="text-xs text-stone-300">{hradisko.okres}</p>
            {hradisko.unesco && <p className="text-xs text-yellow-400">★ UNESCO</p>}
          </div>
        </Html>
      )}
    </group>
  );
}

// Camera setup - orthographic top-down
function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 12, 0);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// Main Scene
function Scene({
  onSelectHradisko,
  selectedHradisko,
  hoveredHradisko,
  setHoveredHradisko,
  showTerrain,
  showHillshade,
  showRivers,
  showBorder,
  showMarkers
}: {
  onSelectHradisko: (h: Hradisko | null) => void;
  selectedHradisko: Hradisko | null;
  hoveredHradisko: string | null;
  setHoveredHradisko: (name: string | null) => void;
  showTerrain: boolean;
  showHillshade: boolean;
  showRivers: boolean;
  showBorder: boolean;
  showMarkers: boolean;
}) {
  return (
    <>
      <CameraController />

      {/* Lighting - top-down */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />

      {/* Terrain */}
      {showTerrain && <Terrain showHillshade={showHillshade} />}

      {/* Background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>

      {/* Border */}
      <SlovakiaBorder visible={showBorder} />

      {/* Rivers */}
      <Rivers visible={showRivers} />

      {/* Castle markers */}
      {showMarkers && hradiskaData.map((hradisko) => (
        <CastleMarker
          key={hradisko.name}
          hradisko={hradisko}
          onClick={() => onSelectHradisko(hradisko)}
          isSelected={selectedHradisko?.name === hradisko.name}
          isHovered={hoveredHradisko === hradisko.name}
          onHover={(hover) => setHoveredHradisko(hover ? hradisko.name : null)}
        />
      ))}

      {/* Map controls - pan and zoom only */}
      <MapControls
        enableRotate={false}
        minZoom={0.5}
        maxZoom={4}
        screenSpacePanning={true}
      />
    </>
  );
}

// Loading
function LoadingFallback() {
  return (
    <Html center>
      <div className="text-amber-100 text-lg animate-pulse">Nacitavam mapu...</div>
    </Html>
  );
}

// Type definitions
const typeColors = { hrad: '#b91c1c', hradisko: '#d97706', zamok: '#7c3aed' };
const typeLabels = { hrad: 'Hrad', hradisko: 'Hradisko', zamok: 'Zamok' };

// Main component
export default function Slovakia3DMap() {
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [hoveredHradisko, setHoveredHradisko] = useState<string | null>(null);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showHillshade, setShowHillshade] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  return (
    <div className="relative w-full h-[700px] bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 rounded-xl overflow-hidden border border-stone-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-stone-900/95 to-transparent p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-amber-100 text-xl font-serif flex items-center gap-2">
              <Mountain className="w-5 h-5 text-amber-500" />
              Mapa hradisk Slovenska
            </h2>
            <p className="text-stone-400 text-sm mt-1">
              {hradiskaData.length} lokalit • Skutocne SRTM data
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTerrain(!showTerrain)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                showTerrain ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Mountain className="w-4 h-4" />
              Relief
            </button>

            <button
              onClick={() => setShowHillshade(!showHillshade)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                showHillshade ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tiene
            </button>

            <button
              onClick={() => setShowBorder(!showBorder)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                showBorder ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Hranice
            </button>

            <button
              onClick={() => setShowRivers(!showRivers)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                showRivers ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Droplets className="w-4 h-4" />
              Rieky
            </button>

            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                showMarkers ? 'bg-red-700 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Home className="w-4 h-4" />
              Hrady
            </button>
          </div>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas orthographic camera={{ zoom: 50, position: [0, 12, 0] }}>
        <color attach="background" args={['#0f172a']} />

        <Suspense fallback={<LoadingFallback />}>
          <Scene
            onSelectHradisko={setSelectedHradisko}
            selectedHradisko={selectedHradisko}
            hoveredHradisko={hoveredHradisko}
            setHoveredHradisko={setHoveredHradisko}
            showTerrain={showTerrain}
            showHillshade={showHillshade}
            showRivers={showRivers}
            showBorder={showBorder}
            showMarkers={showMarkers}
          />
        </Suspense>
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/95 backdrop-blur-sm border border-stone-700 rounded-lg p-4">
        <h3 className="text-amber-100 text-sm font-semibold mb-3">Legenda</h3>
        <div className="space-y-2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: typeColors[type as keyof typeof typeColors] }}
              />
              <span className="text-stone-300 text-xs">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-stone-700">
            <span className="text-yellow-400 text-sm">⚑</span>
            <span className="text-stone-300 text-xs">UNESCO</span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-stone-700">
            <span className="w-4 h-0.5 bg-blue-500 rounded"></span>
            <span className="text-stone-300 text-xs">Rieky</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-amber-800 rounded"></span>
            <span className="text-stone-300 text-xs">Hranice SR</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-stone-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-stone-400">
        <p>Scroll = zoom | Tahat = posunut</p>
      </div>

      {/* Detail Modal */}
      {selectedHradisko && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-amber-100 text-2xl font-serif">
                    {selectedHradisko.name}
                    {selectedHradisko.unesco && <span className="text-yellow-400 ml-2">★</span>}
                  </h2>
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: typeColors[selectedHradisko.type] }}
                  >
                    {typeLabels[selectedHradisko.type]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHradisko(null)}
                  className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <p className="text-stone-300 leading-relaxed mb-4">{selectedHradisko.description}</p>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-800 text-sm">
                <div>
                  <p className="text-stone-500 text-xs">Obdobie</p>
                  <p className="text-stone-200">{selectedHradisko.rok}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Stav</p>
                  <p className="text-stone-200">{selectedHradisko.stav}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Okres</p>
                  <p className="text-stone-200">{selectedHradisko.okres}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Vyska</p>
                  <p className="text-stone-200">{selectedHradisko.nadmorskaVyska} m</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedHradisko(null)}
                className="w-full mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Zavriet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
