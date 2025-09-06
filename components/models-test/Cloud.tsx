"use client";

import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

function getRandom(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

type CloudProps = {
    speed?: number;
    direction?: 1 | -1;
    started?: boolean; // thêm prop
};

export default function Cloud({
    speed = 5,
    direction = -1,
    started = false,
}: CloudProps) {
    const ref = useRef<THREE.Group>(null);
    const cloudIndex = useMemo(() => getRandomInt(1, 3), []);
    const { scene } = useGLTF(`/models/clouds/cloud${cloudIndex}.glb`);

    const initial = useMemo(
        () => ({
            x: getRandom(-50, 50),
            y: getRandom(8, 15),
            z: getRandom(-20, 20),
            scale: getRandom(0.5, 2),
            rotY: getRandom(0, Math.PI * 2),
        }),
        []
    );

    useFrame((_, delta) => {
        if (!ref.current || !started) return; // dừng khi chưa start
        ref.current.position.x += delta * speed * direction;

        if (direction === -1 && ref.current.position.x < -30) {
            ref.current.position.x = getRandom(40, 60);
        } else if (direction === 1 && ref.current.position.x > 30) {
            ref.current.position.x = getRandom(-60, -40);
        }
    });

    return (
        <group
            ref={ref}
            position={[initial.x, initial.y, initial.z]}
            rotation={[0, initial.rotY, 0]}
            scale={initial.scale}
        >
            <primitive object={scene} />
        </group>
    );
}
