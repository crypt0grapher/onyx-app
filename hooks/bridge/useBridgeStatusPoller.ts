"use client";

import { useQuery } from "@tanstack/react-query";
import { bridgeApiService } from "@/lib/api/services/bridge";
import type { BridgeStatus, BridgeStatusResponse } from "@/lib/api/services/bridge";
import { goliathConfig } from "@/config/goliath";

const TERMINAL_STATUSES: readonly BridgeStatus[] = [
    "COMPLETED",
    "FAILED",
    "EXPIRED",
];

/**
 * Polls the bridge relayer for the status of a given origin transaction.
 *
 * Polling automatically stops once the operation reaches a terminal
 * status (COMPLETED, FAILED, EXPIRED).  The interval is controlled by
 * `goliathConfig.bridge.statusPollInterval` (default 5 000 ms).
 *
 * Transient errors (network failures, 400/500 from relayer) are silently
 * retried — the poller keeps running even when individual requests fail.
 */
export function useBridgeStatusPoller(originTxHash: string | null) {
    const {
        data: status,
        isLoading,
        error,
    } = useQuery<BridgeStatusResponse | null>({
        queryKey: ["bridge-status", originTxHash],
        queryFn: () =>
            bridgeApiService.getStatus({
                originTxHash: originTxHash!,
            }),
        enabled: !!originTxHash,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data && TERMINAL_STATUSES.includes(data.status)) {
                return false;
            }
            return goliathConfig.bridge.statusPollInterval;
        },
        // Keep polling even when individual requests fail
        retry: 2,
        retryDelay: 2000,
        // Don't throw on error — return stale data and keep polling
        refetchOnWindowFocus: false,
    });

    const isTerminal = status
        ? TERMINAL_STATUSES.includes(status.status)
        : false;

    const isPolling =
        !!originTxHash &&
        (!status || !TERMINAL_STATUSES.includes(status.status));

    return {
        status,
        isLoading,
        isPolling,
        isTerminal,
        error,
    } as const;
}
