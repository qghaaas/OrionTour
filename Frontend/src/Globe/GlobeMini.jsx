import React, { memo, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

import earthDayImg from './img/earthDay.jpg';
import earthBumpImg from './img/earthBump.jpg';

import './Globe.css';

const MINI_GLOBE_RADIUS = 1.2;
const ROTATION_SPEED = 0.25;

useTexture.preload(earthDayImg);
useTexture.preload(earthBumpImg);

function MiniGlobeFallback() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <mesh>
        <sphereGeometry args={[MINI_GLOBE_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#dbeafe"
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </>
  );
}

const MiniGlobeScene = memo(function MiniGlobeScene() {
  const globeRef = useRef(null);
  const [earthTexture, bumpTexture] = useTexture([earthDayImg, earthBumpImg]);

  earthTexture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (!globeRef.current) return;

    globeRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={1.25} />

      <mesh ref={globeRef}>
        <sphereGeometry args={[MINI_GLOBE_RADIUS, 48, 48]} />

        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={1.04}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
    </>
  );
});

export default function GlobeMini() {
  return (
    <div className="globe-mini-wrapper">
      <Canvas
        className="globe-mini-canvas"
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={<MiniGlobeFallback />}>
          <MiniGlobeScene />
        </Suspense>
      </Canvas>

      <div className="globe-mini-link">
        <Link to="/interactive-globe">
          Открыть интерактивную карту
        </Link>
      </div>
    </div>
  );
}