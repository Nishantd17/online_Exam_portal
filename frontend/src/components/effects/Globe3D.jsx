import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, Float, OrbitControls } from '@react-three/drei';

const GlobeCore = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1.8, 64, 64]}>
        <MeshDistortMaterial
          color="#00f0ff"
          attach="material"
          distort={0.25}
          speed={2}
          roughness={0.1}
          metalness={0.9}
          emissive="#00f0ff"
          emissiveIntensity={0.15}
          wireframe={false}
          transparent
          opacity={0.85}
        />
      </Sphere>
      {/* Outer wireframe ring */}
      <Sphere args={[2.0, 32, 32]}>
        <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.08} />
      </Sphere>
    </Float>
  );
};

const Globe3D = ({ className = '' }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#00f0ff" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#8b5cf6" />
        <pointLight position={[0, 5, -5]} intensity={0.6} color="#ec4899" />
        <Stars radius={80} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        <Suspense fallback={null}>
          <GlobeCore />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default Globe3D;
