import { buildExplorerUrl } from "@/utils/explorer";
import type {
  UnifiedHistoryItem,
  HistoryStatus,
  HistoryNetwork,
} from "@/types/history";

// ---------------------------------------------------------------------------
// Source types -- defined inline because the bridge API service has not been
// created yet.  Once `lib/api/services/bridge.ts` ships, these should be
// replaced with imports from that module.
// ---------------------------------------------------------------------------

export type BridgeStatus =
  | "PENDING"
  | "DEPOSITED"
  | "RELAYED"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface BridgeTimestamps {
  depositedAt: string | null;
  relayedAt: string | null;
  completedAt: string | null;
}

export interface BridgeStatusResponse {
  operationId: string;
  status: BridgeStatus;
  originChainId: number;
  destinationChainId: number;
  originTxHash: string | null;
  destinationTxHash: string | null;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  amountFormatted: string;
  direction: string;
  timestamps: BridgeTimestamps;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapBridgeStatus(status: BridgeStatus): HistoryStatus {
  if (status === "COMPLETED") return "confirmed";
  if (status === "FAILED" || status === "EXPIRED") return "failed";
  return "pending";
}

function resolveNetwork(chainId: number): HistoryNetwork {
  if (chainId === 1 || chainId === 11155111) return "ethereum";
  if (chainId === 80888) return "onyx";
  return "goliath";
}

function resolveTokenDecimals(symbol: string): number {
  // USDC uses 6 decimals; everything else defaults to 18.
  return symbol.toUpperCase() === "USDC" ? 6 : 18;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Convert bridge status API responses into `UnifiedHistoryItem[]`.
 */
export function adaptBridgeItems(
  items: BridgeStatusResponse[],
): UnifiedHistoryItem[] {
  return items.map((item) => {
    const depositTimestamp = item.timestamps.depositedAt
      ? Math.floor(new Date(item.timestamps.depositedAt).getTime() / 1000)
      : 0;

    return {
      id: item.operationId,
      network: resolveNetwork(item.originChainId),
      source: "bridge-api" as const,
      type: "bridge" as const,
      status: mapBridgeStatus(item.status),
      timestamp: depositTimestamp,
      txHash: item.originTxHash,
      from: item.sender,
      to: item.recipient,
      amount: item.amountFormatted,
      amountRaw: item.amount,
      tokenSymbol: item.token,
      tokenDecimals: resolveTokenDecimals(item.token),
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
      bridgeDirection: item.direction,
    };
  });
}
