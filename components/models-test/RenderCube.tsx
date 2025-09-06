"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

// TypeScript Interfaces
interface CubeData {
    mesh: THREE.Mesh;
    initialPosition: THREE.Vector3;
    speed: number;
    offset: number;
    isColliding: boolean;
    collisionTime: number;
}

interface JumpingCubeProps {
    onCollision: (cubeIndex: number) => void;
    collisionCubes: React.RefObject<CubeData[]>;
    isGameOver: boolean;
    isGameStarted: boolean;
    onGameStart: () => void;
}

interface MovingBackgroundCubesProps {
    collisionCubes: React.RefObject<CubeData[]>;
    isGameOver: boolean;
    isGameStarted: boolean;
    onScoreUpdate: () => void;
}

interface ScoreDisplayProps {
    score: number;
}

interface GameOverScreenProps {
    isVisible: boolean;
    finalScore: number;
    onRestart: () => void;
}

// Type definitions
type Position3D = [number, number, number];
type Vector3Like = { x: number; y: number; z: number };
type GameState = "waiting" | "playing" | "gameOver";

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

// Score Display Component
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
    return (
        <div className="absolute top-8 right-8 text-white font-mono">
            <div className="text-6xl font-bold tracking-wider">
                {score.toString().padStart(5, "0")}
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

// Jumping Cube Component with Game State logic
const JumpingCube: React.FC<JumpingCubeProps> = ({
    onCollision,
    collisionCubes,
    isGameOver,
    isGameStarted,
    onGameStart,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [isJumping, setIsJumping] = useState<boolean>(false);
    const [position, setPosition] = useState<Position3D>([0, 0.5, 0]);
    const [jumpStartTime, setJumpStartTime] = useState<number>(0);
    const [isColliding, setIsColliding] = useState<boolean>(false);

    // Hàm nhảy
    const jump = () => {
        if (!isJumping && !isGameOver) {
            setIsJumping(true);
            setJumpStartTime(Date.now());
        }
    };

    // Handle keyboard + touch/click
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (!isGameStarted && !isGameOver) {
                    // Chỉ start game, KHÔNG jump
                    onGameStart();
                } else if (isGameStarted && !isGameOver) {
                    // Đang chơi mới được jump
                    jump();
                }
            }
        };

        const handleTouchOrClick = () => {
            if (!isGameStarted && !isGameOver) {
                onGameStart();
            } else if (isGameStarted && !isGameOver) {
                jump();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("touchstart", handleTouchOrClick, {
            passive: false,
        });
        window.addEventListener("click", handleTouchOrClick);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("touchstart", handleTouchOrClick);
            window.removeEventListener("click", handleTouchOrClick);
        };
    }, [isGameStarted, isGameOver, isJumping, onGameStart]);

    // Animation loop
    useFrame(() => {
        if (!meshRef.current) return;
        if (isGameOver) return;

        if (isJumping) {
            const elapsed = (Date.now() - jumpStartTime) / 1000;
            const jumpDuration = 0.8;
            const jumpHeight = 3;

            if (elapsed < jumpDuration) {
                const t = elapsed / jumpDuration;
                const y = 0.5 + jumpHeight * (4 * t * (1 - t));
                setPosition([0, y, 0]);
                meshRef.current.rotation.x = t * Math.PI * 2;
                meshRef.current.rotation.z = t * Math.PI * 0.5;
            } else {
                setPosition([0, 0.5, 0]);
                setIsJumping(false);
                meshRef.current.rotation.set(0, 0, 0);
            }
        }

        // Collision detection
        if (isGameStarted && !isGameOver) {
            let hasCollision = false;
            collisionCubes.current.forEach((cube, index) => {
                if (cube && cube.mesh && meshRef.current) {
                    const cubeWorldPos = new THREE.Vector3();
                    cube.mesh.getWorldPosition(cubeWorldPos);
                    const playerWorldPos = new THREE.Vector3();
                    meshRef.current.getWorldPosition(playerWorldPos);

                    if (detectCollision(playerWorldPos, cubeWorldPos)) {
                        hasCollision = true;
                        onCollision(index);
                    }
                }
            });
            setIsColliding(hasCollision);
        }
    });

    return (
        <mesh ref={meshRef} position={position} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={isColliding ? "#ef4444" : "#4ade80"}
                roughness={0.3}
                metalness={0.1}
                emissive={isColliding ? "#ff0000" : "#000000"}
                emissiveIntensity={isColliding ? 0.3 : 0}
            />
        </mesh>
    );
};

