import { buildExplorerUrl } from "@/utils/explorer";
import type {
  UnifiedHistoryItem,
  HistoryStatus,
  HistoryNetwork,
} from "@/types/history";
import type { MigrationStatusResponse } from "@/lib/api/services/migration";

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapMigrationStatus(status: MigrationStatusResponse["status"]): HistoryStatus {
  if (status === "COMPLETED") return "confirmed";
  if (status === "FAILED") return "failed";
  return "pending";
}

export function resolveNetwork(chainId: number): HistoryNetwork {
  if (chainId === 1) return "ethereum";
  if (chainId === 80888) return "onyx";
  return "goliath";
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Convert migration status API responses into `UnifiedHistoryItem[]`.
 */
export function adaptMigrationItems(
  items: MigrationStatusResponse[],
): UnifiedHistoryItem[] {
  return items.map((item) => {
    const depositedTimestamp = item.timestamps.depositedAt
      ? Math.floor(new Date(item.timestamps.depositedAt).getTime() / 1000)
      : 0;

    return {
      id: item.operationId,
      network: resolveNetwork(item.originChainId),
      source: "migration-api" as const,
      type: "migrate" as const,
      status: mapMigrationStatus(item.status),
      timestamp: depositedTimestamp,
      txHash: item.originTxHash,
      from: item.sender,
      to: item.recipient,
      amount: item.amountFormatted,
      amountRaw: item.amount,
      tokenSymbol: item.token,
      tokenDecimals: 18,
      explorerUrl: item.originTxHash
        ? buildExplorerUrl(item.originTxHash, "tx", item.originChainId)
        : "",
      destinationTxHash: item.destinationTxHash ?? undefined,
      destinationExplorerUrl: item.destinationTxHash
        ? buildExplorerUrl(
            item.destinationTxHash,
            "tx",
            item.destinationChainId,
          )
        : undefined,
    };
  });
}
