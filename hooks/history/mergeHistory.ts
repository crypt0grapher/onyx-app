import type { UnifiedHistoryItem } from "@/types/history";

/**
 * Merge multiple arrays of `UnifiedHistoryItem` records, remove duplicates
 * by `id`, and sort by `timestamp` descending (most recent first).
 *
 * When two items share the same timestamp the sort is stable -- their
 * relative order from the input is preserved.
 */
export function mergeAndDedup(
  items: UnifiedHistoryItem[],
): UnifiedHistoryItem[] {
  // Deduplicate by `id`.  When a duplicate is found the later occurrence
  // (which comes from a source processed after the earlier one) wins.
  // This lets sources with richer data (e.g. bridge-api with status
  // updates) override simpler snapshots.
  const seen = new Map<string, UnifiedHistoryItem>();
  for (const item of items) {
    seen.set(item.id, item);
  }
  const unique = Array.from(seen.values());

  // Sort descending by timestamp.  `Array.prototype.sort` is guaranteed to
  // be stable in all modern engines (ES2019+), so items with equal
  // timestamps keep their insertion order.
  unique.sort((a, b) => b.timestamp - a.timestamp);

  return unique;
}
