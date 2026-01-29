import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useGLTF } from '@react-three/drei';
import { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// Component tooltip/overlay (unchanged)
const ComponentOverlay = ({ status, position, meshName }) => {
  const overlayStatusColors = {
    normal: 'border-status-normal bg-status-normal/10',
    warning: 'border-status-warning bg-status-warning/10',
    critical: 'border-status-critical bg-status-critical/10',
  };
  
  return (
    <Html position={position} center>
      <div
        className={cn(
          'px-3 py-2 rounded-lg border backdrop-blur-sm min-w-[160px]',
          'bg-card/90 text-foreground shadow-lg',
          overlayStatusColors[status.status]
        )}
      >
        <div className="font-semibold text-sm mb-1 text-primary">{status.name}</div>
        {meshName && <div className="text-xs text-muted-foreground mb-1">Part: {meshName}</div>}
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
        <div className={cn(
          'mt-2 pt-1 border-t text-xs font-semibold uppercase',
          status.status === 'normal' && 'text-status-normal',
          status.status === 'warning' && 'text-status-warning',
          status.status === 'critical' && 'text-status-critical'
        )}>
          {status.status}
        </div>
      </div>
    </Html>
  );
};

// Mouse position tracker for parallax effect
const useMousePosition = () => {
  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (event) => {
      // Normalize to -1 to 1
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return mouse;
};

// GLB Model Component with mouse-driven motion + per-mesh hover detection
const MotorModel = ({
  componentStatuses,
  onComponentClick,
  onHover,
  onLeave,
  hoveredComponent,
  hoveredMesh,
  setHoveredMesh,
  setDragging,
  currentData,
  motorRunning = false,
  rotationDirection = 1,
  mousePosition,
}) => {
  const { scene } = useGLTF('/models/3Dmotor.glb');
  const [latestTemp, setLatestTemp] = useState(30);
  const modelRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });
  const { camera, raycaster, pointer } = useThree();
  
  // Store original materials for hover effect
  const originalMaterials = useRef(new Map());
  const meshList = useRef([]);

  // Center & scale model + collect meshes
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);
    scene.scale.setScalar(5);
    scene.rotation.set(0, 0, 0);
    
    // Collect all meshes for hover detection
    meshList.current = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        meshList.current.push(child);
        // Store original material
        if (child.material) {
          originalMaterials.current.set(child.uuid, child.material.clone());
        }
      }
    });
  }, [scene]);

  // Temperature color update (unchanged)
  useEffect(() => {
    const getTemperatureColor = (temp) => {
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
      setLatestTemp(data?.motorTemperature || 30);
    };
    return () => (window.updateMotorTemperature = null);
  }, []);

  // Per-mesh hover detection + mouse-driven motion
  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    // Mouse-driven parallax motion (subtle rotation following mouse)
    const mouseInfluence = 0.15; // How much mouse affects rotation
    targetRotation.current.x = mousePosition.current.y * mouseInfluence;
    targetRotation.current.y = mousePosition.current.x * mouseInfluence;
    
    // Smooth interpolation for mouse-driven rotation
    if (!setDragging?.current) {
      modelRef.current.rotation.x = THREE.MathUtils.lerp(
        modelRef.current.rotation.x,
        targetRotation.current.x,
        0.05
      );
      
      // Add motor running rotation on top of mouse influence
      if (motorRunning) {
        modelRef.current.rotation.y += delta * 0.3 * rotationDirection;
      } else {
        modelRef.current.rotation.y = THREE.MathUtils.lerp(
          modelRef.current.rotation.y,
          targetRotation.current.y,
          0.05
        );
      }
    }
    
    // Per-mesh raycasting for hover detection
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(meshList.current, true);
    
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const meshName = hitMesh.name || hitMesh.parent?.name || 'Unknown Part';
      
      if (hoveredMesh !== meshName) {
        // Reset previous hovered mesh material
        meshList.current.forEach((mesh) => {
          const original = originalMaterials.current.get(mesh.uuid);
          if (original && mesh.material) {
            mesh.material.emissiveIntensity = 0.6;
          }
        });
        
        // Highlight current mesh
        if (hitMesh.material) {
          hitMesh.material.emissiveIntensity = 1.2;
        }
        
        setHoveredMesh(meshName);
        onHover('Motor'); // Keep component-level hover for overlay
      }
    } else if (hoveredMesh) {
      // Reset all materials when not hovering
      meshList.current.forEach((mesh) => {
        if (mesh.material) {
          mesh.material.emissiveIntensity = 0.6;
        }
      });
      setHoveredMesh(null);
      onLeave();
    }
  });

  const getStatusByName = (name) =>
    componentStatuses.find((c) => c.name === name) || { name, status: 'normal' };

  const overlayPositions = {
    Motor: [0, 3, 0],
    Shaft: [2, 2, 0],
    Coupling: [3.5, 2, 0],
    Gearbox: [5, 2.5, 0],
  };

  return (
    <group ref={modelRef}>
      <primitive
        object={scene}
        position={[0, 0, 0]}
        onClick={() => {
          const motor = getStatusByName('Motor');
          onComponentClick?.(motor);
        }}
      />

      {/* Overlay with mesh name */}
      {hoveredComponent && (
        <ComponentOverlay
          status={getStatusByName(hoveredComponent)}
          position={overlayPositions[hoveredComponent] || [0, 3, 0]}
          meshName={hoveredMesh}
        />
      )}
    </group>
  );
};

useGLTF.preload('/models/3Dmotor.glb');

const Scene = ({ componentStatuses, onComponentClick, setDragging, currentData, motorRunning, rotationDirection, mousePosition }) => {
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [hoveredMesh, setHoveredMesh] = useState(null);

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
        hoveredMesh={hoveredMesh}
        setHoveredMesh={setHoveredMesh}
        setDragging={setDragging}
        currentData={currentData}
        motorRunning={motorRunning}
        rotationDirection={rotationDirection}
        mousePosition={mousePosition}
      />
    </>
  );
};

export const DigitalTwinViewer = ({ componentStatuses, onComponentClick, currentData, motorRunning = false, rotationDirection = 1 }) => {
  const [dragging, setDragging] = useState(false);
  const mousePosition = useMousePosition();

  return (
    <div
      className={cn(
        'w-full h-full min-h-[400px] rounded-lg overflow-hidden',
        'bg-gradient-to-b from-gray-900 to-black dark:from-gray-900 dark:to-black',
        'light:bg-[#F8FAFC]'
      )}
      style={{ background: 'var(--twin-bg, linear-gradient(to bottom, #111827, #000))' }}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={60} position={[3.5, 1.2, 0]} near={0.1} far={1000} />

        <Suspense fallback={null}>
          <Scene
            componentStatuses={componentStatuses}
            onComponentClick={onComponentClick}
            setDragging={setDragging}
            currentData={currentData}
            motorRunning={motorRunning}
            rotationDirection={rotationDirection}
            mousePosition={mousePosition}
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