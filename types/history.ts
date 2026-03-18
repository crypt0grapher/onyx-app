export type HistoryNetwork = "ethereum" | "onyx" | "goliath";

export type HistorySource =
  | "subgraph"
  | "bridge-api"
  | "stxcn-events"
  | "migration-api"
  | "local-swap";

export type HistoryType =
  | "stake"
  | "unstake"
  | "swap"
  | "bridge"
  | "migrate"
  | "approve"
  | "claim"
  | "transfer"
  | "propose"
  | "vote"
  | "supply"
  | "borrow"
  | "repay"
  | "liquidate"
  | "redeem";

export type HistoryStatus = "confirmed" | "pending" | "failed";

export interface UnifiedHistoryItem {
  /** Unique ID (txHash:network or operationId) */
  id: string;
  network: HistoryNetwork;
  source: HistorySource;
  type: HistoryType;
  status: HistoryStatus;
  /** Unix timestamp in seconds */
  timestamp: number;
  txHash: string | null;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Human-readable formatted amount */
  amount: string;
  /** Wei / atomic unit amount */
  amountRaw: string;
  tokenSymbol: string;
  tokenDecimals: number;
  /** Pre-computed explorer link */
  explorerUrl: string;
  /** Destination chain tx hash (bridge / migrate) */
  destinationTxHash?: string;
  /** Pre-computed explorer link for the destination tx */
  destinationExplorerUrl?: string;
  /** Direction label for bridge operations */
  bridgeDirection?: string;
  /** Price impact percentage for swap operations */
  priceImpact?: string;
  /** Arbitrary extra data keyed by string */
  metadata?: Record<string, unknown>;
}
