"use client";

import { useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Mesh, SkinnedMesh } from "three";
import { ThreeElements, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type DinosaurProps = ThreeElements["group"] & {
    jumpForce?: number;
    gravity?: number;
    onStart?: () => void;
};

export default function Dinosaur({
    jumpForce = 20,
    gravity = -75,
    onStart,
    ...props
}: DinosaurProps) {
    const ref = useRef<Group>(null);
    const { nodes, materials, animations } = useGLTF(
        "/models/Velociraptor.glb"
    );
    const { actions } = useAnimations(animations, ref);

    const [started, setStarted] = useState(false);

    // Physics state
    const velocity = useRef(0);
    const positionY = useRef(0);
    const isJumping = useRef(false);

    // Idle default
    useEffect(() => {
        actions["Armature|Velociraptor_Idle"]?.reset().fadeIn(0.5).play();
    }, [actions]);

    // Start game → Run
    useEffect(() => {
        if (started) {
            actions["Armature|Velociraptor_Idle"]?.fadeOut(0.3);
            actions["Armature|Velociraptor_Run"]?.reset().fadeIn(0.3).play();
        }
    }, [started, actions]);

    const handleJump = () => {
        if (positionY.current === 0 && !isJumping.current) {
            velocity.current = jumpForce;
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

    useEffect(() => {
        const handleTouch = () => {
            if (!started) {
                setStarted(true);
                onStart?.();
            } else {
                handleJump();
            }
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                if (!started) {
                    setStarted(true);
                    onStart?.();
                } else {
                    handleJump();
                }
            }
        };

        window.addEventListener("touchstart", handleTouch);
        window.addEventListener("keydown", handleKey);

        return () => {
            window.removeEventListener("touchstart", handleTouch);
            window.removeEventListener("keydown", handleKey);
        };
    }, [started, actions]);

    // Physics update
    useFrame((_, delta) => {
        if (!ref.current) return;

        // gravity
        const acceleration = gravity * delta;

        // update y
        positionY.current += delta * (velocity.current + acceleration * 0.5);
        positionY.current = Math.max(positionY.current, 0.0);

        // update velocity
        velocity.current += acceleration;
        velocity.current = Math.max(velocity.current, -100);

        // apply to model
        ref.current.position.y = positionY.current;

        // Khi gần chạm đất thì chuyển lại Run (blend sớm để mượt)
        if (isJumping.current && positionY.current <= 0.05) {
            const runAction = actions["Armature|Velociraptor_Run"];
            const jumpAction = actions["Armature|Velociraptor_Jump"];
            if (runAction && jumpAction) {
                jumpAction.fadeOut(0.1);
                runAction.reset().fadeIn(0.2).play();
            }
            isJumping.current = false;
        }
    });

    return (
        <group ref={ref} {...props} dispose={null} scale={0.001}>
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
                        />
                        <skinnedMesh
                            name="Cylinder_1"
                            geometry={(nodes.Cylinder_1 as Mesh).geometry}
                            material={materials.Brown}
                            skeleton={
                                (nodes.Cylinder_1 as SkinnedMesh).skeleton
                            }
                        />
                        <skinnedMesh
                            name="Cylinder_2"
                            geometry={(nodes.Cylinder_2 as Mesh).geometry}
                            material={materials.Black}
                            skeleton={
                                (nodes.Cylinder_2 as SkinnedMesh).skeleton
                            }
                        />
                    </group>
                </group>
            </group>
        </group>
    );
}

useGLTF.preload("/models/Velociraptor.glb");
