import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useGLTF } from '@react-three/drei';
import { useState, Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// Component tooltip/overlay (unchanged)
const ComponentOverlay = ({ status, position }) => {
  const overlayStatusColors = {
    normal: 'border-status-normal bg-status-normal/10',
    warning: 'border-status-warning bg-status-warning/10',
    critical: 'border-status-critical bg-status-critical/10',
  };
  
  return (
    <Html position={position} center>
      <div
        className={cn(
          'px-3 py-2 rounded-lg border backdrop-blur-sm min-w-[140px]',
          'bg-card/90 text-foreground',
          overlayStatusColors[status.status]
        )}
      >
        <div className="font-semibold text-sm mb-1">{status.name}</div>
        <div className="text-xs space-y-0.5 font-mono">
          {status.rpm !== undefined && <div>RPM: {status.rpm.toFixed(0)}</div>}
          {status.temperature !== undefined && (
            <div>Temp: {status.temperature.toFixed(1)}°C</div>
          )}
          {status.torque !== undefined && (
            <div>Torque: {status.torque.toFixed(1)} Nm</div>
          )}
          {status.vibration && (
            <div>
              Vib: {status.vibration.x.toFixed(1)},{' '}
              {status.vibration.y.toFixed(1)},{' '}
              {status.vibration.z.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Html>
  );
};

// GLB Model Component with continuous rotation
const MotorModel = ({
  componentStatuses,
  onComponentClick,
  onHover,
  onLeave,
  hoveredComponent,
  setDragging,
  currentData,
  motorRunning = false,          // NEW
  rotationDirection = 1,         // NEW
}) => {
  const { scene } = useGLTF('/models/3Dmotor.glb');
  const [latestTemp, setLatestTemp] = useState(30);
  const modelRef = useRef(); // ref to the group for rotation
  const MODEL_OFFSET_Y = 1.5;

  // Center & scale model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    console.log("box: ",box)
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);
    scene.scale.setScalar(5); // adjust scale as needed
    scene.rotation.set(0, 0, 0);
  }, [scene]);

  // Temperature color update (unchanged)
  useEffect(() => {
    const getTemperatureColor = (temp) => {
      console.log("temp: ",temp)
      console.log("currentData in twin: ",currentData )
      if (currentData?.motorTemperature <= 60) return new THREE.Color('#1cca5b');
      if (currentData?.motorTemperature <= 80) return new THREE.Color('#c68b15');
      return new THREE.Color('#ff1a1a');
    };

    scene.traverse((child) => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissive.copy(getTemperatureColor(latestTemp));
        child.material.emissiveIntensity = 0.6;
        child.material.needsUpdate = true;
      }
    });
  }, [latestTemp, scene, currentData]);

  // Listen for temperature updates
  useEffect(() => {
    window.updateMotorTemperature = (data) => {
      console.log("datas: ",data)
      setLatestTemp(data?.motorTemperature || 30);
    };
    return () => (window.updateMotorTemperature = null);
  }, []);

  // Continuous slow rotation (only when not dragging)
  useFrame((state, delta) => {
    if (!modelRef.current || setDragging?.current || !motorRunning) return; // don't rotate while user is dragging

    // Rotate slowly around Y-axis (vertical) — adjust speed as needed
    modelRef.current.rotation.y += delta * 0.3 * rotationDirection ; // 0.3 = ~17° per second — feels smooth
  });

  const getStatusByName = (name) =>
    componentStatuses.find((c) => c.name === name) || { name, status: 'normal' };

  const statusColors = {
    normal: new THREE.Color('#22c55e'),
    warning: new THREE.Color('#eab308'),
    critical: new THREE.Color('#ef4444'),
  };

  // Status materials
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.metalness = 0.6;
        child.material.roughness = 0.4;
      }
    });
  }, [scene, componentStatuses]);

  const overlayPositions = {
    Motor: [0, 3, 0],
    Shaft: [2, 2, 0],
    Coupling: [3.5, 2, 0],
    Gearbox: [5, 2.5, 0],
  };

  return (
    <group ref={modelRef} >
      <primitive
        object={scene}
        position={[0, 0, 0]}
        onClick={() => {
          const motor = getStatusByName('Motor');
          onComponentClick?.(motor);
        }}
        onPointerEnter={() => onHover('Motor')}
        onPointerLeave={onLeave}
      />

      {/* Status indicator lights */}
      {/* {['Motor', 'Gearbox'].map((name, index) => {
        const status = getStatusByName(name);
        const color = statusColors[status.status];
        const positions = [
          [-1, 2, 0],
          [4, 2, 0],
        ];

        return (
          <mesh key={name} position={positions[index]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1}
            />
          </mesh>
        );
      })} */}

      {/* Overlay */}
      {hoveredComponent && (
        <ComponentOverlay
          status={getStatusByName(hoveredComponent)}
          position={overlayPositions[hoveredComponent] || [0, 3, 0]}
        />
      )}
    </group>
  );
};

useGLTF.preload('/models/3Dmotor.glb');

const Scene = ({ componentStatuses, onComponentClick, setDragging, currentData, motorRunning, rotationDirection }) => {
  const [hoveredComponent, setHoveredComponent] = useState(null);

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
        onHover={(name) => setHoveredComponent(name)}
        onLeave={() => setHoveredComponent(null)}
        hoveredComponent={hoveredComponent}
        setDragging={setDragging}
        currentData={currentData}
        motorRunning={motorRunning}          // NEW
        rotationDirection={rotationDirection} // NEW
      />
    </>
  );
};

export const DigitalTwinViewer = ({ componentStatuses, onComponentClick, currentData, motorRunning = false, rotationDirection = 1 }) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        'w-full h-full min-h-[400px] rounded-lg overflow-hidden',
        'bg-gradient-to-b from-gray-900 to-black'
      )}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={60} position={[3.5, 1.2, 0]} near={0.1} far={1000} />

        <Suspense fallback={null}>
          <Scene
            componentStatuses={componentStatuses}
            onComponentClick={onComponentClick}
            setDragging={setDragging}
            currentData={currentData}
            motorRunning={motorRunning}          // NEW
            rotationDirection={rotationDirection} // NEW
          />
        </Suspense>

        <OrbitControls
          enabled={!dragging}
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
          zoomToCursor
        />
      </Canvas>
    </div>
  );
};