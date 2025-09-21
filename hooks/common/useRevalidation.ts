"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type PollingOptions = {
    withPolling?: boolean;
    durationMs?: number;
    intervalMs?: number;
};

const DEFAULT_DURATION_MS = 60_000;
const DEFAULT_INTERVAL_MS = 10_000;

export const useRevalidation = () => {
    const queryClient = useQueryClient();
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

    const invalidateStakingOnce = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["staking-history"] });
        queryClient.invalidateQueries({ queryKey: ["user-staking-graph"] });
        queryClient.invalidateQueries({ queryKey: ["history"] });
    }, [queryClient]);

    const invalidateFarmsOnce = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["user-farm-graph"] });
        queryClient.invalidateQueries({ queryKey: ["onyx-prices"] });
        queryClient.invalidateQueries({ queryKey: ["farms-data"] });
    }, [queryClient]);

    const clearPolling = useCallback(() => {
        if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
        }
    }, []);

    const startPolling = useCallback(
        (
            invalidate: () => void,
            { durationMs, intervalMs }: Required<PollingOptions>
        ) => {
            clearPolling();
            invalidate();
            pollingTimerRef.current = setInterval(() => {
                invalidate();
            }, intervalMs);
            stopTimerRef.current = setTimeout(() => {
                clearPolling();
            }, durationMs);
        },
        [clearPolling]
    );

    const afterStakingTransaction = useCallback(
        (options?: PollingOptions) => {
            const withPolling = options?.withPolling ?? true;
            const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
            const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;

            if (withPolling) {
                startPolling(invalidateStakingOnce, {
                    withPolling,
                    durationMs,
                    intervalMs,
                });
            } else {
                invalidateStakingOnce();
            }
        },
        [invalidateStakingOnce, startPolling]
    );

    const afterFarmTransaction = useCallback(
        (options?: PollingOptions) => {
            const withPolling = options?.withPolling ?? true;
            const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
            const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;

            if (withPolling) {
                startPolling(invalidateFarmsOnce, {
                    withPolling,
                    durationMs,
                    intervalMs,
                });
            } else {
                invalidateFarmsOnce();
            }
        },
        [invalidateFarmsOnce, startPolling]
    );

    useEffect(() => clearPolling, [clearPolling]);

    return {
        revalidateStakingNow: invalidateStakingOnce,
        revalidateFarmsNow: invalidateFarmsOnce,
        afterStakingTransaction,
        afterFarmTransaction,
        stopRevalidationPolling: clearPolling,
    };
};

export default useRevalidation;
