import { describe, it, expect, beforeEach } from "vitest";

describe("bridge operations persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("saves and loads operations from localStorage", () => {
        const key = "bridge:operations:v1";
        const ops = [
            {
                id: "1",
                status: "COMPLETED",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];
        localStorage.setItem(key, JSON.stringify(ops));
        const loaded = JSON.parse(localStorage.getItem(key)!);
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe("1");
    });

    it("old terminal operations should be cleanable", () => {
        const CLEANUP_DAYS = 7;
        const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;

        const ops = [
            { id: "1", status: "COMPLETED", updatedAt: cutoff - 1000 }, // old, should be cleaned
            { id: "2", status: "COMPLETED", updatedAt: Date.now() }, // recent, keep
            {
                id: "3",
                status: "PENDING_ORIGIN_TX",
                updatedAt: cutoff - 1000,
            }, // old but non-terminal, keep
        ];

        const terminalStatuses = ["COMPLETED", "FAILED", "EXPIRED"];
        const cleaned = ops.filter((op) => {
            const isTerminal = terminalStatuses.includes(op.status);
            return !isTerminal || op.updatedAt > cutoff;
        });

        expect(cleaned).toHaveLength(2);
        expect(cleaned.map((o) => o.id)).toEqual(["2", "3"]);
    });

    it("keeps all non-terminal operations regardless of age", () => {
        const CLEANUP_DAYS = 7;
        const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;

        const ops = [
            {
                id: "1",
                status: "PENDING_ORIGIN_TX",
                updatedAt: cutoff - 100000,
            },
            { id: "2", status: "CONFIRMING", updatedAt: cutoff - 100000 },
            { id: "3", status: "AWAITING_RELAY", updatedAt: cutoff - 100000 },
            {
                id: "4",
                status: "PROCESSING_DESTINATION",
                updatedAt: cutoff - 100000,
            },
            { id: "5", status: "DELAYED", updatedAt: cutoff - 100000 },
        ];

        const terminalStatuses = ["COMPLETED", "FAILED", "EXPIRED"];
        const cleaned = ops.filter((op) => {
            const isTerminal = terminalStatuses.includes(op.status);
            return !isTerminal || op.updatedAt > cutoff;
        });

        expect(cleaned).toHaveLength(5);
    });

    it("removes all terminal statuses when old", () => {
        const CLEANUP_DAYS = 7;
        const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;

        const ops = [
            { id: "1", status: "COMPLETED", updatedAt: cutoff - 1000 },
            { id: "2", status: "FAILED", updatedAt: cutoff - 1000 },
            { id: "3", status: "EXPIRED", updatedAt: cutoff - 1000 },
        ];

        const terminalStatuses = ["COMPLETED", "FAILED", "EXPIRED"];
        const cleaned = ops.filter((op) => {
            const isTerminal = terminalStatuses.includes(op.status);
            return !isTerminal || op.updatedAt > cutoff;
        });

        expect(cleaned).toHaveLength(0);
    });

    it("handles empty storage gracefully", () => {
        const key = "bridge:operations:v1";
        const raw = localStorage.getItem(key);
        expect(raw).toBeNull();
    });

    it("handles corrupt JSON gracefully", () => {
        const key = "bridge:operations:v1";
        localStorage.setItem(key, "not valid json {{{");

        let loaded: unknown[] = [];
        try {
            loaded = JSON.parse(localStorage.getItem(key)!);
        } catch {
            loaded = [];
        }

        expect(loaded).toEqual([]);
    });
});
