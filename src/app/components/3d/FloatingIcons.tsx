import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Icosahedron, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({ position, color, type }: { position: [number, number, number], color: string, type: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.x = t * (0.2 + type * 0.1);
        meshRef.current.rotation.y = t * (0.3 + type * 0.1);
    });

    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            {type === 0 && <Icosahedron args={[1, 0]} position={position} ref={meshRef}>
                <meshStandardMaterial color={color} transparent opacity={0.2} wireframe />
            </Icosahedron>}
            {type === 1 && <Cylinder args={[0.5, 0.5, 2, 8]} position={position} ref={meshRef}>
                <meshStandardMaterial color={color} transparent opacity={0.1} />
            </Cylinder>}
            {type === 2 && <Box args={[1, 1, 1]} position={position} ref={meshRef}>
                <meshStandardMaterial color={color} transparent opacity={0.15} wireframe />
            </Box>}
        </Float>
    );
}

export function FloatingMedicalIcons() {
    const shapes = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20 - 10
            ] as [number, number, number],
            color: i % 2 === 0 ? "#3b82f6" : "#2dd4bf",
            type: Math.floor(Math.random() * 3)
        }));
    }, []);

    return (
        <group>
            {shapes.map((shape, i) => (
                <FloatingShape key={i} {...shape} />
            ))}
        </group>
    );
}
