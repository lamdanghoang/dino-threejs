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

type CrapProps = {
    speed?: number;
    direction?: 1 | -1;
    started?: boolean;
};

const CRAP_ASSETS = [
    ["SmallPalmTree.glb", 0.5],
    ["BigPalmTree.glb", 0.8],
    ["Skull.glb", 0.2],
    ["Scorpion.glb", 0.2],
    ["Pyramid.glb", 2],
    ["Monument.glb", 1],
    ["Cactus1.glb", 0.3],
    ["Cactus2.glb", 0.3],
    ["Cactus3.glb", 0.3],
];

export default function Crap({
    speed = 5,
    direction = -1,
    started = false,
}: CrapProps) {
    const ref = useRef<THREE.Group>(null);

    const [asset, scale] = useMemo(
        () => CRAP_ASSETS[getRandomInt(0, CRAP_ASSETS.length - 1)],
        []
    );
    const { scene } = useGLTF(`/models/desert/${asset}`);

    const initial = useMemo(
        () => ({
            x: getRandom(-50, 50),
            z: getRandom(-15, 15),
            scale: scale as number,
            rotY: getRandom(0, Math.PI * 2),
        }),
        [scale]
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
            position={[initial.x, 0, initial.z]}
            rotation={[0, initial.rotY, 0]}
            scale={initial.scale}
        >
            <primitive object={scene} />
        </group>
    );
}
