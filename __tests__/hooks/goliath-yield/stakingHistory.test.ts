import { describe, it, expect } from "vitest";
import { adaptYieldEvents, type StXcnEvent } from "@/hooks/history/adapters/yieldAdapter";

describe("adaptYieldEvents", () => {
    const GOLIATH_CHAIN_ID = 327;

    it("converts Staked events to UnifiedHistoryItem with correct fields", () => {
        const events: StXcnEvent[] = [
            {
                type: "Staked",
                txHash: "0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403",
                user: "0xaa91057C8F98Af30C44BB8708399bF4daA188A81",
                amount: 500n * 10n ** 18n,
                timestamp: 1742945514,
                blockNumber: 723027n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);

        expect(items).toHaveLength(1);
        expect(items[0].type).toBe("stake");
        expect(items[0].network).toBe("goliath");
        expect(items[0].source).toBe("stxcn-events");
        expect(items[0].status).toBe("confirmed");
        expect(items[0].txHash).toBe(
            "0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403",
        );
        expect(items[0].from).toBe("0xaa91057C8F98Af30C44BB8708399bF4daA188A81");
        expect(items[0].tokenSymbol).toBe("XCN");
        // Amount should be formatted in ether units (not wei)
        expect(items[0].amount).toBe("500");
    });

    it("converts Unstaked events correctly", () => {
        const events: StXcnEvent[] = [
            {
                type: "Unstaked",
                txHash: "0xdef",
                user: "0xabc",
                amount: 100n * 10n ** 18n,
                timestamp: 1742940000,
                blockNumber: 720000n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);

        expect(items).toHaveLength(1);
        expect(items[0].type).toBe("unstake");
        expect(items[0].tokenSymbol).toBe("stXCN");
    });

    it("preserves timestamp from events", () => {
        const events: StXcnEvent[] = [
            {
                type: "Staked",
                txHash: "0x123",
                user: "0xabc",
                amount: 100n * 10n ** 18n,
                timestamp: 1742945514,
                blockNumber: 723027n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);

        expect(items[0].timestamp).toBe(1742945514);
    });

    it("handles empty events array", () => {
        const items = adaptYieldEvents([], GOLIATH_CHAIN_ID);
        expect(items).toEqual([]);
    });

    it("handles multiple events of mixed types", () => {
        const events: StXcnEvent[] = [
            {
                type: "Staked",
                txHash: "0x111",
                user: "0xabc",
                amount: 150n * 10n ** 18n,
                timestamp: 1742940000,
                blockNumber: 720051n,
            },
            {
                type: "Staked",
                txHash: "0x222",
                user: "0xabc",
                amount: 500n * 10n ** 18n,
                timestamp: 1742945514,
                blockNumber: 723027n,
            },
            {
                type: "Unstaked",
                txHash: "0x333",
                user: "0xabc",
                amount: 50n * 10n ** 18n,
                timestamp: 1742946000,
                blockNumber: 723100n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);

        expect(items).toHaveLength(3);
        expect(items.filter((i) => i.type === "stake")).toHaveLength(2);
        expect(items.filter((i) => i.type === "unstake")).toHaveLength(1);
    });

    it("builds correct explorer URL for goliath chain", () => {
        const events: StXcnEvent[] = [
            {
                type: "Staked",
                txHash: "0xabc123",
                user: "0xdef",
                amount: 1n * 10n ** 18n,
                timestamp: 1742940000,
                blockNumber: 100n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);

        expect(items[0].explorerUrl).toContain("0xabc123");
        expect(items[0].explorerUrl).toContain("/tx/");
    });

    it("generates unique IDs for each event", () => {
        const events: StXcnEvent[] = [
            {
                type: "Staked",
                txHash: "0x111",
                user: "0xabc",
                amount: 100n * 10n ** 18n,
                timestamp: 1742940000,
                blockNumber: 100n,
            },
            {
                type: "Unstaked",
                txHash: "0x111",
                user: "0xabc",
                amount: 100n * 10n ** 18n,
                timestamp: 1742940000,
                blockNumber: 100n,
            },
        ];

        const items = adaptYieldEvents(events, GOLIATH_CHAIN_ID);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size).toBe(2);
    });
});
