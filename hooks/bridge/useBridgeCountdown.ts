"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Converts an `estimatedCompletionTime` ISO 8601 timestamp into a
 * live-ticking countdown.
 *
 * The countdown re-syncs whenever the backend provides a new ETA
 * (typically every poll cycle from `useBridgeStatusPoller`).  When the
 * ETA is in the past or the countdown reaches zero, `isOverdue` flips
 * to `true` so the UI can show a "finishing up" state.
 *
 * @param estimatedCompletionTime - ISO 8601 string from the bridge API, or null
 * @returns `remainingSeconds` (always >= 0) and `isOverdue` flag
 */
export function useBridgeCountdown(
    estimatedCompletionTime: string | null
): { remainingSeconds: number; isOverdue: boolean } {
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isOverdue, setIsOverdue] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Clear any existing interval when the ETA changes or becomes null
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!estimatedCompletionTime) {
            setRemainingSeconds(0);
            setIsOverdue(false);
            return;
        }

        const etaMs = new Date(estimatedCompletionTime).getTime();

        const computeRemaining = (): number =>
            Math.max(0, Math.floor((etaMs - Date.now()) / 1000));

        // Sync immediately from the new ETA
        const initial = computeRemaining();
        setRemainingSeconds(initial);
        setIsOverdue(initial === 0);

        // If already overdue, no need to tick
        if (initial === 0) return;

        intervalRef.current = setInterval(() => {
            const seconds = computeRemaining();
            setRemainingSeconds(seconds);
            if (seconds === 0) {
                setIsOverdue(true);
                if (intervalRef.current !== null) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }, 1000);

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [estimatedCompletionTime]);

    return { remainingSeconds, isOverdue };
}
