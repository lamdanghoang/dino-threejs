"use client";

import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import clsx from "clsx";
import { Suspense } from "react";

const RenderModel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <Canvas
            shadows
            camera={{ position: [3, 4, 6], fov: 50 }}
            className={clsx("w-screen h-screen -z-10 relative", className)}
        >
            <ambientLight intensity={0.3} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            <Suspense fallback={null}>{children}</Suspense>
            <Environment preset="dawn" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.4} />
            </mesh>
            <OrbitControls target={[0, 0.5, 0]} />
        </Canvas>
    );
};

export default RenderModel;
