import { useEffect, useState } from "react";

/**
 * Custom hook for countdown timer
 * @param targetDate - The target date to count down to
 * @returns Formatted countdown string (e.g., "6h : 43m : 24s")
 */
export function useCountdown(targetDate: Date | null): string {
    const [remaining, setRemaining] = useState<number | null>(() => {
        if (!targetDate) return null;
        return Math.max(0, targetDate.getTime() - Date.now());
    });

    useEffect(() => {
        if (!targetDate) {
            setRemaining(null);
            return;
        }

        const updateRemaining = () => {
            const ms = Math.max(0, targetDate.getTime() - Date.now());
            setRemaining(ms);
        };

        updateRemaining();

        const interval = setInterval(updateRemaining, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (remaining === null) return "";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${hours}h : ${String(minutes).padStart(2, "0")}m : ${String(
        seconds
    ).padStart(2, "0")}s`;
}
