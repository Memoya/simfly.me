'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export const SpotlightCard = ({
    children,
    className,
    spotlightColor = "rgba(255, 255, 255, 0.2)",
}: SpotlightCardProps) => {
    const divRef = useRef<HTMLDivElement>(null);
    const rectCacheRef = useRef<DOMRect | null>(null);
    const rafRef = useRef<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || isFocused) return;

        // Cancel previous RAF
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }

        // Use cached rect if available, batch updates with RAF
        rafRef.current = requestAnimationFrame(() => {
            const rect = rectCacheRef.current;
            if (rect) {
                setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
        });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
        // Cache rect on enter (no layout thrashing)
        if (divRef.current) {
            rectCacheRef.current = divRef.current.getBoundingClientRect();
        }
    };

    const handleMouseLeave = () => {
        setOpacity(0);
        // Clear RAF queue
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
                "relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8",
                className,
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
};
