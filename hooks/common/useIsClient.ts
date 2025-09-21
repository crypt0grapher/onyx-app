"use client";

import { useEffect, useState } from "react";

/**
 * useIsClient returns true only after the component mounted on the client.
 * This prevents SSR hydration mismatch and wagmi pre-hydration flicker.
 */
export const useIsClient = (): boolean => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

export default useIsClient;
