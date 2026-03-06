import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

export function MedicalAIOrb() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    });

    return (
        <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1}>
            <Sphere args={[1, 64, 64]} ref={meshRef}>
                <MeshDistortMaterial
                    color="#2dd4bf"
                    attach="material"
                    distort={0.3}
                    speed={2}
                    roughness={0}
                    metalness={1}
                    emissive="#14b8a6"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.8}
                />
            </Sphere>
            {/* Inner Core */}
            <Sphere args={[0.4, 32, 32]}>
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={2}
                />
            </Sphere>
            {/* Pulsing Outer Glow */}
            <mesh scale={[1.3, 1.3, 1.3]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.1} />
            </mesh>
            {/* Holographic Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.5, 0.01, 16, 100]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.4} />
            </mesh>
        </Float>
    );
}
