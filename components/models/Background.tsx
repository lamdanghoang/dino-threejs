"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Group, Mesh, Object3D, Vector3 } from "three";

interface CubeData {
    mesh: Object3D;
    initialPosition: Vector3;
    speed: number;
    offset: number;
    isColliding: boolean;
    collisionTime: number;
}

interface MovingBackgroundCubesProps {
    collisionCubes: React.RefObject<CubeData[]>;
    isGameOver: boolean;
    isGameStarted: boolean;
    onScoreUpdate: () => void;
}

const CACTUS_ASSETS = ["Cactus2.glb", "Cactus3.glb"];

// Preload models để giảm giật lag
CACTUS_ASSETS.forEach((asset) => {
    useGLTF.preload(`/models/desert/${asset}`);
});

// Ground Component
export const Ground: React.FC = () => {
    return (
        <>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[1000, 1000]} /> {/* tăng size cho to */}
                <meshStandardMaterial color={"#EDC9AF"} /> {/* desert sand */}
            </mesh>
        </>
    );
};

// Lighting Setup
export const Lighting: React.FC = () => {
    return (
        <>
            {/* ánh sáng tổng thể dịu */}
            <ambientLight intensity={0.4} color={"#fff8e7"} />

            {/* ánh sáng mặt trời từ trên bên phải */}
            <directionalLight
                position={[15, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={60}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                color={"#fffbe6"}
            />

            {/* điểm sáng phụ để tạo hiệu ứng tối ở các mặt ngược sáng */}
            <pointLight
                position={[-10, 5, -10]}
                intensity={0.3}
                color={"#888"}
            />
        </>
    );
};

export const MovingBackgroundCubes: React.FC<MovingBackgroundCubesProps> = ({
    collisionCubes,
    isGameOver,
    isGameStarted,
    onScoreUpdate,
}) => {
    const cubesRef = useRef<Group>(null);
    const passedCubesRef = useRef<Set<number>>(new Set());
    const { size } = useThree();

    const cactusModels = [
        useGLTF(`/models/desert/${CACTUS_ASSETS[0]}`),
        useGLTF(`/models/desert/${CACTUS_ASSETS[1]}`),
    ];

    useEffect(() => {
        if (!cubesRef.current) return;

        while (cubesRef.current.children.length > 0) {
            const child = cubesRef.current.children[0];
            child.removeFromParent();
        }

        collisionCubes.current = [];
        passedCubesRef.current.clear();

        const numCubes = 15;
        const startDistance = 50;

        for (let i = 0; i < numCubes; i++) {
            const cactusCount = Math.random() < 0.5 ? 1 : 2;
            const group = new THREE.Group();

            for (let j = 0; j < cactusCount; j++) {
                const index = Math.floor(Math.random() * cactusModels.length);
                const { scene } = cactusModels[index]; // ✅ lấy từ cache hook
                const mesh = scene.clone(true);

                mesh.traverse((child) => {
                    if ((child as Mesh).isMesh) {
                        (child as Mesh).castShadow = true;
                        (child as Mesh).receiveShadow = true;
                        (child as Mesh).material =
                            new THREE.MeshStandardMaterial({
                                color: "#228B22",
                            });
                    }
                });

                mesh.position.x = j * 0.6;
                group.add(mesh);
            }

            // 🔀 random spacing hợp lý hơn
            const spacing = 12 + Math.random() * 8;

            const x = startDistance + i * spacing;
            group.position.set(x, 0, 0);
            cubesRef.current.add(group);

            collisionCubes.current.push({
                mesh: group,
                initialPosition: new THREE.Vector3(x, 0, 0),
                speed: 0.2,
                offset: i * spacing,
                isColliding: false,
                collisionTime: 0,
            });
        }
    }, [collisionCubes, isGameStarted]);

    useFrame((_, delta) => {
        if (isGameOver || !isGameStarted) return;

        const time = Date.now() * 0.001;
        collisionCubes.current.forEach((cube, index) => {
            if (!cube.mesh) return;

            cube.mesh.position.x -= cube.speed * delta * 60;
            cube.mesh.position.y =
                cube.initialPosition.y + Math.sin(time + index * 0.5) * 0.08;

            if (
                cube.mesh.position.x < -1 &&
                !passedCubesRef.current.has(index)
            ) {
                passedCubesRef.current.add(index);
                onScoreUpdate();
            }

            if (cube.mesh.position.x < -8) {
                const maxX = Math.max(
                    ...collisionCubes.current.map((c) => c.mesh.position.x)
                );

                // 🔄 random lại loại cactus
                const cactusCount = Math.random() < 0.5 ? 1 : 2;
                const newGroup = new THREE.Group();

                for (let j = 0; j < cactusCount; j++) {
                    const idx = Math.floor(Math.random() * cactusModels.length);
                    const { scene } = cactusModels[idx];
                    const mesh = scene.clone(true);

                    mesh.traverse((child) => {
                        if ((child as Mesh).isMesh) {
                            (child as Mesh).castShadow = true;
                            (child as Mesh).receiveShadow = true;
                            (child as Mesh).material =
                                new THREE.MeshStandardMaterial({
                                    color: "#228B22",
                                });
                        }
                    });

                    mesh.position.x = j * 0.6;
                    newGroup.add(mesh);
                }

                // thay thế mesh cũ bằng mesh mới
                if (cubesRef.current) {
                    cubesRef.current.remove(cube.mesh);
                    cubesRef.current.add(newGroup);
                }

                // 🔀 random spacing mới
                const spacing = 5 + Math.random() * 20;

                cube.mesh = newGroup;
                cube.mesh.position.set(maxX + spacing, 0, 0); // ✅ dùng spacing mới
                cube.initialPosition.set(maxX + spacing, 0, 0); // ✅ nhớ update lại initialPosition
                cube.isColliding = false;
                passedCubesRef.current.delete(index);
            }
        });
    });

    return <group ref={cubesRef} scale={size.width < 600 ? 0.65 : 1} />;
};

// Background Environment
export const BackgroundEnvironment: React.FC = () => {
    const { scene } = useThree();

    // thiết lập màu nền
    scene.background = new THREE.Color("#87ceeb"); // bầu trời xanh

    // thiết lập fog
    scene.fog = new THREE.Fog("#87ceeb", 60, 200);

    return null; // không cần render mesh gì cả
};
