"use client";

import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { Search, Filter, RotateCcw, Shuffle, X, MapPin, ZoomIn, ZoomOut, Sun, Moon, Maximize2 } from 'lucide-react';

// Cesium Asset ID (zadarmo, bez tokenu potrebné len pre ion assets)
// Pre základné použitie funguje aj bez tokenu
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyMDg0NTc3OH0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

const CesiumMap = () => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewer = useRef<Cesium.Viewer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['hrad', 'hradisko', 'zamok']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [terrainExaggeration, setTerrainExaggeration] = useState(2.0);
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const typeColors = {
    hrad: Cesium.Color.fromCssColorString('#e74c3c'),
    hradisko: Cesium.Color.fromCssColorString('#f39c12'),
    zamok: Cesium.Color.fromCssColorString('#9b59b6')
  };

  const typeLabels = {
    hrad: 'Hrad',
    hradisko: 'Hradisko',
    zamok: 'Zámok'
  };

  // Inicializácia Cesium Viewer
  useEffect(() => {
    if (!cesiumContainer.current || viewer.current) return;

    // Vytvorenie Cesium Viewer
    viewer.current = new Cesium.Viewer(cesiumContainer.current, {
      // Základné nastavenia
      animation: false,
      baseLayerPicker: true,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: true,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: false,

      // Terén - Cesium World Terrain (najkvalitnejší!)
      terrainProvider: Cesium.createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true
      }),

      // Imagery - Bing Maps Aerial (satelitné snímky)
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),

      // Scéna nastavenia
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
          negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
          positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
          negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
          positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
          negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
      }),
    });

    // Nastavenie scény
    const scene = viewer.current.scene;

    // Atmosféra a osvetlenie
    scene.globe.enableLighting = true;
    scene.globe.atmosphereSaturationShift = 0.3;
    scene.globe.atmosphereBrightnessShift = 0.2;

    // Anti-aliasing
    scene.fxaa = true;
    scene.postProcessStages.fxaa.enabled = true;

    // Terén exaggeration (zväčšenie reliéfu)
    scene.verticalExaggeration = terrainExaggeration;

    // Fog (hmla na diaľku)
    scene.fog.enabled = true;
    scene.fog.density = 0.0001;
    scene.fog.screenSpaceErrorFactor = 2.0;

    // Presun kamery na Slovensko
    viewer.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(19.5, 48.7, 150000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 3
    });

    // Cleanup
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  // Aktualizácia terén exaggeration
  useEffect(() => {
    if (viewer.current) {
      viewer.current.scene.verticalExaggeration = terrainExaggeration;
    }
  }, [terrainExaggeration]);

  // Aktualizácia night mode
  useEffect(() => {
    if (viewer.current) {
      const scene = viewer.current.scene;
      if (isNightMode) {
        scene.globe.enableLighting = false;
        scene.skyBox.show = true;
      } else {
        scene.globe.enableLighting = true;
        scene.skyBox.show = true;
      }
    }
  }, [isNightMode]);

  // Pridanie markerov hradísk
  useEffect(() => {
    if (!viewer.current) return;

    // Odstránenie starých entít
    entitiesRef.current.forEach(entity => {
      viewer.current?.entities.remove(entity);
    });
    entitiesRef.current = [];

    // Filtrovanie dát
    const filteredData = hradiskaData.filter(hradisko => {
      const matchesType = selectedTypes.includes(hradisko.type);
      const matchesSearch = hradisko.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.kraj.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    // Pridanie nových markerov
    filteredData.forEach(hradisko => {
      const position = Cesium.Cartesian3.fromDegrees(
        hradisko.coordinates[0],
        hradisko.coordinates[1],
        hradisko.nadmorskaVyska + 100 // +100m nad terén pre viditeľnosť
      );

      const color = typeColors[hradisko.type];

      // Billboard entity (2D ikona v 3D priestore)
      const entity = viewer.current!.entities.add({
        position: position,
        name: hradisko.name,

        // Billboard (ikona)
        billboard: {
          image: createPinCanvas(color, hradisko.unesco),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.8,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.2, 50000, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(1000, 1.0, 100000, 0.3),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },

        // Label (text)
        label: {
          text: hradisko.name,
          font: '14px Georgia, serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 50000, 0.0),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },

        // Description pre info box
        description: `
          <div style="font-family: Georgia, serif; padding: 10px;">
            <h2 style="margin-top: 0; color: #7d4f1d;">
              ${hradisko.name}
              ${hradisko.unesco ? ' ⭐ UNESCO' : ''}
            </h2>
            <p><strong>Typ:</strong> ${typeLabels[hradisko.type]}</p>
            <p><strong>Obdobie:</strong> ${hradisko.rok}</p>
            <p><strong>Stav:</strong> ${hradisko.stav}</p>
            <p><strong>Okres:</strong> ${hradisko.okres}</p>
            <p><strong>Kraj:</strong> ${hradisko.kraj}</p>
            <p><strong>Nadmorská výška:</strong> ${hradisko.nadmorskaVyska} m n.m.</p>
            <hr style="border-color: #7d4f1d;">
            <p style="font-style: italic;">${hradisko.description}</p>
          </div>
        `,

        // Custom properties
        properties: {
          hradisko: hradisko
        }
      });

      entitiesRef.current.push(entity);
    });

  }, [selectedTypes, searchQuery]);

  // Helper funkcia na vytvorenie pin ikony
  const createPinCanvas = (color: Cesium.Color, isUnesco: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Tieň
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(24, 60, 12, 4, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Pin telo
    ctx.fillStyle = color.toCssColorString();
    ctx.strokeStyle = isUnesco ? '#fbbf24' : '#ffffff';
    ctx.lineWidth = isUnesco ? 4 : 3;
    ctx.beginPath();
    ctx.arc(24, 20, 16, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Pin špička
    ctx.beginPath();
    ctx.moveTo(24, 36);
    ctx.lineTo(12, 20);
    ctx.lineTo(36, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vnútorný kruh
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(24, 20, 8, 0, 2 * Math.PI);
    ctx.fill();

    // UNESCO hviezdička
    if (isUnesco) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 24, 20);
    }

    return canvas;
  };

  // Funkcie na ovládanie
  const resetView = () => {
    if (!viewer.current) return;
    viewer.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(19.5, 48.7, 150000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 2
    });
  };

  const randomHrad = () => {
    const filteredData = hradiskaData.filter(h => selectedTypes.includes(h.type));
    if (filteredData.length === 0 || !viewer.current) return;

    const random = filteredData[Math.floor(Math.random() * filteredData.length)];
    setSelectedHradisko(random);

    viewer.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        random.coordinates[0],
        random.coordinates[1],
        5000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-60),
        roll: 0.0
      },
      duration: 3
    });
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
  };

  return (
    <div className="relative w-full h-[700px] bg-stone-900 rounded-lg overflow-hidden">
      {/* Cesium Container */}
      <div ref={cesiumContainer} className="w-full h-full" />

      {/* Header Panel */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-stone-900/95 to-stone-900/80 backdrop-blur-sm border-b border-stone-700/50 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-stone-100 mb-3 flex items-center gap-2">
            🌍 Fotorealistická 3D mapa hradísk Slovenska
            <span className="text-xs text-amber-400">(Cesium.js)</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Vyhľadať hradisko, okres alebo kraj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-800/80 border border-stone-700 rounded text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <button
                onClick={toggleNightMode}
                className={`px-4 py-2 border rounded flex items-center gap-2 text-sm transition-colors ${
                  isNightMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white'
                    : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-100'
                }`}
                title={isNightMode ? 'Denný režim' : 'Nočný režim'}
              >
                {isNightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <button
                onClick={randomHrad}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 border border-amber-600 rounded text-white flex items-center gap-2 text-sm transition-colors"
                title="Náhodný hrad"
              >
                <Shuffle className="w-4 h-4" />
                Náhodný
              </button>

              <button
                onClick={resetView}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
                title="Reset pohľadu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-3 p-4 bg-stone-800/90 border border-stone-700 rounded">
              <h3 className="text-stone-100 mb-3 text-sm">Filtrovať podľa typu:</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(typeLabels).map(([type, label]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="w-4 h-4 rounded border-stone-600 text-amber-600 focus:ring-amber-600 focus:ring-offset-stone-900"
                    />
                    <span className="flex items-center gap-2 text-stone-200 text-sm">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: typeColors[type as keyof typeof typeColors].toCssColorString() }}
                      />
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Terrain Exaggeration Slider */}
              <div className="mt-4 pt-4 border-t border-stone-700">
                <label className="text-stone-100 text-sm mb-2 block">
                  Zvýraznenie reliéfu: {terrainExaggeration.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={terrainExaggeration}
                  onChange={(e) => setTerrainExaggeration(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-stone-700 text-xs text-stone-400">
                Zobrazených: {hradiskaData.filter(h =>
                  selectedTypes.includes(h.type) &&
                  (h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.kraj.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length} / {hradiskaData.length} lokalít
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/95 backdrop-blur-sm border border-stone-700 rounded p-4 max-w-xs">
        <h3 className="text-stone-100 mb-3 text-sm flex items-center gap-2">
          📊 Legenda
        </h3>
        <div className="space-y-2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: typeColors[type as keyof typeof typeColors].toCssColorString() }}
              />
              <span className="text-stone-300 text-xs">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-700">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="text-stone-300 text-xs">UNESCO pamiatka</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-700 text-xs text-stone-400">
          💡 Ovládanie:
          <ul className="mt-1 space-y-1 ml-2">
            <li>• Ľavé tlačidlo: Otáčanie</li>
            <li>• Pravé tlačidlo: Pan</li>
            <li>• Koliesko: Zoom</li>
            <li>• Stredné tlačidlo: Naklonenie</li>
          </ul>
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-amber-600/95 backdrop-blur-sm rounded px-3 py-2 shadow-lg">
        <p className="text-white text-xs font-semibold">
          ✨ 3D Fotorealistická mapa
        </p>
        <p className="text-amber-100 text-xs">
          Powered by Cesium.js
        </p>
      </div>
    </div>
  );
};

export default CesiumMap;
