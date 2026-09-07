"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { TrendingDown } from "lucide-react";

export interface CliffData {
  timestamp: string;
  percent: number;
  dropAmount: string;
  reason: string;
  prescription: string;
}

interface SceneProps {
  activeCliff: CliffData;
  onSelectCliff: (cliff: CliffData) => void;
  isPlaying: boolean;
  cliffs: CliffData[];
}

// 3D Spline Curve for the Retention Timeline
function RetentionCurve({
  activeCliff,
  onSelectCliff,
  isPlaying,
  cliffs,
}: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const playheadRef = useRef<THREE.Mesh>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Define 3D control points representing the retention trajectory
  const points = useMemo(() => {
    return [
      new THREE.Vector3(-4.6, 1.4, 0),    // 00:00 (100% Hook)
      new THREE.Vector3(-3.2, 1.15, 0.2), // 00:45
      new THREE.Vector3(-2.4, 0.25, 0.1), // 01:24 (Cliff 1: -28.4%)
      new THREE.Vector3(-1.0, 0.35, -0.2),// 02:30 Recovery
      new THREE.Vector3(0.3, 0.2, 0.1),   // 03:50
      new THREE.Vector3(0.9, -0.45, 0.3), // 04:38 (Cliff 2: -19.1%)
      new THREE.Vector3(2.2, -0.35, -0.1),// 06:15 Plateau
      new THREE.Vector3(3.2, -0.9, 0.2),  // 08:15 (Cliff 3: -14.2%)
      new THREE.Vector3(4.6, -1.05, 0),   // 10:24 (End: 62.4%)
    ];
  }, []);

  // Smooth 3D curve
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
  }, [points]);

  // Generate tube geometry along the curve
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 100, 0.055, 12, false);
  }, [curve]);

  // Approximate curve t parameters for the 3 cliffs
  const cliffTValues = useMemo(() => [0.24, 0.58, 0.84], []);

  // Calculate 3D positions for the 3 cliffs
  const cliffPositions = useMemo(() => {
    return cliffTValues.map((t) => curve.getPoint(t));
  }, [curve, cliffTValues]);

  // Dynamic camera & group sway based on mouse pointer
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle smooth float and pointer tilt
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        state.pointer.x * 0.18,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -state.pointer.y * 0.12,
        0.05
      );
    }

    // Animate playhead along curve when playing
    if (playheadRef.current && isPlaying) {
      const time = (state.clock.getElapsedTime() * 0.18) % 1;
      const pos = curve.getPoint(time);
      playheadRef.current.position.copy(pos);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main 3D Retention Tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#18181B"
          emissive="#27272A"
          emissiveIntensity={0.2}
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>

      {/* Subtle Glowing Accent Core inside Tube */}
      <mesh geometry={tubeGeometry} scale={[0.98, 0.98, 0.98]}>
        <meshBasicMaterial color="#D95A2B" transparent opacity={0.65} />
      </mesh>

      {/* 3D Playhead Indicator */}
      {isPlaying && (
        <mesh ref={playheadRef}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial
            color="#FAF8F5"
            emissive="#D48828"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Interactive Cliff Markers in 3D */}
      {cliffPositions.map((pos, index) => {
        const cliff = cliffs[index];
        const isSelected = activeCliff.timestamp === cliff.timestamp;
        const isHovered = hoveredIndex === index;

        return (
          <group key={cliff.timestamp} position={pos}>
            {/* Outer Pulsing Aura Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.19, 32]} />
              <meshBasicMaterial
                color={isSelected ? "#DC2626" : "#D95A2B"}
                transparent
                opacity={isSelected ? 0.9 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Core Clickable 3D Sphere */}
            <mesh
              scale={isSelected ? 1.45 : isHovered ? 1.25 : 1}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCliff(cliff);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredIndex(index);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredIndex(null);
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[0.09, 24, 24]} />
              <meshStandardMaterial
                color={isSelected ? "#DC2626" : "#D95A2B"}
                emissive={isSelected ? "#DC2626" : "#B8461B"}
                emissiveIntensity={isSelected ? 1.6 : 0.8}
                roughness={0.15}
                metalness={0.5}
              />
            </mesh>

            {/* 3D UI Badge Marker attached to Cliff */}
            <Html position={[0, 0.38, 0]} center distanceFactor={8}>
              <button
                onClick={() => onSelectCliff(cliff)}
                className={`group flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-200 shadow-cozy whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-danger text-white ring-4 ring-danger/20 scale-105"
                    : "bg-white/95 hover:bg-white text-danger border border-danger/30 hover:scale-105 backdrop-blur-sm"
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>{cliff.timestamp}</span>
                <span className="font-semibold text-[10px] ml-0.5">
                  {cliff.dropAmount}
                </span>
              </button>
            </Html>
          </group>
        );
      })}

      {/* Floating Spatial Particles in Background */}
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
        {[-3.5, -1.5, 0.8, 2.8, 3.8].map((x, i) => (
          <mesh key={i} position={[x, (i % 2 === 0 ? 1 : -1) * 0.9, -1.2]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshStandardMaterial
              color="#D48828"
              emissive="#D95A2B"
              emissiveIntensity={0.8}
              transparent
              opacity={0.4}
            />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

export default function Retention3DCanvas({
  activeCliff,
  onSelectCliff,
  isPlaying,
  cliffs,
}: SceneProps) {
  return (
    <div className="w-full h-56 relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.8} color="#FAF8F5" />
        <directionalLight position={[4, 5, 4]} intensity={0.9} color="#FFF8F0" />
        <directionalLight position={[-4, 2, 3]} intensity={0.5} color="#D95A2B" />
        <pointLight position={[0, -2, 2]} intensity={0.3} color="#D48828" />

        <RetentionCurve
          activeCliff={activeCliff}
          onSelectCliff={onSelectCliff}
          isPlaying={isPlaying}
          cliffs={cliffs}
        />

        {/* Lightweight warm post-processing bloom */}
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.5}
            luminanceSmoothing={0.85}
            intensity={0.4}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
