import { buildExplorerUrl } from "@/utils/explorer";
import type { UnifiedHistoryItem } from "@/types/history";

// ---------------------------------------------------------------------------
// Source type
// ---------------------------------------------------------------------------

export interface LocalSwapRecord {
  txHash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  /** Unix timestamp in seconds */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// localStorage key helpers
// ---------------------------------------------------------------------------

const SWAP_HISTORY_KEY_PREFIX = "goliath:swap-history:v1:";

/**
 * Read all swap history records from localStorage for a given user address.
 *
 * Records are stored under keys matching the pattern
 * `goliath:swap-history:v1:<address>`.  Each value is a JSON-serialised
 * `LocalSwapRecord[]`.
 *
 * This function is safe to call in SSR -- it returns an empty array when
 * `window` is not available.
 */
export function readLocalSwapRecords(address?: string): LocalSwapRecord[] {
  if (typeof window === "undefined") return [];

  if (address) {
    const key = `${SWAP_HISTORY_KEY_PREFIX}${address.toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LocalSwapRecord[];
    } catch {
      return [];
    }
  }

  // If no address provided, scan all matching keys.
  const results: LocalSwapRecord[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(SWAP_HISTORY_KEY_PREFIX)) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as LocalSwapRecord[];
          results.push(...parsed);
        } catch {
          // skip malformed entries
        }
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Convert localStorage swap records into `UnifiedHistoryItem[]`.
 *
 * @param records  Deserialized swap history entries.
 * @param goliathChainId  Chain ID used to build explorer URLs.
 */
export function adaptLocalSwaps(
  records: LocalSwapRecord[],
  goliathChainId: number,
): UnifiedHistoryItem[] {
  return records.map((record) => ({
    id: `${record.txHash}:goliath:swap`,
    network: "goliath" as const,
    source: "local-swap" as const,
    type: "swap" as const,
    status: "confirmed" as const,
    timestamp: record.timestamp,
    txHash: record.txHash,
    from: "",
    to: "",
    amount: record.amountIn,
    amountRaw: record.amountIn,
    tokenSymbol: record.tokenIn,
    tokenDecimals: 18,
    explorerUrl: buildExplorerUrl(record.txHash, "tx", goliathChainId),
    metadata: {
      tokenIn: record.tokenIn,
      tokenOut: record.tokenOut,
      amountIn: record.amountIn,
      amountOut: record.amountOut,
    },
  }));
}