// Ground Component
const Ground: React.FC = () => {
    return (
        <>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <Grid
                args={[20, 20]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#d1d5db"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#9ca3af"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={false}
            />
        </>
    );
};

// Lighting Setup
const Lighting: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />
            <pointLight position={[-5, 5, -5]} intensity={0.3} />
        </>
    );
};

// Moving Background Cubes Component with score system
const MovingBackgroundCubes: React.FC<MovingBackgroundCubesProps> = ({
    collisionCubes,
    isGameOver,
    isGameStarted,
    onScoreUpdate,
}) => {
    const cubesRef = useRef<THREE.Group>(null);
    const passedCubesRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!cubesRef.current) return;

        collisionCubes.current = [];
        passedCubesRef.current.clear();
        while (cubesRef.current.children.length > 0) {
            cubesRef.current.remove(cubesRef.current.children[0]);
        }

        const numCubes = 8;
        const spacing = 8;
        const startDistance = 50;

        for (let i = 0; i < numCubes; i++) {
            const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const material = new THREE.MeshStandardMaterial({
                color: "#f472b6",
            });
            const mesh = new THREE.Mesh(geometry, material);

            const x = startDistance + i * spacing;
            const y = 0.5;
            const z = 0;

            mesh.position.set(x, y, z);
            cubesRef.current.add(mesh);

            collisionCubes.current.push({
                mesh,
                initialPosition: new THREE.Vector3(x, y, z), // ✅ lưu vị trí gốc
                speed: 0.3,
                offset: i * spacing,
                isColliding: false,
                collisionTime: 0,
            });
        }
    }, [collisionCubes]);

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
                cube.mesh.position.x = maxX + 8;
                cube.isColliding = false;
                passedCubesRef.current.delete(index);
            }
        });
    });

    return <group ref={cubesRef} />;
};

// Background Environment
export const BackgroundEnvironment: React.FC = () => {
    return (
        <>
            {/* Sky gradient background */}
            <mesh scale={[100, 100, 100]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color="#6b7280"
                    side={THREE.BackSide}
                    fog={false}
                />
            </mesh>

            {/* Background hills */}
            {Array.from({ length: 12 }, (_, i: number) => {
                const angle: number = (i / 12) * Math.PI * 2;
                const distance: number = 25 + Math.random() * 10;
                const x: number = Math.cos(angle) * distance;
                const z: number = Math.sin(angle) * distance;
                const height: number = 3 + Math.random() * 8;

                return (
                    <mesh
                        key={i}
                        position={[x, height / 2, z]}
                        scale={[
                            2 + Math.random() * 3,
                            height,
                            2 + Math.random() * 3,
                        ]}
                    >
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial
                            color="#4b5563"
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                );
            })}
        </>
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

// Main Component with full game state management
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
                camera={{ position: [8, 6, 8], fov: 50 }}
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
                    <MovingBackgroundCubes
                        collisionCubes={collisionCubes}
                        isGameOver={isGameOver}
                        isGameStarted={isGameStarted}
                        onScoreUpdate={handleScoreUpdate}
                    />
                    <OrbitControls enabled={!isGameOver} />
                    <fog attach="fog" args={["#6b7280", 15, 45]} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default JumpingCube3D;
