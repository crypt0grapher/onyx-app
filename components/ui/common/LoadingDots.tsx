"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingDotsProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    variant?: "inline" | "block";
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
    className = "",
    size = "md",
    variant = "inline",
}) => {
    const sizeConfig = {
        sm: {
            dotSize: "w-1 h-1",
            gap: "gap-0.5",
            minWidth: "min-w-[16px]",
        },
        md: {
            dotSize: "w-1.5 h-1.5",
            gap: "gap-1",
            minWidth: "min-w-[20px]",
        },
        lg: {
            dotSize: "w-2 h-2",
            gap: "gap-1",
            minWidth: "min-w-[24px]",
        },
    };

    const config = sizeConfig[size];

    const isInline = variant === "inline";
    const MotionComponent = isInline ? motion.span : motion.div;
    const DotComponent = isInline ? motion.span : motion.div;

    const baseClasses = isInline
        ? `inline ${config.minWidth}`
        : `flex items-center ${config.gap}`;

    const containerClasses = className
        ? `${baseClasses} ${className}`
        : `${baseClasses} justify-center`;

    const dotClasses = `${config.dotSize} rounded-full ${
        isInline ? "inline-block align-middle" : ""
    }`;

    const animationConfig = {
        backgroundColor: ["#808080", "#FFFFFF", "#808080"],
        scale: [0.8, 1.1, 0.8],
        opacity: [0.6, 1, 0.6],
    };

    return (
        <MotionComponent
            className={containerClasses}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {[0, 1, 2].map((index) => (
                <React.Fragment key={index}>
                    <DotComponent
                        className={dotClasses}
                        initial={{
                            backgroundColor: "#808080",
                            scale: 1,
                            opacity: 0.6,
                        }}
                        animate={animationConfig}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: index * 0.15,
                            backgroundColor: {
                                duration: 1.5,
                                repeat: Infinity,
                                delay: index * 0.15,
                            },
                        }}
                    />
                    {isInline && index < 2 && (
                        <span className="inline-block w-1" />
                    )}
                </React.Fragment>
            ))}
        </MotionComponent>
    );
};

export default LoadingDots;
