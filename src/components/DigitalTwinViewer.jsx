import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Center } from '@react-three/drei';
import { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// Component tooltip that follows hovered part
const ComponentTooltip = ({ partName, position, currentData, componentStatuses }) => {
  // Find matching component data
  const matchedStatus = componentStatuses?.find(
    (c) => partName.toLowerCase().includes(c.name.toLowerCase()) ||
           c.name.toLowerCase().includes(partName.toLowerCase())
  );

  const status = matchedStatus?.status || 'normal';

  return (
    <Html position={[position.x, position.y, position.z]} center>
      <div className="min-w-[220px] bg-card/95 backdrop-blur-sm border border-primary/60 rounded-lg p-4 shadow-lg pointer-events-none">
        <h4 className="text-base font-bold text-primary mb-3 tracking-wide">
          {matchedStatus?.name || partName}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">RPM:</span>
            <span className="font-mono">{currentData?.rpm?.toFixed(0) || 1450}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Torque:</span>
            <span className="font-mono">{currentData?.torque?.toFixed(1) || 245} Nm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temp:</span>
            <span className="font-mono">{currentData?.motorTemperature?.toFixed(1) || 63.4}°C</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Vibration:</span>
            <div className="font-mono text-right">
              <div>X: {currentData?.vibration?.x?.toFixed(2) || '0.20'}</div>
              <div>Y: {currentData?.vibration?.y?.toFixed(2) || '0.16'}</div>
              <div>Z: {currentData?.vibration?.z?.toFixed(2) || '0.33'}</div>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-primary/30">
          <span
            className={cn(
              'text-sm font-bold tracking-wider uppercase',
              status === 'normal' && 'text-status-normal',
              status === 'warning' && 'text-status-warning',
              status === 'critical' && 'text-status-critical'
            )}
          >
            {status}
          </span>
        </div>
      </div>
    </Html>
  );
};

// GLB Model Component with pointer events for hover detection
const MotorModel = ({
  componentStatuses,
  onComponentClick,
  hoveredPart,
  setHoveredPart,
  currentData,
  motorRunning = false,
  rotationDirection = 1,
  selectedPart,
  setSelectedPart,
}) => {
  const { scene } = useGLTF('/models/3Dmotor.glb');
  const modelRef = useRef();
  const [hoveredMesh, setHoveredMesh] = useState(null);

  // Clone the scene to avoid modifying cached original
  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  // Center & scale model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.sub(center);
    clonedScene.scale.setScalar(5);
  }, [clonedScene]);

  // Apply hover / selection effects
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const isHovered = hoveredMesh === child.name;
        const isSelected = selectedPart === child.name;

        if (isHovered || isSelected) {
          child.material.emissive = new THREE.Color('#06b6d4');
          child.material.emissiveIntensity = isSelected ? 0.5 : 0.3;
        } else {
          child.material.emissive = new THREE.Color('#000000');
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [clonedScene, hoveredMesh, selectedPart]);

  // Temperature color update
  useEffect(() => {
    const getTemperatureColor = (temp) => {
      if (temp <= 60) return new THREE.Color('#1cca5b');
      if (temp <= 80) return new THREE.Color('#c68b15');
      return new THREE.Color('#ff1a1a');
    };

    clonedScene.traverse((child) => {
      if (child.isMesh && child.material?.emissive && !hoveredMesh && !selectedPart) {
        child.material.emissive.copy(getTemperatureColor(currentData?.motorTemperature || 30));
        child.material.emissiveIntensity = 0.3;
        child.material.needsUpdate = true;
      }
    });
  }, [currentData?.motorTemperature, clonedScene, hoveredMesh, selectedPart]);

  // Floating animation + motor rotation
  useFrame((state, delta) => {
    if (!modelRef.current) return;

    // Subtle floating motion
    modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

    // Motor running rotation
    if (motorRunning) {
      modelRef.current.rotation.y += delta * 0.3 * rotationDirection;
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    const name = mesh.name || 'Component';
    setHoveredMesh(name);

    // Get world position for tooltip
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y += 1.5;

    setHoveredPart({ name, position: worldPos });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredMesh(null);
    setHoveredPart(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    const name = mesh.name || 'Component';
    setSelectedPart(selectedPart === name ? null : name);
    onComponentClick?.({ name, status: 'normal' });
  };

  return (
    <Center>
      <primitive
        ref={modelRef}
        object={clonedScene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </Center>
  );
};

useGLTF.preload('/models/3Dmotor.glb');

const Scene = ({ 
  componentStatuses, 
  onComponentClick, 
  currentData, 
  motorRunning, 
  rotationDirection,
  hoveredPart,
  setHoveredPart,
  selectedPart,
  setSelectedPart,
}) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.4} />
      <hemisphereLight intensity={0.3} />

      <MotorModel
        componentStatuses={componentStatuses}
        onComponentClick={onComponentClick}
        hoveredPart={hoveredPart}
        setHoveredPart={setHoveredPart}
        currentData={currentData}
        motorRunning={motorRunning}
        rotationDirection={rotationDirection}
        selectedPart={selectedPart}
        setSelectedPart={setSelectedPart}
      />

      {/* Tooltip for hovered part */}
      {hoveredPart && (
        <ComponentTooltip
          partName={hoveredPart.name}
          position={hoveredPart.position}
          currentData={currentData}
          componentStatuses={componentStatuses}
        />
      )}
    </>
  );
};

export const DigitalTwinViewer = ({ 
  componentStatuses, 
  onComponentClick, 
  currentData, 
  motorRunning = false, 
  rotationDirection = 1 
}) => {
  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  return (
    <div
      className={cn(
        'w-full h-full min-h-[400px] rounded-lg overflow-hidden relative',
        'bg-gradient-to-b from-gray-900 to-black dark:from-gray-900 dark:to-black',
        'light:bg-[#F8FAFC]'
      )}
      style={{ 
        background: 'var(--twin-bg, linear-gradient(to bottom, #111827, #000))',
        touchAction: 'none' 
      }}
    >
      <Canvas 
        shadows 
        style={{ touchAction: 'none' }}
        onPointerMissed={() => setSelectedPart(null)}
      >
        <PerspectiveCamera makeDefault fov={60} position={[5, 3, 5]} near={0.1} far={1000} />

        <Suspense fallback={null}>
          <Scene
            componentStatuses={componentStatuses}
            onComponentClick={onComponentClick}
            currentData={currentData}
            motorRunning={motorRunning}
            rotationDirection={rotationDirection}
            hoveredPart={hoveredPart}
            setHoveredPart={setHoveredPart}
            selectedPart={selectedPart}
            setSelectedPart={setSelectedPart}
          />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={25}
          target={[0, 0.8, 0]}
          rotateSpeed={1.0}
          zoomSpeed={1.2}
          panSpeed={0.8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 0.9}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {selectedPart && (
        <div className="absolute bottom-4 left-4 right-4 text-xs text-center text-foreground">
          Selected: <span className="text-primary font-semibold">{selectedPart}</span> — Click again to deselect
        </div>
      )}
    </div>
  );
};
