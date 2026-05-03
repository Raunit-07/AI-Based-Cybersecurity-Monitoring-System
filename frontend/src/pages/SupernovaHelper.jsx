import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

// Register UnrealBloomPass for use in JSX
extend({ UnrealBloomPass });

const ParticleSwarm = ({ count = 6000 }) => {
  const meshRef = useRef();
  const speedMult = 0.5;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) {
       pos.push(new THREE.Vector3(
         (Math.random()-0.5)*100, 
         (Math.random()-0.5)*100, 
         (Math.random()-0.5)*100
       ));
     }
     return pos;
  }, [count]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  }), []);
  
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.15), []);

  const PARAMS = {
    "expSpeed": 4.5,
    "oliveStretch": 3.5,
    "coreDensity": 2.5,
    "chaos": 3.0
  };

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;
    
    for (let i = 0; i < count; i++) {
        const expansionSpeed = PARAMS.expSpeed;
        const oliveStretch = PARAMS.oliveStretch;
        const coreDensity = PARAMS.coreDensity;
        const chaos = PARAMS.chaos;
        
        const n = i / count;
        const isCore = n < 0.03 ? 1.0 : 0.0;
        const isOuter = 1.0 - isCore;
        
        const phi = Math.acos(1.0 - 2.0 * n);
        const theta = Math.PI * 2.0 * i * 1.61803398875;
        
        const dirX = Math.sin(phi) * Math.cos(theta);
        const dirY = Math.sin(phi) * Math.sin(theta);
        const dirZ = Math.cos(phi) * oliveStretch;
        
        const pSpeed = ((i % 100) / 100.0 * 2.0 + 0.5) * expansionSpeed;
        const maxDist = 60.0;
        const timeOffset = (i * 73.19) % maxDist;
        let distOut = ((time * pSpeed + timeOffset) % maxDist) * isOuter;
        
        distOut = Math.pow(distOut, 1.15);
        const maxDistPow = Math.pow(maxDist, 1.15);
        const expansionRatio = distOut / maxDistPow;
        
        const corePulse = Math.sin(time * 15.0 + i * 0.5) * 0.1;
        const coreRadius = coreDensity * (0.6 + corePulse);
        
        const lobe1 = Math.sin(phi * 3.0 - time * 1.5) * Math.cos(theta * 2.0);
        const lobe2 = Math.cos(phi * 2.0 + time * 1.2) * Math.sin(theta * 4.0 - time);
        const lobe3 = Math.sin(phi * 5.0 + theta * 3.0 + time) * 0.5;
        const turbulence = (lobe1 + lobe2 + lobe3) * chaos * expansionRatio;
        
        const radius = coreRadius * isCore + (coreRadius + distOut + turbulence) * isOuter;
        
        target.set(dirX * radius, dirY * radius, dirZ * radius);
        
        const coreHue = 0.6 + (i % 10) * 0.01;
        const coreLight = 0.8 + corePulse;
        
        const elementMap = i % 3;
        const baseOuterHue = 0.17 * elementMap * elementMap - 0.09 * elementMap;
        
        const outerHue = baseOuterHue - expansionRatio * 0.1;
        const outerLight = 0.7 - expansionRatio * 0.65;
        const outerSat = 0.8 + 0.2 * Math.sin(expansionRatio * Math.PI);
        
        const finalHue = coreHue * isCore + outerHue * isOuter;
        const finalLight = coreLight * isCore + outerLight * isOuter;
        const finalSat = 1.0 * isCore + outerSat * isOuter;
        
        const safeHue = (finalHue % 1.0 + 1.0) % 1.0;
        const safeLight = Math.max(0.01, Math.min(1.0, finalLight));
        const safeSat = Math.max(0.0, Math.min(1.0, finalSat));
        
        pColor.setHSL(safeHue, safeSat, safeLight);
        
        positions[i].lerp(target, 0.1);
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

const SupernovaHelper = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: '#000', 
      zIndex: -1,
      pointerEvents: 'none'
    }}>
      <Canvas 
        camera={{ position: [0, 0, 80], fov: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]} // Reduced dpr for better performance
      >
        <fog attach="fog" args={['#000000', 10, 150]} />
        <ParticleSwarm count={6000} />
        <Effects disableGamma>
            <unrealBloomPass threshold={0} strength={1.5} radius={0.5} />
        </Effects>
      </Canvas>
    </div>
  );
};

export default React.memo(SupernovaHelper);
