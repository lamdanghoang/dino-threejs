"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Mesh } from "three";

const models = [
    {
        path: "/models/desert/SmallPalmTree.glb",
        texture: "/textures/PalmTree.png",
        scale: 3,
    },
    {
        path: "/models/desert/BigPalmTree.glb",
        texture: "/textures/PalmTree.png",
        scale: 5,
    },
    {
        path: "/models/desert/Skull.glb",
        texture: "/textures/Ground.png",
        scale: 1,
    },
    {
        path: "/models/desert/Pyramid.glb",
        texture: "/textures/Ground.png",
        scale: 40,
    },
    {
        path: "/models/desert/Monument.glb",
        texture: "/textures/Ground.png",
        scale: 10,
    },
    {
        path: "/models/desert/Cactus1.glb",
        texture: "/textures/Ground.png",
        scale: 5,
    },
    {
        path: "/models/desert/Cactus2.glb",
        texture: "/textures/Ground.png",
        scale: 5,
    },
    {
        path: "/models/desert/Cactus3.glb",
        texture: "/textures/Ground.png",
        scale: 5,
    },
];

interface MovingBackgroundObjectsProps {
    isGameOver: boolean;
    isGameStarted: boolean;
}

export const MovingBackgroundObjects: React.FC<
    MovingBackgroundObjectsProps
> = ({ isGameOver, isGameStarted }) => {
    const groupRef = useRef<THREE.Group>(null);
    const objectsRef = useRef<
        {
            mesh: THREE.Object3D;
            initialPosition: THREE.Vector3;
            speed: number;
            offset: number;
        }[]
    >([]);
    const { size } = useThree();

    // load models
    const gltfs = [
        useGLTF(models[0].path),
        useGLTF(models[1].path),
        useGLTF(models[2].path),
        useGLTF(models[3].path),
        useGLTF(models[4].path),
        useGLTF(models[5].path),
        useGLTF(models[6].path),
        useGLTF(models[7].path),
    ];

    // khởi tạo objects giống MovingCubes nhưng xa hơn
    useEffect(() => {
        if (!groupRef.current) return;

        while (groupRef.current.children.length > 0) {
            const child = groupRef.current.children[0];
            child.removeFromParent();
        }
        objectsRef.current = [];

        const numObjects = 12;
        const spacing = 25;
        const startDistance = 80;

        for (let i = 0; i < numObjects; i++) {
            const index = Math.floor(Math.random() * models.length);
            const gltf = gltfs[index];

            const mesh = gltf.scene.clone(true);
            mesh.traverse((child) => {
                if ((child as Mesh).isMesh) {
                    const childMesh = child as Mesh;
                    childMesh.castShadow = true;
                    childMesh.receiveShadow = true;
                    if (models[index].path.includes("Cactus")) {
                        childMesh.material = new THREE.MeshStandardMaterial({
                            color: "#228B22",
                        });
                    } else {
                        childMesh.material = new THREE.MeshStandardMaterial({
                            color: "#808080",
                        });
                    }
                }
            });

            // random z để thấy xa gần
            const z =
                size.width < 600
                    ? -35 - Math.random() * 80
                    : -40 - Math.random() * 80;
            const x = startDistance + i * spacing;
            const y = 0;
            const scale = models[index].scale * 0.5;

            mesh.position.set(x, y, z);
            mesh.scale.set(scale, scale, scale);

            groupRef.current.add(mesh);

            objectsRef.current.push({
                mesh,
                initialPosition: new THREE.Vector3(x, y, z),
                speed: 0.1 + Math.random() * 0.1, // giống movingcubes: random speed
                offset: i * spacing,
            });
        }
    }, [size.width, isGameStarted]);

    // update frame
    useFrame((_, delta) => {
        if (isGameOver || !isGameStarted || !groupRef.current) return;

        objectsRef.current.forEach((obj) => {
            obj.mesh.position.x -= obj.speed * delta * 60;

            if (obj.mesh.position.x < -80) {
                const maxX = Math.max(
                    ...objectsRef.current.map((o) => o.mesh.position.x)
                );

                // 🔄 Random lại model mới
                const index = Math.floor(Math.random() * models.length);
                const gltf = gltfs[index];
                const newMesh = gltf.scene.clone(true);

                newMesh.traverse((child) => {
                    if ((child as Mesh).isMesh) {
                        const childMesh = child as Mesh;
                        childMesh.castShadow = true;
                        childMesh.receiveShadow = true;
                        if (models[index].path.includes("Cactus")) {
                            childMesh.material = new THREE.MeshStandardMaterial(
                                {
                                    color: "#228B22",
                                }
                            );
                        } else {
                            childMesh.material = new THREE.MeshStandardMaterial(
                                {
                                    color: "#808080",
                                }
                            );
                        }
                    }
                });

                const scale = models[index].scale * 0.5;
                newMesh.scale.set(scale, scale, scale);
                newMesh.position.set(maxX + 25, 0, -40 - Math.random() * 80);

                // thay thế mesh cũ
                if (groupRef.current) {
                    groupRef.current.remove(obj.mesh);
                    groupRef.current.add(newMesh);
                }

                obj.mesh = newMesh;
            }
        });
    });

    return <group ref={groupRef} />;
};

// preload models
models.forEach((item) => useGLTF.preload(item.path));
