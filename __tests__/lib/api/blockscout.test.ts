import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    fetchStakingEventsFromExplorer,
    type StakingEventFromExplorer,
} from "@/lib/api/services/blockscout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTRACT = "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74";
const USER = "0xaa91057C8F98Af30C44BB8708399bF4daA188A81";
const EXPLORER_URL = "https://explorer.goliath.net";

/**
 * Build a fake Blockscout v2 transaction for a stake() call.
 */
function makeStakeTx(opts: {
    txHash: string;
    blockNumber: number;
    timestamp: string; // ISO 8601
    value: string; // wei string
    from?: string;
}) {
    return {
        hash: opts.txHash,
        from: { hash: opts.from ?? USER },
        to: { hash: CONTRACT },
        value: opts.value,
        block_number: opts.blockNumber,
        timestamp: opts.timestamp,
        result: "success",
        decoded_input: {
            method_call: "stake()",
            method_id: "3a4b66f1",
            parameters: [],
        },
        raw_input: "0x3a4b66f1",
    };
}

/**
 * Build a fake Blockscout v2 transaction for an unstake(uint256) call.
 */
function makeUnstakeTx(opts: {
    txHash: string;
    blockNumber: number;
    timestamp: string;
    stXcnAmount: string; // wei string
    from?: string;
}) {
    return {
        hash: opts.txHash,
        from: { hash: opts.from ?? USER },
        to: { hash: CONTRACT },
        value: "0",
        block_number: opts.blockNumber,
        timestamp: opts.timestamp,
        result: "success",
        decoded_input: {
            method_call: "unstake(uint256 stXcnWad)",
            method_id: "2def6620",
            parameters: [
                { name: "stXcnWad", type: "uint256", value: opts.stXcnAmount },
            ],
        },
        raw_input: "0x2def6620" + opts.stXcnAmount.padStart(64, "0"),
    };
}

/**
 * Build a fake Blockscout v2 transaction for a fund() call (not staking).
 */
function makeFundTx(opts: {
    txHash: string;
    blockNumber: number;
    timestamp: string;
    value: string;
}) {
    return {
        hash: opts.txHash,
        from: { hash: USER },
        to: { hash: CONTRACT },
        value: opts.value,
        block_number: opts.blockNumber,
        timestamp: opts.timestamp,
        result: "success",
        decoded_input: {
            method_call: "fund()",
            method_id: "b60d4288",
            parameters: [],
        },
        raw_input: "0xb60d4288",
    };
}

function mockV2Response(
    items: unknown[],
    nextPageParams: Record<string, string> | null = null,
) {
    return {
        ok: true,
        json: async () => ({
            items,
            next_page_params: nextPageParams,
        }),
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fetchStakingEventsFromExplorer", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it("returns staked events parsed from v2 transactions API", async () => {
        const stakeTx = makeStakeTx({
            txHash: "0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (500n * 10n ** 18n).toString(),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([stakeTx]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events.length).toBeGreaterThanOrEqual(1);

        const staked = events.find((e) => e.type === "Staked");
        expect(staked).toBeDefined();
        expect(staked!.transactionHash).toBe(
            "0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403",
        );
        expect(staked!.blockNumber).toBe(723027n);
        expect(staked!.xcnAmount).toBe(500n * 10n ** 18n);
    });

    it("returns unstaked events from decoded transaction parameters", async () => {
        const unstakeTx = makeUnstakeTx({
            txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            blockNumber: 720000,
            timestamp: "2026-03-25T22:00:00.000000Z",
            stXcnAmount: (100n * 10n ** 18n).toString(),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([unstakeTx]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        const unstaked = events.find((e) => e.type === "Unstaked");
        expect(unstaked).toBeDefined();
        expect(unstaked!.xcnAmount).toBe(100n * 10n ** 18n);
    });

    it("returns empty array when API returns empty items", async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toEqual([]);
    });

    it("returns empty array when fetch fails", async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error("Network error"),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toEqual([]);
    });

    it("returns empty array when API returns error status", async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toEqual([]);
    });

    it("handles multiple events sorted by block descending", async () => {
        const stake1 = makeStakeTx({
            txHash: "0xaaa0000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 720051,
            timestamp: "2026-03-25T22:42:18.000000Z",
            value: (150n * 10n ** 18n).toString(),
        });
        const stake2 = makeStakeTx({
            txHash: "0xbbb0000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (500n * 10n ** 18n).toString(),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([stake1, stake2]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toHaveLength(2);
        // Should be sorted by block number descending
        expect(Number(events[0].blockNumber)).toBeGreaterThanOrEqual(
            Number(events[1].blockNumber),
        );
    });

    it("filters out non-staking transactions (fund, other methods)", async () => {
        const stakeTx = makeStakeTx({
            txHash: "0x1110000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (500n * 10n ** 18n).toString(),
        });
        const fundTx = makeFundTx({
            txHash: "0x2220000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 643171,
            timestamp: "2026-03-25T01:20:57.000000Z",
            value: (100000n * 10n ** 18n).toString(),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([stakeTx, fundTx]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        // fund() should be filtered out
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe("Staked");
    });

    it("filters out transactions from other users", async () => {
        const otherUser = "0xE708B75F7b6914479E63D3897bEF9e0dedcA3640";
        const userStake = makeStakeTx({
            txHash: "0xaaa0000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (500n * 10n ** 18n).toString(),
            from: USER,
        });
        const otherStake = makeStakeTx({
            txHash: "0xbbb0000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 716114,
            timestamp: "2026-03-25T21:36:41.000000Z",
            value: (100n * 10n ** 18n).toString(),
            from: otherUser,
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([userStake, otherStake]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toHaveLength(1);
        expect(events[0].transactionHash).toBe(
            "0xaaa0000000000000000000000000000000000000000000000000000000000000",
        );
    });

    it("handles pagination across multiple pages", async () => {
        const page1Tx = makeStakeTx({
            txHash: "0xpage1000000000000000000000000000000000000000000000000000000000",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (500n * 10n ** 18n).toString(),
        });
        const page2Tx = makeStakeTx({
            txHash: "0xpage2000000000000000000000000000000000000000000000000000000000",
            blockNumber: 720051,
            timestamp: "2026-03-25T22:42:18.000000Z",
            value: (150n * 10n ** 18n).toString(),
        });

        const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
        // First page with next_page_params
        fetchMock.mockResolvedValueOnce(
            mockV2Response([page1Tx], { block_number: "720051", index: "0" }),
        );
        // Second page with no more pages
        fetchMock.mockResolvedValueOnce(mockV2Response([page2Tx]));

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toHaveLength(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("parses ISO 8601 timestamps to unix seconds", async () => {
        const stakeTx = makeStakeTx({
            txHash: "0xts00000000000000000000000000000000000000000000000000000000000000",
            blockNumber: 723027,
            timestamp: "2026-03-25T23:31:54.000000Z",
            value: (100n * 10n ** 18n).toString(),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            mockV2Response([stakeTx]),
        );

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toHaveLength(1);
        // 2026-03-25T23:31:54Z = 1774505514 (approx)
        expect(events[0].timestamp).toBeGreaterThan(1700000000);
        expect(events[0].timestamp).toBeLessThan(1800000000);
    });
});
