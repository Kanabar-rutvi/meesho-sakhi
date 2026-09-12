import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';

function FloatingShape({ position, color, children, speed, floatIntensity }) {
  const mesh = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = Math.cos(t / 4) / 2;
    mesh.current.rotation.y = Math.sin(t / 4) / 2;
    mesh.current.rotation.z = Math.sin(t / 1.5) / 2;
    // We handle vertical floating mostly via <Float> wrapper, 
    // but we can add secondary oscillation if needed.
  });

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={floatIntensity}>
      <mesh ref={mesh} position={position} castShadow receiveShadow>
        {children}
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.1}
          metalness={0.1}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 40 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <Environment preset="city" />
        
        <PresentationControls 
          global 
          rotation={[0, 0, 0]} 
          polar={[-0.4, 0.2]} 
          azimuth={[-1, 0.75]} 
          config={{ mass: 2, tension: 400 }} 
          snap={{ mass: 4, tension: 400 }}
        >
          {/* Primary Candy Shape */}
          <FloatingShape position={[3.5, 0, 0]} color="#e040a0" speed={2} floatIntensity={0.5}>
            <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          </FloatingShape>

          {/* Secondary Purple Shape */}
          <FloatingShape position={[-3.5, 1, -2]} color="#7c52aa" speed={1.5} floatIntensity={0.8}>
            <octahedronGeometry args={[1.5]} />
          </FloatingShape>

          {/* Tertiary Blue Shape */}
          <FloatingShape position={[-2, -2, 1]} color="#0096cc" speed={2.5} floatIntensity={0.4}>
            <capsuleGeometry args={[0.5, 1, 4, 16]} />
          </FloatingShape>
          
          {/* Little accents */}
          <FloatingShape position={[3, 2, -1]} color="#fbcce4" speed={3} floatIntensity={1}>
            <sphereGeometry args={[0.5, 32, 32]} />
          </FloatingShape>
          <FloatingShape position={[0, 3, -3]} color="#e040a0" speed={1} floatIntensity={0.5}>
            <torusGeometry args={[0.5, 0.2, 16, 32]} />
          </FloatingShape>
        </PresentationControls>

        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>
    </div>
  );
}
