'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    shimmerColor?: string;
    shimmerSize?: string;
    shimmerDuration?: string;
    borderRadius?: string;
}

export const ShinyButton = ({
    children,
    className,
    shimmerColor = "#ffffff",
    shimmerSize = "0.05em",
    shimmerDuration = "3s",
    borderRadius = "2rem",
    ...props
}: ShinyButtonProps) => {
    return (
        <button
            style={
                {
                    "--shimmer-color": shimmerColor,
                    "--radius": borderRadius,
                    "--speed": shimmerDuration,
                    "--cut": shimmerSize,
                } as React.CSSProperties
            }
            className={cn(
                "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden border border-white/10 px-6 py-2 text-white bg-black [border-radius:var(--radius)]",
                className,
            )}
            {...props}
        >
            {/* spark container */}
            <div
                className={cn(
                    "-z-10 h-full w-full",
                    "absolute inset-0 [mask-image:linear-gradient(#fff,#fff)]",
                )}
            >
                {/* spark */}
                <div
                    className={cn(
                        "absolute inset-0 h-[100%] w-[100%] [background:rotate(0deg)] [background:conic-gradient(from_calc(270deg-(var(--speed)*0.5)),transparent_0,var(--shimmer-color)_0.1,transparent_0.15)] [mask:conic-gradient(from_0deg,transparent_0,transparent_0.15,#fff_0.15)]",
                        "animate-shimmer-btn",
                    )}
                />
            </div>

            <div className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </div>

            {/* backdrop */}
            <div
                className={cn(
                    "absolute inset-[1px] -z-20 bg-black [border-radius:calc(var(--radius)-1px)]",
                )}
            />
        </button>
    );
};
