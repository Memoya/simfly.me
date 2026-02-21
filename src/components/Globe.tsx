'use client';

import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function Globe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        // Optimize for performance based on device
        const isMobile = window.innerWidth < 768;
        const devicePixelRatio = isMobile ? 1 : 1.5;
        const mapSamples = isMobile ? 6000 : 10000;
        const canvasSize = isMobile ? 400 : 600;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio,
            width: canvasSize * devicePixelRatio,
            height: canvasSize * devicePixelRatio,
            phi: 0,
            theta: 0,
            dark: 0, // 0 = Light Mode (white/gray), 1 = Dark Mode
            diffuse: 1.2,
            mapSamples,
            mapBrightness: 6,
            baseColor: [1, 1, 1], // White
            markerColor: [0, 0, 0], // Black markers
            glowColor: [0.9, 0.9, 0.9],
            markers: [
                { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
                { location: [40.7128, -74.006], size: 0.03 }, // New York
                { location: [52.5200, 13.4050], size: 0.03 }, // Berlin
                { location: [35.6762, 139.6503], size: 0.03 }, // Tokyo
                { location: [1.3521, 103.8198], size: 0.03 }, // Singapore
                { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
                { location: [25.2048, 55.2708], size: 0.03 }, // Dubai
                { location: [48.8566, 2.3522], size: 0.03 }, // Paris
                { location: [51.5074, -0.1278], size: 0.03 }, // London
            ],
            onRender: (state) => {
                // Called on every animation frame.
                // `state` will be an empty object, return updated params.
                state.phi = phi;
                phi += 0.003;
            },
        });

        return () => {
            globe.destroy();
        };
    }, []);

    return (
        <div className="w-full flex justify-center items-center" style={{ aspectRatio: '1 / 1', maxHeight: '600px' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', maxWidth: '600px' }}
            />
        </div>
    );
}
