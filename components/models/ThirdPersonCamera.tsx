"use client";

import { useThree } from "@react-three/fiber";
import React, { useEffect } from "react";

export const ThirdPersonCamera: React.FC = () => {
    const { camera, size } = useThree();

    useEffect(() => {
        if (size.width < 600) {
            // 📱 Mobile: đưa camera gần hơn, thấp hơn
            camera.position.set(-9, 3.5, 3.5);
            camera.rotation.set(-0.349, -1.221, -0.349);
        } else if (size.width < 1000) {
            camera.position.set(-4, 4, 10);
            camera.rotation.set(-0.262, -0.611, -0.174);
        } else {
            camera.position.set(0, 5, 10); // dịch camera sang phải
            camera.rotation.set(-0.262, -0.262, -0.087);
        }
    }, [camera, size.width]);

    return null;
};
