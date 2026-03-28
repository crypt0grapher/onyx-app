"use client";

import React from "react";
import { useHasFeature, type NetworkFeature } from "@/config/features";

interface NetworkGateProps {
    feature: NetworkFeature;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Conditionally renders children only when the connected chain supports the
 * given feature. Renders the optional fallback otherwise.
 */
const NetworkGate: React.FC<NetworkGateProps> = ({
    feature,
    fallback = null,
    children,
}) => {
    const hasIt = useHasFeature(feature);
    return hasIt ? <>{children}</> : <>{fallback}</>;
};

export default NetworkGate;
