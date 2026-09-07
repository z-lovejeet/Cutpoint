"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere } from "@react-three/drei";
import * as THREE from "three";

function AmbientFloatingSpheres() {
  const sphere1Ref = useRef<THREE.Mesh>(null);
  const sphere2Ref = useRef<THREE.Mesh>(null);
  const sphere3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (sphere1Ref.current) {
      sphere1Ref.current.position.y = Math.sin(t * 0.5) * 0.4 + 1.2;
      sphere1Ref.current.rotation.x = t * 0.1;
    }
    if (sphere2Ref.current) {
      sphere2Ref.current.position.y = Math.cos(t * 0.4) * 0.5 - 1.2;
      sphere2Ref.current.rotation.y = t * 0.15;
    }
    if (sphere3Ref.current) {
      sphere3Ref.current.position.x = Math.sin(t * 0.3) * 0.3 + 2.5;
    }
  });

  return (
    <>
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.2}>
        <Sphere ref={sphere1Ref} args={[1.6, 48, 48]} position={[-2.4, 1.2, -2]}>
          <meshPhysicalMaterial
            color="#6C63FF"
            emissive="#2A1B7A"
            roughness={0.25}
            metalness={0.1}
            transmission={0.65}
            ior={1.4}
            thickness={1.5}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Sphere ref={sphere2Ref} args={[1.2, 48, 48]} position={[2.6, -1.2, -1.5]}>
          <meshPhysicalMaterial
            color="#00D9FF"
            emissive="#004754"
            roughness={0.2}
            metalness={0.2}
            transmission={0.7}
            ior={1.4}
            thickness={1.2}
            transparent
            opacity={0.65}
          />
        </Sphere>
      </Float>

      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.8}>
        <Sphere ref={sphere3Ref} args={[0.8, 32, 32]} position={[2.2, 2, -3]}>
          <meshStandardMaterial
            color="#8F88FF"
            roughness={0.4}
            metalness={0.6}
            transparent
            opacity={0.4}
          />
        </Sphere>
      </Float>
    </>
  );
}

export default function AuthScene() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} color="#00D9FF" />
        <pointLight position={[-10, 5, -2]} intensity={1.5} color="#6C63FF" />
        <AmbientFloatingSpheres />
      </Canvas>
    </div>
  );
}
