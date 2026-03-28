import { describe, it, expect } from "vitest";
import type { BridgeStatus } from "@/lib/api/services/bridge";
import type { MigrationStatusResponse } from "@/lib/api/services/migration";

// ---------------------------------------------------------------------------
// Pure logic extracted from useMigrationStatus.ts for testability.
// The hook derives isTerminal, shouldPromptStaking, and isPolling from
// the migration status response -- we replicate that logic here so we can
// validate every edge-case without mounting React Query.
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES: BridgeStatus[] = ["COMPLETED", "FAILED", "EXPIRED"];

function isTerminal(status: BridgeStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
}

function shouldPromptStaking(
    migrationStatus: Partial<MigrationStatusResponse> | null,
): boolean {
    if (!migrationStatus) return false;
    const terminal = TERMINAL_STATUSES.includes(migrationStatus.status!);
    return (
        terminal &&
        migrationStatus.status === "COMPLETED" &&
        migrationStatus.stakeOnGoliath === true &&
        !migrationStatus.stakingTxHash
    );
}

function isPolling(
    migrationStatus: Partial<MigrationStatusResponse> | null,
    originTxHash: string | null,
): boolean {
    const terminal = migrationStatus
        ? TERMINAL_STATUSES.includes(migrationStatus.status!)
        : false;
    return !terminal && !!originTxHash;
}

// ---------------------------------------------------------------------------
// 1. Terminal status set
// ---------------------------------------------------------------------------

describe("Terminal status classification", () => {
    it.each(["COMPLETED", "FAILED", "EXPIRED"] as BridgeStatus[])(
        "%s is terminal",
        (status) => {
            expect(isTerminal(status)).toBe(true);
        },
    );
});

// ---------------------------------------------------------------------------
// 2. Non-terminal statuses
// ---------------------------------------------------------------------------

describe("Non-terminal status classification", () => {
    it.each([
        "PENDING_ORIGIN_TX",
        "CONFIRMING",
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "DELAYED",
    ] as BridgeStatus[])("%s is non-terminal", (status) => {
        expect(isTerminal(status)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 3. shouldPromptStaking logic
// ---------------------------------------------------------------------------

describe("shouldPromptStaking", () => {
    it("TRUE when status=COMPLETED, stakeOnGoliath=true, stakingTxHash=null", () => {
        expect(
            shouldPromptStaking({
                status: "COMPLETED",
                stakeOnGoliath: true,
                stakingTxHash: null,
            }),
        ).toBe(true);
    });

    it("TRUE when status=COMPLETED, stakeOnGoliath=true, stakingTxHash=undefined", () => {
        expect(
            shouldPromptStaking({
                status: "COMPLETED",
                stakeOnGoliath: true,
                stakingTxHash: undefined,
            }),
        ).toBe(true);
    });

    it("FALSE when status=COMPLETED, stakeOnGoliath=false", () => {
        expect(
            shouldPromptStaking({
                status: "COMPLETED",
                stakeOnGoliath: false,
                stakingTxHash: null,
            }),
        ).toBe(false);
    });

    it("FALSE when status=COMPLETED, stakingTxHash exists (already staked)", () => {
        expect(
            shouldPromptStaking({
                status: "COMPLETED",
                stakeOnGoliath: true,
                stakingTxHash: "0xabcdef1234567890",
            }),
        ).toBe(false);
    });

    it("FALSE when status=FAILED (even if stakeOnGoliath=true)", () => {
        expect(
            shouldPromptStaking({
                status: "FAILED",
                stakeOnGoliath: true,
                stakingTxHash: null,
            }),
        ).toBe(false);
    });

    it("FALSE when status=EXPIRED", () => {
        expect(
            shouldPromptStaking({
                status: "EXPIRED",
                stakeOnGoliath: true,
                stakingTxHash: null,
            }),
        ).toBe(false);
    });

    it.each([
        "PENDING_ORIGIN_TX",
        "CONFIRMING",
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "DELAYED",
    ] as BridgeStatus[])(
        "FALSE when status=%s (non-terminal, still in progress)",
        (status) => {
            expect(
                shouldPromptStaking({
                    status,
                    stakeOnGoliath: true,
                    stakingTxHash: null,
                }),
            ).toBe(false);
        },
    );

    it("FALSE when migrationStatus is null", () => {
        expect(shouldPromptStaking(null)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 4. Polling behavior
// ---------------------------------------------------------------------------

describe("Polling behavior", () => {
    it("isPolling=true when status is non-terminal AND originTxHash is present", () => {
        expect(
            isPolling({ status: "CONFIRMING" }, "0xabc"),
        ).toBe(true);
    });

    it.each([
        "PENDING_ORIGIN_TX",
        "CONFIRMING",
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "DELAYED",
    ] as BridgeStatus[])(
        "isPolling=true for non-terminal status %s with originTxHash",
        (status) => {
            expect(isPolling({ status }, "0xabc")).toBe(true);
        },
    );

    it.each(["COMPLETED", "FAILED", "EXPIRED"] as BridgeStatus[])(
        "isPolling=false for terminal status %s",
        (status) => {
            expect(isPolling({ status }, "0xabc")).toBe(false);
        },
    );

    it("isPolling=false when originTxHash is null (no tx to poll)", () => {
        expect(isPolling({ status: "CONFIRMING" }, null)).toBe(false);
    });

    it("isPolling=false when originTxHash is null even if status is non-terminal", () => {
        expect(isPolling({ status: "PENDING_ORIGIN_TX" }, null)).toBe(false);
    });

    it("isPolling=true when migrationStatus is null but originTxHash exists (initial fetch)", () => {
        expect(isPolling(null, "0xabc")).toBe(true);
    });

    it("isPolling=false when both migrationStatus and originTxHash are null", () => {
        expect(isPolling(null, null)).toBe(false);
    });
});
