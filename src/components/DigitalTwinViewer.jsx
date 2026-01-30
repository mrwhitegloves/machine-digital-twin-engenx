import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center, Html, useGLTF } from '@react-three/drei';
import { useState, Suspense, useEffect, useRef, useMemo } from 'react';
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
  onPartHover, 
  onPartClick, 
  selectedPart
}) => {
  const { scene } = useGLTF('/models/3Dmotor3.glb');
  const [latestTemp, setLatestTemp] = useState(30);
  const modelRef = useRef(); // ref to the group for rotation
  const MODEL_OFFSET_Y = 1.5;
  const [hoveredMesh, setHoveredMesh] = useState(null);

  // Clone the scene to avoid modifying cached original
  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  // Center & scale model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    // console.log("box: ",box)
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);
    scene.scale.setScalar(105); // adjust scale as needed
    scene.rotation.set(0, 0, 0);
  }, [scene]);

  // Temperature color update (unchanged)
  useEffect(() => {
    const getTemperatureColor = (temp) => {
      // console.log("temp: ",temp)
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
      // console.log("datas: ",data)
      setLatestTemp(data?.motorTemperature || 30);
    };
    return () => (window.updateMotorTemperature = null);
  }, []);

  // Continuous slow rotation (only when not dragging)
  // useFrame((state, delta) => {
  //   if (!modelRef.current || setDragging?.current || !motorRunning) return; // don't rotate while user is dragging

  //   // Rotate slowly around Y-axis (vertical) — adjust speed as needed
  //   modelRef.current.rotation.y += delta * 0.3 * rotationDirection ; // 0.3 = ~17° per second — feels smooth
  // });

  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // Apply hover / selection effects
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const isHovered = hoveredMesh === child.name;
        const isSelected = selectedPart === child.name;

        if (child.material) {
          const material = child.material;
          if (isHovered || isSelected) {
            material.emissive = new THREE.Color('#06b6d4');
            material.emissiveIntensity = isSelected ? 0.5 : 0.3;
          } else {
            material.emissive = new THREE.Color('#000000');
            material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, hoveredMesh, selectedPart]);

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

  const handlePointerOver = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    const name = mesh.name || 'Component';
    setHoveredMesh(name);

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y += 1;

    onPartHover({ name, position: worldPos });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
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

  const overlayPositions = {
    Motor: [0, 3, 0],
    Shaft: [2, 2, 0],
    Coupling: [3.5, 2, 0],
    Gearbox: [5, 2.5, 0],
  };

  return (
    <Center>
      <primitive
        ref={modelRef}
        object={clonedScene}
        scale={1.5}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </Center>
    // <group ref={modelRef} >
    //   <primitive
    //     object={scene}
    //     position={[0, 0, 0]}
    //     onClick={() => {
    //       const motor = getStatusByName('Motor');
    //       onComponentClick?.(motor);
    //     }}
    //     onPointerEnter={() => onHover('Motor')}
    //     onPointerLeave={onLeave}
    //     onPointerOver={handlePointerOver}
    //     onPointerOut={handlePointerOut}
    //     onClick={handleClick}
    //   />
    // </group>
  );
};

function ComponentTooltip({ partName, position, componentData }) {
  console.log("componentData in tooltip: ",componentData)
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
          {data?.name || partName}
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
                {componentData?.status.toUpperCase()}
              </span>
            </div>
          </>
        // ) : (
        //   <p className="text-sm text-muted-foreground">
        //     Click to view detailed analytics
        //   </p>
        // )}
      </div>
    </Html>
  );
}

useGLTF.preload('/models/3Dmotor3.glb');

const Scene = ({ 
  componentStatuses, 
  onComponentClick, 
  setDragging, 
  currentData, 
  motorRunning, 
  rotationDirection,
  hoveredPart,
  onPartHover,
  onPartClick,
  selectedPart,
 }) => {
  const [hoveredComponent, setHoveredComponent] = useState(null);

  return (
    <>
      {/* <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.4} />
      <hemisphereLight intensity={0.3} /> */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#f0abfc" />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -2, 0]} />

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
        onPartHover={onPartHover}
        onPartClick={onPartClick}
        selectedPart={selectedPart}
      />

      {hoveredPart && (
        <ComponentTooltip
          partName={hoveredPart.name}
          position={hoveredPart.position}
          componentData={currentData}
        />
      )}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

export const DigitalTwinViewer = ({ componentStatuses, onComponentClick, currentData, motorRunning = false, rotationDirection = 1 }) => {
  const [dragging, setDragging] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  const handlePartClick = (partName) => {
    setSelectedPart(selectedPart === partName ? null : partName);
    if (onComponentClick) onComponentClick(partName);
  };

  return (
    <div
      className={cn(
        'w-full h-full min-h-[400px] rounded-lg overflow-hidden',
        'bg-gradient-to-b from-gray-900 to-black'
      )}
    >
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-primary animate-pulse">
                Loading 3D Model...
              </div>
            </div>
          }>
      <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
        {/* <PerspectiveCamera makeDefault fov={60} position={[3.5, 1.2, 0]} near={0.1} far={1000} /> */}

          <Scene
            componentStatuses={componentStatuses}
            onComponentClick={onComponentClick}
            setDragging={setDragging}
            currentData={currentData}
            motorRunning={motorRunning}          // NEW
            rotationDirection={rotationDirection} // NEW
            hoveredPart={hoveredPart}
            onPartHover={setHoveredPart}
            onPartClick={handlePartClick}
            selectedPart={selectedPart}
          />

        {/* <OrbitControls
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
          /> */}
      </Canvas>
          </Suspense>
    </div>
  );
};