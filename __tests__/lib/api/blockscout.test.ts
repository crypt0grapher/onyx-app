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
 * Build a fake Blockscout Etherscan-compatible API response for a Staked log.
 * topic0 = keccak256("Staked(address,uint256,uint256)")
 * topic1 = padded user address
 * data   = abi-encoded (xcnAmount, stXCNMinted)
 */
function makeStakedLog(opts: {
    txHash: string;
    blockNumber: string;
    timeStamp: string;
    xcnAmountHex: string;
    stXcnMintedHex: string;
}) {
    return {
        address: CONTRACT.toLowerCase(),
        topics: [
            // topic0 for Staked(address,uint256,uint256)
            "0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90",
            // topic1 = padded user
            "0x000000000000000000000000" +
                USER.toLowerCase().slice(2),
        ],
        data:
            "0x" +
            opts.xcnAmountHex.padStart(64, "0") +
            opts.stXcnMintedHex.padStart(64, "0"),
        blockNumber: opts.blockNumber,
        timeStamp: opts.timeStamp,
        transactionHash: opts.txHash,
        logIndex: "0x0",
        gasUsed: "0x0",
        gasPrice: "0x0",
    };
}

function makeUnstakedLog(opts: {
    txHash: string;
    blockNumber: string;
    timeStamp: string;
    stXcnBurnedHex: string;
    xcnReturnedHex: string;
}) {
    return {
        address: CONTRACT.toLowerCase(),
        topics: [
            // topic0 for Unstaked(address,uint256,uint256)
            "0x7fc4727e062e336010f2c282598ef5f14facb3de68cf8195c2f23e1454b2b74e",
            "0x000000000000000000000000" +
                USER.toLowerCase().slice(2),
        ],
        data:
            "0x" +
            opts.stXcnBurnedHex.padStart(64, "0") +
            opts.xcnReturnedHex.padStart(64, "0"),
        blockNumber: opts.blockNumber,
        timeStamp: opts.timeStamp,
        transactionHash: opts.txHash,
        logIndex: "0x0",
        gasUsed: "0x0",
        gasPrice: "0x0",
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

    it("returns staked events parsed from Blockscout API response", async () => {
        const stakedLog = makeStakedLog({
            txHash: "0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403",
            blockNumber: "0xb0853", // 723027
            timeStamp: "1742945514", // decimal timestamp
            xcnAmountHex: (500n * 10n ** 18n).toString(16),
            stXcnMintedHex: (490n * 10n ** 18n).toString(16),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "1",
                message: "OK",
                result: [stakedLog],
            }),
        });

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

    it("returns unstaked events parsed from Blockscout API response", async () => {
        const unstakedLog = makeUnstakedLog({
            txHash: "0xabcdef",
            blockNumber: "0xb0000",
            timeStamp: "1742940000",
            stXcnBurnedHex: (100n * 10n ** 18n).toString(16),
            xcnReturnedHex: (105n * 10n ** 18n).toString(16),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "1",
                message: "OK",
                result: [unstakedLog],
            }),
        });

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        const unstaked = events.find((e) => e.type === "Unstaked");
        expect(unstaked).toBeDefined();
        expect(unstaked!.xcnAmount).toBe(105n * 10n ** 18n);
    });

    it("returns empty array when API returns no results", async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "0",
                message: "No records found",
                result: [],
            }),
        });

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

    it("handles multiple events of both types", async () => {
        const staked1 = makeStakedLog({
            txHash: "0xaaa",
            blockNumber: "0xb0000",
            timeStamp: "1742940000",
            xcnAmountHex: (150n * 10n ** 18n).toString(16),
            stXcnMintedHex: (147n * 10n ** 18n).toString(16),
        });
        const staked2 = makeStakedLog({
            txHash: "0xbbb",
            blockNumber: "0xb06c3",
            timeStamp: "1742945514",
            xcnAmountHex: (500n * 10n ** 18n).toString(16),
            stXcnMintedHex: (490n * 10n ** 18n).toString(16),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "1",
                message: "OK",
                result: [staked1, staked2],
            }),
        });

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

    it("parses both hex and decimal timeStamp formats", async () => {
        const logDecimal = makeStakedLog({
            txHash: "0xdec",
            blockNumber: "723027",
            timeStamp: "1742945514",
            xcnAmountHex: (100n * 10n ** 18n).toString(16),
            stXcnMintedHex: (100n * 10n ** 18n).toString(16),
        });

        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "1",
                message: "OK",
                result: [logDecimal],
            }),
        });

        const events = await fetchStakingEventsFromExplorer(
            CONTRACT,
            USER,
            EXPLORER_URL,
        );

        expect(events).toHaveLength(1);
        expect(events[0].timestamp).toBe(1742945514);
    });
});
