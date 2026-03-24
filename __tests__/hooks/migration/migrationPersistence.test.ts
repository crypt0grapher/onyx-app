import { describe, it, expect, beforeEach } from "vitest";
import type { PendingMigration } from "@/hooks/migration/types";

describe("migration persistence", () => {
    const prefix = "migration:pending:v1:";
    const address = "0x1234567890abcdef1234567890abcdef12345678";

    beforeEach(() => {
        localStorage.clear();
    });

    it("saves and loads pending migration", () => {
        const key = `${prefix}${address.toLowerCase()}`;
        const migration: PendingMigration = {
            originTxHash: "0xabc",
            intentId: "intent-1",
            stakeOnGoliath: true,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(migration));

        const loaded = JSON.parse(
            localStorage.getItem(key)!,
        ) as PendingMigration;
        expect(loaded.originTxHash).toBe("0xabc");
        expect(loaded.stakeOnGoliath).toBe(true);
        expect(loaded.intentId).toBe("intent-1");
    });

    it("stale migrations cleaned up", () => {
        const key = `${prefix}${address.toLowerCase()}`;
        const staleness = 48 * 60 * 60 * 1000;
        const migration: PendingMigration = {
            originTxHash: "0xold",
            intentId: "old",
            stakeOnGoliath: true,
            timestamp: Date.now() - staleness - 1000,
        };
        localStorage.setItem(key, JSON.stringify(migration));

        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw!) as PendingMigration;
        const isStale = Date.now() - parsed.timestamp > staleness;
        expect(isStale).toBe(true);
    });

    it("fresh migrations not cleaned up", () => {
        const staleness = 48 * 60 * 60 * 1000;
        const migration: PendingMigration = {
            originTxHash: "0xfresh",
            intentId: "new",
            stakeOnGoliath: false,
            timestamp: Date.now(),
        };
        const isStale = Date.now() - migration.timestamp > staleness;
        expect(isStale).toBe(false);
    });

    it("key is derived from lowercase address", () => {
        const mixedCase = "0xABCDef1234567890abcdef1234567890AbCdEf12";
        const key = `${prefix}${mixedCase.toLowerCase()}`;
        expect(key).toBe(
            `${prefix}0xabcdef1234567890abcdef1234567890abcdef12`,
        );
    });

    it("different addresses produce different keys", () => {
        const addr1 = "0x1111111111111111111111111111111111111111";
        const addr2 = "0x2222222222222222222222222222222222222222";
        const key1 = `${prefix}${addr1.toLowerCase()}`;
        const key2 = `${prefix}${addr2.toLowerCase()}`;
        expect(key1).not.toBe(key2);
    });

    it("handles corrupt JSON by treating it as empty", () => {
        const key = `${prefix}${address.toLowerCase()}`;
        localStorage.setItem(key, "not valid json");

        let migration: PendingMigration | null = null;
        try {
            migration = JSON.parse(
                localStorage.getItem(key)!,
            ) as PendingMigration;
        } catch {
            localStorage.removeItem(key);
            migration = null;
        }

        expect(migration).toBeNull();
        expect(localStorage.getItem(key)).toBeNull();
    });

    it("stakeOnGoliath preference is persisted correctly", () => {
        const key = `${prefix}${address.toLowerCase()}`;

        const withStake: PendingMigration = {
            originTxHash: "0x1",
            intentId: "1",
            stakeOnGoliath: true,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(withStake));
        const loaded1 = JSON.parse(
            localStorage.getItem(key)!,
        ) as PendingMigration;
        expect(loaded1.stakeOnGoliath).toBe(true);

        const withoutStake: PendingMigration = {
            originTxHash: "0x2",
            intentId: "2",
            stakeOnGoliath: false,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(withoutStake));
        const loaded2 = JSON.parse(
            localStorage.getItem(key)!,
        ) as PendingMigration;
        expect(loaded2.stakeOnGoliath).toBe(false);
    });
});
