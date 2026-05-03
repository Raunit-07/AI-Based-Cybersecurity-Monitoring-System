import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

// Register UnrealBloomPass for use in JSX
extend({ UnrealBloomPass });

const ParticleSwarm = ({ count = 5000, isStarted }) => {
  const meshRef = useRef();
  const speedMult = 0.4;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);

  // Initialize particles in a settled state (on the shell) instead of random cube
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const n = i / count;
      const phi = Math.acos(1.0 - 2.0 * n);
      const theta = Math.PI * 2.0 * i * 1.61803398875;
      const radius = 15; // Initial stable radius
      
      pos.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
        Math.cos(phi) * radius
      ));
    }
    return pos;
  }, [count]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0 // Start invisible, will ramp up
  }), []);

  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.08), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Smooth ramp up for intensity over 4 seconds after starting
    // Use a small buffer to avoid negative values
    const intensity = isStarted ? Math.min(1, Math.max(0, (time - 0.8) / 4)) : 0;
    
    // Update material opacity based on intensity
    material.opacity = 0.2 + intensity * 0.6; // Fade from 0.2 to 0.8

    // If not started, just render the initial static state once
    if (!isStarted && time > 0.1) {
      // We still need to set initial matrices once
      if (meshRef.current.count === count && !meshRef.current._initialSet) {
        for (let i = 0; i < count; i++) {
          dummy.position.copy(positions[i]);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current._initialSet = true;
      }
      return;
    }

    const animTime = time * speedMult;

    for (let i = 0; i < count; i++) {
      const n = i / count;
      const phi = Math.acos(1.0 - 2.0 * n);
      const theta = Math.PI * 2.0 * i * 1.61803398875;

      // Modulate radius and movement by intensity
      const baseRadius = 15;
      const variance = Math.sin(animTime + n * 10) * 5 * intensity;
      const radius = baseRadius + variance;

      target.set(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
        Math.cos(phi) * radius
      );

      pColor.setHSL(0.6 + Math.sin(animTime * 0.2 + n) * 0.1, 0.8, 0.5 + Math.sin(animTime + n * 5) * 0.2);

      // Lerp movement is also dampened by intensity initially
      positions[i].lerp(target, 0.01 + 0.01 * intensity);
      dummy.position.copy(positions[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

/**
 * Supernova Background Component
 */
export const Supernova = () => {
  const [mounted, setMounted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Fade in the container
    setMounted(true);

    // Delay the animation start
    const timer = setTimeout(() => {
      setIsStarted(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="supernova-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1.5s ease-in-out'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10] }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#000', 5, 25]} />
        <ParticleSwarm isStarted={isStarted} />
        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.5} radius={0.5} />
        </Effects>
      </Canvas>
    </div>
  );
};

export default React.memo(Supernova);

