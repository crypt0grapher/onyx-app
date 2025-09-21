"use client";

import React from "react";
import { motion } from "framer-motion";

export type SpinnerProps = {
  size?: number;
  thickness?: number;
  className?: string;
  ariaLabel?: string;
  trackColor?: string;
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 140,
  thickness = 4,
  className = "",
  ariaLabel = "Loading",
  trackColor = "#0F0F0F",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, #E6E6E6 90deg, transparent 360deg)`,
            borderRadius: "50%",
            padding: thickness,
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              border: `${thickness}px solid transparent`,
              backgroundColor: trackColor,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Spinner;
