import { buildExplorerUrl } from "@/utils/explorer";
import type { UnifiedHistoryItem, HistoryType } from "@/types/history";
import type { HistoryItem } from "@/lib/api/services/subgraph";
import { HistoryItemType } from "@/lib/api/services/subgraph";

/**
 * Map a subgraph `HistoryItemType` (or raw string) to the unified `HistoryType`.
 *
 * The subgraph enum uses values like "stake", "supply", "withdraw", etc.
 * We normalise them into the canonical set defined in `types/history.ts`.
 */
function mapSubgraphType(type: HistoryItemType | string): HistoryType {
  switch (type) {
    case HistoryItemType.STAKE:
      return "stake";
    case HistoryItemType.SUPPLY:
      return "supply";
    case HistoryItemType.TRANSFER:
      return "transfer";
    case HistoryItemType.WITHDRAW:
      return "unstake";
    case HistoryItemType.CLAIM:
      return "claim";
    case HistoryItemType.PROPOSE:
      return "propose";
    case HistoryItemType.VOTE:
      return "vote";
    case HistoryItemType.APPROVAL:
      return "approve";
    case HistoryItemType.REDEEM:
      return "redeem";
    case HistoryItemType.BORROW:
      return "borrow";
    case HistoryItemType.REPAY_BORROW:
      return "repay";
    case HistoryItemType.LIQUIDATE_BORROW:
      return "liquidate";
    // reservesAdded / reservesReduced have no direct unified equivalent;
    // fall through to a safe default.
    default:
      return "transfer";
  }
}

/**
 * Convert an array of subgraph `HistoryItem` records into `UnifiedHistoryItem[]`.
 *
 * The subgraph only indexes confirmed (mined) transactions on Ethereum mainnet,
 * so `status` is always `"confirmed"` and `network` is always `"ethereum"`.
 */
export function adaptSubgraphItems(
  items: HistoryItem[],
): UnifiedHistoryItem[] {
  return items.map((item) => ({
    id: `${item.transactionHash}:ethereum`,
    network: "ethereum" as const,
    source: "subgraph" as const,
    type: mapSubgraphType(item.type),
    status: "confirmed" as const,
    timestamp: Number(item.blockTimestamp),
    txHash: item.transactionHash,
    from: item.from,
    to: item.to,
    amount: item.amount,
    amountRaw: item.amount,
    tokenSymbol: "XCN",
    tokenDecimals: 18,
    explorerUrl: buildExplorerUrl(item.transactionHash, "tx", 1),
  }));
}
