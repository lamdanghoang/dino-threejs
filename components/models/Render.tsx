"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
    BackgroundEnvironment,
    Ground,
    Lighting,
    MovingBackgroundCubes,
} from "./Background";
import JumpingCube from "./Player";
import { ThirdPersonCamera } from "./ThirdPersonCamera";
import { MovingBackgroundObjects } from "./MovingBackgroundObjects";
import { MovingClouds } from "./MovingCloud";

type GameState = "waiting" | "playing" | "gameOver";

// TypeScript Interfaces
interface CubeData {
    mesh: THREE.Mesh;
    initialPosition: THREE.Vector3;
    speed: number;
    offset: number;
    isColliding: boolean;
    collisionTime: number;
}

interface ScoreDisplayProps {
    score: number;
}

interface GameOverScreenProps {
    isVisible: boolean;
    finalScore: number;
    onRestart: () => void;
}

const JumpingCube3D: React.FC = () => {
    const collisionCubes = useRef<CubeData[]>([]);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const gameStateRef = useRef<GameState>("waiting");

    const handleGameStart = () => {
        setIsGameStarted(true);
        gameStateRef.current = "playing";
        setScore(0);
    };

    const handleScoreUpdate = () => setScore((prev) => prev + 10);

    const handleCollision = (cubeIndex: number) => {
        if (isGameOver || !isGameStarted) return;
        const cube = collisionCubes.current[cubeIndex];
        if (cube && !cube.isColliding) {
            cube.isColliding = true;
            setIsGameOver(true);
            gameStateRef.current = "gameOver";
            collisionCubes.current.forEach((c) => (c.speed = 0)); // 🛑 dừng
        }
    };

    const handleRestart = () => {
        setIsGameOver(false);
        setIsGameStarted(false);
        gameStateRef.current = "waiting";
        setScore(0);

        // ✅ Reset cubes về vị trí gốc
        collisionCubes.current.forEach((cube) => {
            cube.isColliding = false;
            cube.speed = 0.3;
            cube.mesh.position.copy(cube.initialPosition);
            (cube.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(
                0x000000
            );
        });
    };

    // Restart bằng phím/chuột
    useEffect(() => {
        const restartInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
            if (isGameOver) {
                e.preventDefault();
                handleRestart();
            }
        };

        const keyHandler = (e: KeyboardEvent) => {
            if (isGameOver && e.code === "Space") restartInput(e);
        };

        if (isGameOver) {
            window.addEventListener("keydown", keyHandler);
            window.addEventListener("touchstart", restartInput, {
                passive: false,
            });
            window.addEventListener("click", restartInput);
        }
        return () => {
            window.removeEventListener("keydown", keyHandler);
            window.removeEventListener("touchstart", restartInput);
            window.removeEventListener("click", restartInput);
        };
    }, [isGameOver]);

    return (
        <div className="w-full h-screen bg-gradient-to-b from-gray-600 to-gray-500 relative overflow-hidden">
            <ScoreDisplay score={score} />
            <Instructions
                isGameStarted={isGameStarted}
                isGameOver={isGameOver}
            />
            <GameOverScreen
                isVisible={isGameOver}
                finalScore={score}
                onRestart={handleRestart}
            />

            <Canvas
                camera={{ position: [8, 6, 8], fov: 55 }}
                shadows
                className="w-full h-full"
            >
                <Suspense fallback={null}>
                    <Lighting />
                    <Ground />
                    <JumpingCube
                        onCollision={handleCollision}
                        collisionCubes={collisionCubes}
                        isGameOver={isGameOver}
                        isGameStarted={isGameStarted}
                        onGameStart={handleGameStart}
                    />
                    <MovingBackgroundObjects
                        isGameOver={isGameOver}
                        isGameStarted={isGameStarted}
                    />
                    <MovingClouds
                        isGameOver={isGameOver}
                        isGameStarted={isGameStarted}
                    />
                    <MovingBackgroundCubes
                        collisionCubes={collisionCubes}
                        isGameOver={isGameOver}
                        isGameStarted={isGameStarted}
                        onScoreUpdate={handleScoreUpdate}
                    />
                    <BackgroundEnvironment />
                    <ThirdPersonCamera /> {/* không cần props/ref */}
                    {/* <OrbitControls enabled={!isGameOver} /> */}
                    <fog attach="fog" args={["#6b7280", 15, 45]} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default JumpingCube3D;

// Score Display Component
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
    return (
        <div className="absolute top-8 right-8 text-white font-mono z-10">
            <div className="text-3xl md:text-6xl font-bold tracking-wider">
                {score.toString().padStart(5, "0")}
            </div>
        </div>
    );
};

// Instructions Component
const Instructions: React.FC<{
    isGameStarted: boolean;
    isGameOver: boolean;
}> = ({ isGameStarted, isGameOver }) => {
    if (isGameOver || isGameStarted) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white font-mono bg-black/40 backdrop-blur-sm rounded-lg p-8">
                <h1 className="text-4xl font-bold mb-6">3D CUBE JUMP</h1>
                <p className="text-xl mb-4">Avoid the pink cubes!</p>
                <p className="text-lg mb-6">
                    Press{" "}
                    <kbd className="bg-white/20 px-3 py-2 rounded">SPACE</kbd>,
                    <span className="mx-2">touch screen,</span>
                    or <span className="mx-2">click</span> to start
                </p>
                <p className="text-sm opacity-75">
                    Jump to avoid obstacles and score points!
                </p>
            </div>
        </div>
    );
};

// Game Over Screen Component
const GameOverScreen: React.FC<GameOverScreenProps> = ({
    isVisible,
    finalScore,
    onRestart,
}) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="text-center text-white font-mono">
                <h1 className="text-6xl font-bold mb-8 text-red-500">
                    GAME OVER
                </h1>
                <div className="mb-8">
                    <p className="text-2xl mb-2">Final Score</p>
                    <p className="text-4xl font-bold text-yellow-400">
                        {finalScore.toString().padStart(5, "0")}
                    </p>
                </div>
                <button
                    onClick={onRestart}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 border-2 border-green-400 hover:border-green-300"
                >
                    Restart Game
                </button>
                <p className="text-sm mt-4 opacity-75">
                    Press SPACE, touch screen, or click to restart
                </p>
            </div>
        </div>
    );
};
