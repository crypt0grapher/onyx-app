import { describe, it, expect } from "vitest";
import { mergeAndDedup } from "@/hooks/history/mergeHistory";
import type { UnifiedHistoryItem } from "@/types/history";

describe("mergeAndDedup", () => {
    const makeItem = (
        id: string,
        timestamp: number,
    ): UnifiedHistoryItem => ({
        id,
        network: "ethereum",
        source: "subgraph",
        type: "stake",
        status: "confirmed",
        timestamp,
        txHash: `0x${id}`,
        from: "0x0",
        to: "0x0",
        amount: "1.0",
        amountRaw: "1000000000000000000",
        tokenSymbol: "XCN",
        tokenDecimals: 18,
        explorerUrl: "",
    });

    it("deduplicates by id", () => {
        const items = [
            makeItem("a", 100),
            makeItem("a", 100),
            makeItem("b", 200),
        ];
        const result = mergeAndDedup(items);
        expect(result).toHaveLength(2);
    });

    it("sorts by timestamp descending", () => {
        const items = [
            makeItem("a", 100),
            makeItem("b", 300),
            makeItem("c", 200),
        ];
        const result = mergeAndDedup(items);
        expect(result[0].id).toBe("b");
        expect(result[1].id).toBe("c");
        expect(result[2].id).toBe("a");
    });

    it("handles empty array", () => {
        const result = mergeAndDedup([]);
        expect(result).toHaveLength(0);
    });

    it("handles single item", () => {
        const result = mergeAndDedup([makeItem("only", 500)]);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("only");
    });

    it("later duplicate overwrites earlier one", () => {
        const item1: UnifiedHistoryItem = {
            ...makeItem("dup", 100),
            status: "pending",
        };
        const item2: UnifiedHistoryItem = {
            ...makeItem("dup", 100),
            status: "confirmed",
        };
        const result = mergeAndDedup([item1, item2]);
        expect(result).toHaveLength(1);
        // The later occurrence (item2) should win
        expect(result[0].status).toBe("confirmed");
    });

    it("preserves all fields after merge", () => {
        const item: UnifiedHistoryItem = {
            id: "full",
            network: "goliath",
            source: "bridge-api",
            type: "bridge",
            status: "confirmed",
            timestamp: 1000,
            txHash: "0xfull",
            from: "0xaaa",
            to: "0xbbb",
            amount: "50.0",
            amountRaw: "50000000000000000000",
            tokenSymbol: "ETH",
            tokenDecimals: 18,
            explorerUrl: "https://example.com/tx/0xfull",
            destinationTxHash: "0xdest",
            bridgeDirection: "SOURCE_TO_GOLIATH",
        };

        const result = mergeAndDedup([item]);
        expect(result[0]).toEqual(item);
    });

    it("handles items with equal timestamps", () => {
        const items = [
            makeItem("x", 500),
            makeItem("y", 500),
            makeItem("z", 500),
        ];
        const result = mergeAndDedup(items);
        expect(result).toHaveLength(3);
        // All should be present, order among equals is stable
        const ids = result.map((r) => r.id);
        expect(ids).toContain("x");
        expect(ids).toContain("y");
        expect(ids).toContain("z");
    });

    it("handles multiple different sources", () => {
        const items: UnifiedHistoryItem[] = [
            { ...makeItem("a", 300), source: "subgraph" },
            { ...makeItem("b", 200), source: "bridge-api" },
            { ...makeItem("c", 100), source: "local-swap" },
        ];
        const result = mergeAndDedup(items);
        expect(result).toHaveLength(3);
        expect(result[0].source).toBe("subgraph");
        expect(result[1].source).toBe("bridge-api");
        expect(result[2].source).toBe("local-swap");
    });
});
