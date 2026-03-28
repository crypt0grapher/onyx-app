/**
 * Blockscout API service for fetching staking history via transaction parsing.
 *
 * The Goliath chain uses a Hedera-based JSON-RPC relay that does NOT populate
 * event logs in transaction receipts (logs: [] for every tx). This means both
 * `eth_getLogs` and Blockscout's Etherscan-compatible /api?module=logs endpoint
 * return empty results (has_logs: false on the contract).
 *
 * Instead, this service uses the Blockscout **v2 transactions API** which
 * returns decoded method calls, values, and timestamps — enough to reconstruct
 * staking history from stake()/unstake() calls.
 */

// ---------------------------------------------------------------------------
// Types — Blockscout v2 response shapes
// ---------------------------------------------------------------------------

interface BlockscoutV2Address {
    hash: string;
}

interface BlockscoutV2DecodedInput {
    method_call: string;
    method_id: string;
    parameters: Array<{ name: string; type: string; value: string }>;
}

interface BlockscoutV2Transaction {
    hash: string;
    from: BlockscoutV2Address;
    to: BlockscoutV2Address | null;
    value: string;
    block_number: number;
    timestamp: string; // ISO 8601
    result: string;
    decoded_input: BlockscoutV2DecodedInput | null;
    raw_input: string;
}

interface BlockscoutV2Response {
    items: BlockscoutV2Transaction[];
    next_page_params: Record<string, string> | null;
}

// ---------------------------------------------------------------------------
// Public types (same interface as before for backward compatibility)
// ---------------------------------------------------------------------------

export interface StakingEventFromExplorer {
    type: "Staked" | "Unstaked";
    transactionHash: string;
    blockNumber: bigint;
    timestamp: number;
    user: string;
    /** For Staked: xcnAmount. For Unstaked: approximate XCN (= stXCN burned). */
    xcnAmount: bigint;
    /** For Staked: approximate (= xcnAmount). For Unstaked: stXCNBurned. */
    stXcnAmount: bigint;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Function selector for `stake()` — keccak256("stake()")[:4] */
const STAKE_SELECTOR = "0x3a4b66f1";
/** Function selector for `unstake(uint256)` — keccak256("unstake(uint256)")[:4] */
const UNSTAKE_SELECTOR = "0x2def6620";

/** Maximum pages to fetch (safety limit) */
const MAX_PAGES = 10;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetch staking history (stake + unstake calls) from Blockscout's v2
 * transactions API for a given user address.
 *
 * @param contractAddress  StakedXCN contract address
 * @param userAddress      Wallet address to filter transactions for
 * @param explorerUrl      Base explorer URL (e.g. "https://explorer.goliath.net")
 * @returns Parsed staking events sorted by block number descending
 */
export async function fetchStakingEventsFromExplorer(
    contractAddress: string,
    userAddress: string,
    explorerUrl: string,
): Promise<StakingEventFromExplorer[]> {
    try {
        const userLower = userAddress.toLowerCase();
        const events: StakingEventFromExplorer[] = [];
        let nextPageParams: Record<string, string> | null = null;
        let page = 0;

        // Paginate through all contract transactions
        do {
            const url = buildUrl(explorerUrl, contractAddress, nextPageParams);
            const response = await fetch(url);
            if (!response.ok) return events;

            const data: BlockscoutV2Response = await response.json();
            if (!data.items || !Array.isArray(data.items)) return events;

            for (const tx of data.items) {
                // Only successful transactions from the target user
                if (tx.result !== "success") continue;
                if (tx.from.hash.toLowerCase() !== userLower) continue;

                const event = parseTransaction(tx, userAddress);
                if (event) events.push(event);
            }

            nextPageParams = data.next_page_params;
            page++;
        } while (nextPageParams && page < MAX_PAGES);

        // Sort by block number descending (most recent first)
        events.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        return events;
    } catch {
        return [];
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrl(
    explorerUrl: string,
    contractAddress: string,
    nextPageParams: Record<string, string> | null,
): string {
    const base = `${explorerUrl}/api/v2/addresses/${contractAddress}/transactions`;
    if (!nextPageParams) return base;

    const params = new URLSearchParams(nextPageParams);
    return `${base}?${params.toString()}`;
}

function parseTransaction(
    tx: BlockscoutV2Transaction,
    userAddress: string,
): StakingEventFromExplorer | null {
    const selector = tx.raw_input?.slice(0, 10)?.toLowerCase();
    const methodCall = tx.decoded_input?.method_call?.toLowerCase() ?? "";

    const isStake =
        selector === STAKE_SELECTOR || methodCall.startsWith("stake()");
    const isUnstake =
        selector === UNSTAKE_SELECTOR || methodCall.startsWith("unstake(");

    if (!isStake && !isUnstake) return null;

    const blockNumber = BigInt(tx.block_number);
    const timestamp = Math.floor(new Date(tx.timestamp).getTime() / 1000);

    if (isStake) {
        // For stake(): the `value` field is the native XCN sent (18-dec via relay)
        const xcnAmount = BigInt(tx.value);
        if (xcnAmount === 0n) return null; // skip zero-value calls
        return {
            type: "Staked",
            transactionHash: tx.hash,
            blockNumber,
            timestamp,
            user: userAddress,
            xcnAmount,
            stXcnAmount: xcnAmount, // approximate (index ≈ 1.0 early on)
        };
    }

    // For unstake(uint256 stXcnWad): the parameter is the stXCN amount burned
    // The actual XCN returned = stXcnWad * index / RAY, but we don't have
    // the index at that block. Use stXcnWad as an approximation.
    const stXcnParam = tx.decoded_input?.parameters?.[0]?.value;
    const stXcnAmount = stXcnParam ? BigInt(stXcnParam) : 0n;

    return {
        type: "Unstaked",
        transactionHash: tx.hash,
        blockNumber,
        timestamp,
        user: userAddress,
        xcnAmount: stXcnAmount, // approximate
        stXcnAmount,
    };
}
