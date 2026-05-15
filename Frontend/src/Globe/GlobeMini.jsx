import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import earthDayImg from './img/earthDay.jpg';
import earthBumpImg from './img/earthNight.jpg';
import './Globe.css';
import { Link } from 'react-router-dom'


function MiniGlobeScene() {
  const globeRef = useRef();
  const dayTexture = new TextureLoader().load(earthDayImg);
  const bumpTexture = new TextureLoader().load(earthBumpImg);

  // Вращение глобуса
  useFrame(() => {
    if (globeRef.current) globeRef.current.rotation.y += 0.002;
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <mesh ref={globeRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          shininess={5}
        />
      </mesh>
    </>
  );
}

export default function GlobeMini({ onClick }) {
  return (
    <div className="globe-mini-wrapper">
      <Canvas className="globe-mini-canvas" camera={{ position: [0, 0, 3.2], fov: 50 }}>
        <MiniGlobeScene />
      </Canvas>
      <div className="globe-mini-link">
        <Link to="/interactive-globe">Открыть интерактивную карту</Link>
      </div>
    </div>
  );
}