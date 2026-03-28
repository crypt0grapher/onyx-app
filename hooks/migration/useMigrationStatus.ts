"use client";

import { useQuery } from "@tanstack/react-query";
import { migrationApiService } from "@/lib/api/services/migration";
import { goliathConfig } from "@/config/goliath";
import type { BridgeStatus } from "@/lib/api/services/bridge";

const TERMINAL_STATUSES: BridgeStatus[] = ["COMPLETED", "FAILED", "EXPIRED"];

export function useMigrationStatus(originTxHash: string | null) {
    const {
        data: migrationStatus,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["migration-status", originTxHash],
        queryFn: () => migrationApiService.getMigrationStatus(originTxHash!),
        enabled: !!originTxHash,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data && TERMINAL_STATUSES.includes(data.status)) return false;
            return goliathConfig.migration.statusPollMs;
        },
    });

    const isTerminal = migrationStatus
        ? TERMINAL_STATUSES.includes(migrationStatus.status)
        : false;

    const shouldPromptStaking =
        isTerminal &&
        migrationStatus?.status === "COMPLETED" &&
        migrationStatus?.stakeOnGoliath === true &&
        !migrationStatus?.stakingTxHash;

    return {
        migrationStatus,
        isPolling: !isTerminal && !!originTxHash,
        shouldPromptStaking,
        isLoading,
        error,
    };
}
