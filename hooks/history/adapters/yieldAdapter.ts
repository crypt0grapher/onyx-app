import { formatUnits } from "viem";
import { buildExplorerUrl } from "@/utils/explorer";
import type { UnifiedHistoryItem } from "@/types/history";

// ---------------------------------------------------------------------------
// Source type -- represents a decoded Staked / Unstaked event from the stXCN
// contract on the Goliath chain.
// ---------------------------------------------------------------------------

export interface StXcnEvent {
  type: "Staked" | "Unstaked";
  txHash: string;
  user: string;
  /** xcnAmount for Staked events, stXCNBurned for Unstaked events */
  amount: bigint;
  /** Unix timestamp in seconds */
  timestamp: number;
  blockNumber: bigint;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Convert stXCN stake / unstake event logs into `UnifiedHistoryItem[]`.
 *
 * @param events  Decoded event objects.
 * @param goliathChainId  The chain ID of the Goliath network (used to
 *   build explorer URLs).
 */
export function adaptYieldEvents(
  events: StXcnEvent[],
  goliathChainId: number,
): UnifiedHistoryItem[] {
  return events.map((event) => ({
    id: `${event.txHash}:goliath:${event.type}`,
    network: "goliath" as const,
    source: "stxcn-events" as const,
    type: event.type === "Staked" ? ("stake" as const) : ("unstake" as const),
    status: "confirmed" as const,
    timestamp: event.timestamp,
    txHash: event.txHash,
    from: event.user,
    to: event.user,
    amount: formatUnits(event.amount, 18),
    amountRaw: event.amount.toString(),
    tokenSymbol: event.type === "Staked" ? "XCN" : "stXCN",
    tokenDecimals: 18,
    explorerUrl: buildExplorerUrl(event.txHash, "tx", goliathChainId),
  }));
}
