"use client";

import React from "react";
import { motion } from "framer-motion";

type SkeletonProps = {
    className?: string;
    rounded?: string;
    width?: string | number;
    height?: string | number;
};

const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    rounded = "rounded",
    width,
    height,
}) => {
    const style: React.CSSProperties = {};
    if (typeof width === "number") style.width = `${width}px`;
    if (typeof height === "number") style.height = `${height}px`;
    if (typeof width === "string") style.width = width;
    if (typeof height === "string") style.height = height;

    return (
        <motion.div
            className={`${rounded} bg-[#1F1F1F] ${className}`}
            style={style}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
        />
    );
};

export default Skeleton;
