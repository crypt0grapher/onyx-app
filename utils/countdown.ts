export type BridgeDirection = "SOURCE_TO_GOLIATH" | "GOLIATH_TO_SOURCE";

/**
 * Format remaining seconds into a human-readable countdown string.
 * @param remainingSeconds - Seconds remaining until completion
 * @param finishingUpText - Translated text to show when countdown reaches zero
 * @returns Formatted countdown (e.g., "~4m 10s", "~30s") or finishingUpText
 */
export const formatCountdown = (
    remainingSeconds: number,
    finishingUpText: string
): string => {
    if (remainingSeconds <= 0) return finishingUpText;

    if (remainingSeconds > 60) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        return `~${minutes}m ${seconds}s`;
    }

    return `~${Math.floor(remainingSeconds)}s`;
};

/**
 * Get the estimated bridge duration in seconds for a given direction.
 * These match the backend's `etaCalculator.ts` values, rounded to clean
 * minute boundaries for user-facing display.
 * @param direction - The bridge transfer direction
 * @returns Estimated duration in seconds
 */
export const getDirectionEstimateSeconds = (
    direction: BridgeDirection
): number => {
    return direction === "SOURCE_TO_GOLIATH" ? 120 : 60;
};
