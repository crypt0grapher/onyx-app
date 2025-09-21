import { useEffect, useState } from "react";

/**
 * Custom hook for countdown timer
 * @param targetDate - The target date to count down to
 * @returns Formatted countdown string (e.g., "6h : 43m : 24s")
 */
export function useCountdown(targetDate: Date | null): string {
    const [remaining, setRemaining] = useState(
        Math.max(0, (targetDate?.getTime?.() || Date.now()) - Date.now())
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const ms = Math.max(
                0,
                (targetDate?.getTime?.() || Date.now()) - Date.now()
            );
            setRemaining(ms);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${hours}h : ${String(minutes).padStart(2, "0")}m : ${String(
        seconds
    ).padStart(2, "0")}s`;
}
