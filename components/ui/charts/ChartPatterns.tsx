"use client";

import React from "react";

export type PatternColor = {
    id: string;
    color: string;
};

export type ChartPatternsProps = {
    patterns: PatternColor[];
};

const ChartPatterns: React.FC<ChartPatternsProps> = ({ patterns }) => {
    return (
        <defs>
            {patterns.map(({ id, color }) => (
                <pattern
                    key={id}
                    id={id}
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-30)"
                >
                    <rect width="20" height="20" fill="transparent" />
                    <rect x="-2" y="0" width="24" height="2" fill={color} />
                    <rect x="-2" y="5" width="24" height="2" fill={color} />
                    <rect x="-2" y="10" width="24" height="2" fill={color} />
                    <rect x="-2" y="15" width="24" height="2" fill={color} />
                </pattern>
            ))}
        </defs>
    );
};

export default ChartPatterns;
