"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { Group, Mesh, SkinnedMesh } from "three";

interface CubeData {
    mesh: THREE.Mesh;
    initialPosition: THREE.Vector3;
    speed: number;
    offset: number;
    isColliding: boolean;
    collisionTime: number;
}

// Type definitions
type Vector3Like = { x: number; y: number; z: number };

interface JumpingCubeProps {
    onCollision: (cubeIndex: number) => void;
    collisionCubes: React.RefObject<CubeData[]>;
    isGameOver: boolean;
    isGameStarted: boolean;
    onGameStart: () => void;
}

// Collision detection utility with proper typing
const detectCollision = (
    cube1Pos: Vector3Like,
    cube2Pos: Vector3Like,
    size1: number = 1,
    size2: number = 0.8
): boolean => {
    const distance: number = Math.sqrt(
        Math.pow(cube1Pos.x - cube2Pos.x, 2) +
            Math.pow(cube1Pos.y - cube2Pos.y, 2) +
            Math.pow(cube1Pos.z - cube2Pos.z, 2)
    );
    return distance < (size1 + size2) / 2;
};

export default function JumpingCube({
    onCollision,
    collisionCubes,
    isGameOver,
    isGameStarted,
    onGameStart,
}: JumpingCubeProps) {
    const ref = useRef<Group>(null);

    // Load model
    const { nodes, materials, animations } = useGLTF(
        "/models/Velociraptor.glb"
    );
    const { actions } = useAnimations(animations, ref);
    const { size } = useThree();

    // Jump state
    const velocity = useRef(0);
    const positionY = useRef(0);
    const isJumping = useRef(false);

    // === Animation defaults ===
    useEffect(() => {
        actions["Armature|Velociraptor_Idle"]?.reset().fadeIn(0.5).play();
    }, [actions]);

    // Switch Idle → Run khi start game
    useEffect(() => {
        if (isGameStarted) {
            actions["Armature|Velociraptor_Idle"]?.fadeOut(0.3);
            actions["Armature|Velociraptor_Run"]?.reset().fadeIn(0.3).play();
        }
    }, [isGameStarted, actions]);

    // === Jump handler ===
    const handleJump = () => {
        if (positionY.current === 0 && !isJumping.current && !isGameOver) {
            velocity.current = 20;
            isJumping.current = true;

            const jumpAction = actions["Armature|Velociraptor_Jump"];
            const runAction = actions["Armature|Velociraptor_Run"];

            if (jumpAction && runAction) {
                runAction.fadeOut(0.1);
                jumpAction
                    .reset()
                    .setLoop(THREE.LoopOnce, 1)
                    .fadeIn(0.1)
                    .play();
                jumpAction.clampWhenFinished = true;
            }
        }
    };

    // === Input events ===
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (!isGameStarted && !isGameOver) {
                    onGameStart(); // chỉ start, không jump
                } else if (isGameStarted && !isGameOver) {
                    handleJump();
                }
            }
        };

        const handleTouch = () => {
            if (!isGameStarted && !isGameOver) {
                onGameStart();
            } else if (isGameStarted && !isGameOver) {
                handleJump();
            }
        };

        window.addEventListener("keydown", handleKey);
        window.addEventListener("touchstart", handleTouch);
        window.addEventListener("click", handleTouch);

        return () => {
            window.removeEventListener("keydown", handleKey);
            window.removeEventListener("touchstart", handleTouch);
            window.removeEventListener("click", handleTouch);
        };
    }, [isGameStarted, isGameOver, onGameStart]);

    // === Physics + collision ===
    useFrame((_, delta) => {
        if (!ref.current || isGameOver) return;

        // gravity
        const gravity = -75;
        const acceleration = gravity * delta;

        // update Y
        positionY.current += delta * (velocity.current + acceleration * 0.5);
        positionY.current = Math.max(positionY.current, 0);

        // update velocity
        velocity.current += acceleration;
        velocity.current = Math.max(velocity.current, -100);

        // apply to model
        ref.current.position.y = positionY.current;

        // reset to run khi chạm đất
        if (isJumping.current && positionY.current <= 0.05) {
            const runAction = actions["Armature|Velociraptor_Run"];
            const jumpAction = actions["Armature|Velociraptor_Jump"];
            if (runAction && jumpAction) {
                jumpAction.fadeOut(0.1);
                runAction.reset().fadeIn(0.2).play();
            }
            isJumping.current = false;
        }

        // === Collision check ===
        if (isGameStarted && !isGameOver) {
            const playerWorldPos = new THREE.Vector3();
            ref.current.getWorldPosition(playerWorldPos);

            collisionCubes.current.forEach((cube, index) => {
                if (cube && cube.mesh) {
                    const cubeWorldPos = new THREE.Vector3();
                    cube.mesh.getWorldPosition(cubeWorldPos);

                    if (detectCollision(playerWorldPos, cubeWorldPos)) {
                        onCollision(index);
                    }
                }
            });
        }
    });

    return (
        <group
            ref={ref}
            name="dino"
            position={size.width < 600 ? [0, 0, 0] : [0, 0, 0]} // mobile dịch ít hơn
            scale={size.width < 600 ? 0.002 : 0.003} // mobile to hơn
            rotation={[0, Math.PI / 2, 0]}
        >
            <group>
                <group name="RootNode">
                    <group
                        name="Armature"
                        rotation={[-Math.PI / 2, 0, 0]}
                        scale={100}
                    >
                        <primitive object={nodes.root} />
                    </group>
                    <group
                        name="Velociraptor"
                        rotation={[-Math.PI / 2, 0, 0]}
                        scale={351.938}
                    >
                        <skinnedMesh
                            name="Cylinder"
                            geometry={(nodes.Cylinder as Mesh).geometry}
                            material={materials.LightBrown}
                            skeleton={(nodes.Cylinder as SkinnedMesh).skeleton}
                            castShadow
                            receiveShadow
                        />
                        <skinnedMesh
                            name="Cylinder_1"
                            geometry={(nodes.Cylinder_1 as Mesh).geometry}
                            material={materials.Brown}
                            skeleton={
                                (nodes.Cylinder_1 as SkinnedMesh).skeleton
                            }
                            castShadow
                            receiveShadow
                        />
                        <skinnedMesh
                            name="Cylinder_2"
                            geometry={(nodes.Cylinder_2 as Mesh).geometry}
                            material={materials.Black}
                            skeleton={
                                (nodes.Cylinder_2 as SkinnedMesh).skeleton
                            }
                            castShadow
                            receiveShadow
                        />
                    </group>
                </group>
            </group>
        </group>
    );
}

useGLTF.preload("/models/Velociraptor.glb");
