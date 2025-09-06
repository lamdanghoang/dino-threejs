"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import JumpingCube3D from "@/components/models/Render";

export default function Home() {
    const { setFrameReady, isFrameReady } = useMiniKit();

    useEffect(() => {
        if (!isFrameReady) setFrameReady();
    }, [isFrameReady, setFrameReady]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between relative">
            {/* <div className="w-full h-screen">
                <RenderModel>
                    <Dinosaur
                        scale={0.01}
                        position={[0, -0.5, 0]}
                        rotation={[0, Math.PI, 0]}
                        onStart={() => setStarted(true)}
                    />

                    <Background started={started} direction={-1} />
                </RenderModel>
            </div> */}

            <JumpingCube3D />
        </main>
    );
}
