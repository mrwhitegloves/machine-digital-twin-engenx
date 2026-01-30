import { useRef, useState, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

function Model({ componentData, onPartHover, onPartClick, selectedPart }) {
//   const { scene } = useGLTF('/models/3Dmotor3.glb');
const { scene, error } = useGLTF('/models/3Dmotor3.glb', true, false, (loader) => {
  loader.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); // ← enables Draco compression
});

if (error) {
  console.error("GLTF loading error:", error);
  return <Html center><div className="text-red-500">Failed to load model: {error.message}</div></Html>;
}
  const modelRef = useRef();
  const [hoveredMesh, setHoveredMesh] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Clone scene once and keep it stable
  const stableScene = useMemo(() => scene.clone(true), [scene]);

  // Center & scale model once
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(stableScene);
    const center = box.getCenter(new THREE.Vector3());
    stableScene.position.sub(center);
    stableScene.scale.setScalar(18); // adjust as needed
    stableScene.rotation.set(0, 0, 0);
  }, [stableScene]);

  // Temperature-based color change (real-time from componentData)
  useEffect(() => {
    const getTemperatureColor = () => {
      const temp = componentData?.motorTemperature || 30;
      if (temp <= 60) return new THREE.Color('#1cca5b');
      if (temp <= 80) return new THREE.Color('#c68b15');
      return new THREE.Color('#ff1a1a');
    };

    stableScene.traverse((child) => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissive.copy(getTemperatureColor());
        child.material.emissiveIntensity = 0.6;
        child.material.needsUpdate = true;
      }
    });
  }, [componentData, stableScene]);

  // Continuous slow auto-rotation (pauses when user interacts)
//   useFrame((state, delta) => {
//     if (!modelRef.current) return;

//     // Only auto-rotate when user is NOT interacting
//     if (!isUserInteracting) {
//       modelRef.current.rotation.y += delta * 0.3; // smooth rotation speed
//     }
//   });

  // Hover & click handlers
  const handlePointerOver = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    const name = mesh.name || 'Component';
    setHoveredMesh(name);

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y -= 8.5; // raise tooltip above model

    onPartHover({ name, position: worldPos });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredMesh(null);
    onPartHover(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    const name = mesh.name || 'Component';
    onPartClick(name);
  };

  return (
    <Center>
      <group ref={modelRef}>
        <primitive
          object={stableScene}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      </group>
    </Center>
  );
}

function ComponentTooltip({ partName, position, componentData }) {
  console.log("position in tooltip: ",position)
  const matchedKey = Object.keys(componentData).find(
    (key) =>
      partName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(partName.toLowerCase())
  );
  console.log("Hover work")

  const data = matchedKey ? componentData[matchedKey] : null;

  return (
    <Html position={[position.x, position.y, position.z]} center>
      <div className="min-w-[220px] bg-background/95 backdrop-blur-sm border border-primary/60 rounded-lg p-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none">
        <h4 className="text-base font-bold text-primary mb-3 font-display tracking-wide">
            Motor
          {/* {data?.name || partName} */}
        </h4>

        {/* {componentData ? ( */}
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">RPM:</span>
                <span className="font-mono">{componentData.rpmWifi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Torque:</span>
                <span className="font-mono">{componentData.torque} Nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temp:</span>
                <span className="font-mono">{componentData.motorTemperature}°C</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Vibration:</span>
                <div className="font-mono text-right">
                  <div>X: {componentData.vibration.x.toFixed(2)}</div>
                  <div>Y: {componentData.vibration.y.toFixed(2)}</div>
                  <div>Z: {componentData.vibration.z.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-primary/30">
              <span
                className={`text-sm font-bold tracking-wider ${
                  componentData?.status === 'normal'
                    ? 'text-status-normal'
                    : componentData?.status === 'warning'
                    ? 'text-status-warning'
                    : 'text-status-critical'
                }`}
              >
                {componentData?.status?.toUpperCase()}
              </span>
            </div>
          </>
         {/* ) : (
           <p className="text-sm text-muted-foreground">
             Click to view detailed analytics
           </p>
         )} */}
      </div>
    </Html>
  );
}

function Scene({
  componentData,
  hoveredPart,
  onPartHover,
  onPartClick,
  selectedPart,
}) {
    console.log("hoveredPart: ",hoveredPart)
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />
      <directionalLight position={[-10, 10, -10]} intensity={0.8} />
      <hemisphereLight intensity={0.4} groundColor="#111" />

      <Model
        componentData={componentData}
        onPartHover={onPartHover}
        onPartClick={onPartClick}
        selectedPart={selectedPart}
      />

      {hoveredPart && (
        <ComponentTooltip
          partName={hoveredPart.name}
          position={hoveredPart.position}
          componentData={componentData}
        />
      )}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
        // autoRotate={false}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.6}
      />
    </>
  );
}

useGLTF.preload('/models/3Dmotor3.glb');

export function DigitalTwinViewer2({ componentData, onComponentClick }) {
  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const { theme } = useTheme();

  const handlePartClick = (partName) => {
    setSelectedPart(selectedPart === partName ? null : partName);
    onComponentClick?.(partName);
  };

  return (
    <div className={`relative w-full h-full min-h-[600px] ${theme === 'light' ? 'bg-gradient-to-br from-gray-100 to-white' : 'bg-gradient-to-br from-gray-950 to-black'} rounded-xl overflow-hidden border border-cyan-900/30 shadow-2xl`}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-md rounded-lg border border-cyan-800/50">
        <h3 className="text-lg font-bold text-cyan-400 tracking-wider">
          3D DIGITAL TWIN VIEW
        </h3>
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-400">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-yellow-400">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-400">Critical</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
            Loading 3D Model...
          </div>
        }
      >
        <Canvas camera={{ position: [28, 6, 10], fov: 50 }} gl={{ antialias: true }}>
          <Scene
            componentData={componentData}
            hoveredPart={hoveredPart}
            onPartHover={setHoveredPart}
            onPartClick={handlePartClick}
            selectedPart={selectedPart}
          />
        </Canvas>
      </Suspense>

      {/* Selected part hint */}
      {/* {selectedPart && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-cyan-800/50 text-cyan-300 text-sm font-medium shadow-lg">
          Selected: <span className="font-bold text-white">{selectedPart}</span> — Click again to deselect
        </div>
      )} */}
    </div>
  );
}