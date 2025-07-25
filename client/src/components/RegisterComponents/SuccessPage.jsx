import React, { useState, useRef, useEffect } from "react";
import { verifyGTID } from "../../js/verifications";
import { useNavigate } from "react-router-dom";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LiquidShader = () => {
    const meshRef = useRef();
    const clock = new THREE.Clock();

    useFrame(() => {
        const time = clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value = time;
        }
    });

    useEffect(() => {
        const handleResize = () => {
            if (meshRef.current) {
                const aspect = window.innerWidth / window.innerHeight;
                const scaleX = aspect > 1 ? aspect : 1;
                const scaleY = aspect > 1 ? 1 : 1 / aspect;

                // Scale the plane to ensure no whitespace
                meshRef.current.scale.set(scaleX * 3, scaleY * 3, 1);

                // Update resolution uniform
                meshRef.current.material.uniforms.uResolution.value.set(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        };

        handleResize(); // Initial resize
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[1, 1, 64, 64]} />
            <shaderMaterial
                uniforms={{
                    uTime: { value: 0 },
                    uResolution: {
                        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
                    },
                    uColors: {
                        value: [
                            new THREE.Color("#0033A0"), // Blue (AKPsi)
                            new THREE.Color("#002D72"), // Darker Blue for depth
                            new THREE.Color("#FFD700"), // Gold (AKPsi)
                            new THREE.Color("#8A2BE2"), // Soft Purple (subtle secondary)
                            new THREE.Color("#00A6A6"), // Teal (subtle secondary)
                        ],
                    },
                }}
                vertexShader={`
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vUv = uv;
                        vec3 transformed = position;

                        // Add randomness to the waves
                        transformed.z += sin(uv.x * 2.0 + uTime * 1.5) * 0.2;
                        transformed.z += cos(uv.y * 2.0 + uTime * 1.0) * 0.2;
                        transformed.z += sin(uv.x * 2.0 + uTime * 0.5) * 0.1;

                        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 uColors[5]; // Array of colors (blue dominant)
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        // Blend between blue and gold with blue dominance
                        vec3 color = mix(uColors[0], uColors[1], sin(vUv.y * 4.0 + uTime * 0.2) * 0.7 + 0.5); // Blue shades
                        color = mix(color, uColors[2], cos(vUv.x * 6.0 + uTime * 0.3) * 0.4 + 0.2); // Gold less frequent
                        color = mix(color, uColors[3], sin(vUv.y * 10.0 + uTime * 0.7) * 0.2 + 0.1); // Subtle purple
                        color = mix(color, uColors[4], cos(vUv.x * 12.0 + uTime * 0.9) * 0.2 + 0.1); // Subtle teal

                        gl_FragColor = vec4(color, 1.0);
                    }
                `}
                side={THREE.DoubleSide}
                transparent={true}
            />
        </mesh>
    );
};

export default function SuccessPage({ title, description, link, gtid }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://www.gtakpsi-rush.com/rushee/${gtid}/${link}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
        });
    };

    return (

        <div className="relative w-full h-screen overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-800 via-yellow-500 to-blue-800 z-0"></div>

            {/* Fullscreen Canvas */}
            <Canvas
                camera={{
                    position: [0, 0, 1], // Adjusted camera for fullscreen plane
                }}
                className="absolute top-0 left-0 w-full h-full z-10"
            >
                <LiquidShader />
            </Canvas>

            {/* Content Overlay */}
            <div className="absolute text-center inset-0 flex flex-col items-center justify-center z-20">
                <h1 className="text-3xl font-bold text-white mt-6 text-center">{title}</h1>

                {/* Description */}
                <p className="text-lg text-white mt-3 text-center max-w-xl">{description}</p>

                {/* Link Box with Copy Button */}
                <div className="mt-8 w-full max-w-md p-4 bg-white shadow-lg rounded-lg border-2 border-gray-300">
                    {/* Display the Link */}
                    <div className="mb-4">
                        <a className="text-slate-800 font-medium break-all">{`https://www.gtakpsi-rush.com/rushee/${gtid}/${link}`}</a>
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="w-full bg-gradient-to-r from-sky-700 to-amber-600 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>
        </div>


    );
}