"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface MovingCloudsProps {
    isGameOver: boolean;
    isGameStarted: boolean;
}

const CLOUD_MODELS = [
    "/models/clouds/Cloud1.glb",
    "/models/clouds/Cloud2.glb",
    "/models/clouds/Cloud3.glb",
];

export const MovingClouds: React.FC<MovingCloudsProps> = ({
    isGameOver,
    isGameStarted,
}) => {
    const cloudsRef = useRef<THREE.Group>(null);
    const objectsRef = useRef<
        {
            mesh: THREE.Object3D;
            initialPosition: THREE.Vector3;
            speed: number;
            offset: number;
        }[]
    >([]);
    const { size } = useThree();

    // load sẵn models
    const cloudScenes = [
        useGLTF(CLOUD_MODELS[0]),
        useGLTF(CLOUD_MODELS[1]),
        useGLTF(CLOUD_MODELS[2]),
    ];
    useEffect(() => {
        if (!cloudsRef.current) return;

        while (cloudsRef.current.children.length > 0) {
            const child = cloudsRef.current.children[0];
            child.removeFromParent();
        }
        objectsRef.current = [];

        const numClouds = 12;
        const spacing = 30;
        const startDistance = 60;

        for (let i = 0; i < numClouds; i++) {
            const index = Math.floor(Math.random() * CLOUD_MODELS.length);
            const gltf = cloudScenes[index];

            const mesh = gltf.scene.clone(true);

            mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material =
                        new THREE.MeshStandardMaterial({
                            color: "#f0f0f0",
                            transparent: true,
                            opacity: 0.9,
                        });
                }
            });

            // Mobile: xa và cao hơn một chút
            const z =
                size.width < 600
                    ? 0 - Math.random() * 70
                    : -80 - Math.random() * 40;
            const x = startDistance + i * spacing;
            const y =
                size.width < 600
                    ? 35 + Math.random() * 5
                    : 10 + Math.random() * 4;
            const scale =
                size.width < 600
                    ? 2.5 + Math.random() * 1.5
                    : 3 + Math.random() * 2;

            mesh.position.set(x, y, z);
            mesh.scale.set(scale, scale, scale);

            cloudsRef.current.add(mesh);

            objectsRef.current.push({
                mesh,
                initialPosition: new THREE.Vector3(x, y, z),
                speed: 0.1 + Math.random() * 0.05, // mobile bay chậm hơn để đỡ chói mắt
                offset: i * spacing,
            });
        }
    }, [size.width, isGameStarted]);

    useFrame((_, delta) => {
        if (isGameOver || !isGameStarted || !cloudsRef.current) return;

        objectsRef.current.forEach((obj) => {
            obj.mesh.position.x -= obj.speed * delta * 60;

            if (obj.mesh.position.x < -80) {
                const maxX = Math.max(
                    ...objectsRef.current.map((o) => o.mesh.position.x)
                );

                // 🔄 Random lại cloud mới
                const index = Math.floor(Math.random() * CLOUD_MODELS.length);
                const gltf = cloudScenes[index];
                const newMesh = gltf.scene.clone(true);

                newMesh.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        (child as THREE.Mesh).material =
                            new THREE.MeshStandardMaterial({
                                color: "#f0f0f0",
                                transparent: true,
                                opacity: 0.9,
                            });
                    }
                });

                const scale =
                    size.width < 600
                        ? 2.5 + Math.random() * 1.5
                        : 3 + Math.random() * 2;

                newMesh.scale.set(scale, scale, scale);
                newMesh.position.set(
                    maxX + 25,
                    obj.mesh.position.y,
                    -40 - Math.random() * 80
                );

                // Thay thế cloud cũ
                if (cloudsRef.current) {
                    cloudsRef.current.remove(obj.mesh);
                    cloudsRef.current.add(newMesh);
                }

                obj.mesh = newMesh;
            }
            if (obj.mesh.position.x < -80) {
                const maxX = Math.max(
                    ...objectsRef.current.map((o) => o.mesh.position.x)
                );

                // 🔄 Random lại cloud mới
                const index = Math.floor(Math.random() * CLOUD_MODELS.length);
                const gltf = cloudScenes[index];
                const newMesh = gltf.scene.clone(true);

                newMesh.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        (child as THREE.Mesh).material =
                            new THREE.MeshStandardMaterial({
                                color: "#f0f0f0",
                                transparent: true,
                                opacity: 0.9,
                            });
                    }
                });

                const scale =
                    size.width < 600
                        ? 2.5 + Math.random() * 1.5
                        : 3 + Math.random() * 2;

                newMesh.scale.set(scale, scale, scale);
                newMesh.position.set(
                    maxX + 25,
                    obj.mesh.position.y,
                    -40 - Math.random() * 80
                );

                // Thay thế cloud cũ
                if (cloudsRef.current) {
                    cloudsRef.current.remove(obj.mesh);
                    cloudsRef.current.add(newMesh);
                }

                obj.mesh = newMesh;
            }
        });
    });

    return <group ref={cloudsRef} />;
};

CLOUD_MODELS.forEach((path) => useGLTF.preload(path));
