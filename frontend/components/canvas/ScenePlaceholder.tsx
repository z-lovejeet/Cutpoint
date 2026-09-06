"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.8}>
        <MeshDistortMaterial
          color="#6C63FF"
          emissive="#241B7A"
          roughness={0.2}
          metalness={0.8}
          distort={0.4}
          speed={2}
        />
      </Sphere>
    </Float>
  );
}

export default function ScenePlaceholder() {
  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden glass-card">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-background-elevated/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-mono text-text-secondary">R3F Spatial Engine Active</span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00D9FF" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#6C63FF" />
        <AnimatedMesh />
      </Canvas>

      <div className="absolute bottom-4 right-4 z-10 text-xs font-mono text-text-tertiary">
        WebGL 2.0 • 60 FPS
      </div>
    </div>
  );
}
