import { buildExplorerUrl } from "@/utils/explorer";
import type {
  UnifiedHistoryItem,
  HistoryStatus,
  HistoryNetwork,
} from "@/types/history";

// ---------------------------------------------------------------------------
// Source types -- defined inline because the migration API service has not
// been created yet.  Once it ships, swap these for real imports.
// ---------------------------------------------------------------------------

export type MigrationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface MigrationTimestamps {
  initiatedAt: string | null;
  completedAt: string | null;
}

export interface MigrationStatusResponse {
  operationId: string;
  status: MigrationStatus;
  originChainId: number;
  destinationChainId: number;
  originTxHash: string | null;
  destinationTxHash: string | null;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  amountFormatted: string;
  timestamps: MigrationTimestamps;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapMigrationStatus(status: MigrationStatus): HistoryStatus {
  if (status === "COMPLETED") return "confirmed";
  if (status === "FAILED") return "failed";
  return "pending";
}

function resolveNetwork(chainId: number): HistoryNetwork {
  if (chainId === 1 || chainId === 11155111) return "ethereum";
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
    const initiatedTimestamp = item.timestamps.initiatedAt
      ? Math.floor(new Date(item.timestamps.initiatedAt).getTime() / 1000)
      : 0;

    return {
      id: item.operationId,
      network: resolveNetwork(item.originChainId),
      source: "migration-api" as const,
      type: "migrate" as const,
      status: mapMigrationStatus(item.status),
      timestamp: initiatedTimestamp,
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
