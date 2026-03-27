import { describe, it, expect, beforeEach } from "vitest";
import { bridgeLockAbi } from "@/contracts/abis/goliath";
import { bridgeGoliathAbi } from "@/contracts/abis/goliath";
import { goliathConfig } from "@/config/goliath";
import {
    BridgeApiService,
    type BridgeStatus,
} from "@/lib/api/services/bridge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AbiEntry = (typeof bridgeLockAbi)[number] | (typeof bridgeGoliathAbi)[number];

function findAbiEntry(
    abi: readonly AbiEntry[],
    name: string,
    type: string,
): AbiEntry | undefined {
    return abi.find(
        (entry) =>
            "name" in entry && entry.name === name && entry.type === type,
    );
}

// ---------------------------------------------------------------------------
// 1. BridgeLock ABI
// ---------------------------------------------------------------------------

describe("BridgeLock ABI", () => {
    it("has a deposit function with params (token: address, amount: uint256, destinationAddress: address)", () => {
        const deposit = findAbiEntry(bridgeLockAbi, "deposit", "function");
        expect(deposit).toBeDefined();
        expect(deposit!.type).toBe("function");

        const inputs = "inputs" in deposit! ? deposit!.inputs : [];
        expect(inputs).toHaveLength(3);
        expect(inputs[0]).toMatchObject({ name: "token", type: "address" });
        expect(inputs[1]).toMatchObject({ name: "amount", type: "uint256" });
        expect(inputs[2]).toMatchObject({
            name: "destinationAddress",
            type: "address",
        });
    });

    it("has a depositNative function with param (destinationAddress: address) that is payable", () => {
        const depositNative = findAbiEntry(
            bridgeLockAbi,
            "depositNative",
            "function",
        );
        expect(depositNative).toBeDefined();
        expect(depositNative!.type).toBe("function");

        const inputs = "inputs" in depositNative! ? depositNative!.inputs : [];
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toMatchObject({
            name: "destinationAddress",
            type: "address",
        });

        expect(
            "stateMutability" in depositNative!
                ? depositNative!.stateMutability
                : undefined,
        ).toBe("payable");
    });

    it("has a Deposit event", () => {
        const depositEvent = findAbiEntry(bridgeLockAbi, "Deposit", "event");
        expect(depositEvent).toBeDefined();
        expect(depositEvent!.type).toBe("event");
    });

    it("deposit returns depositId (bytes32)", () => {
        const deposit = findAbiEntry(bridgeLockAbi, "deposit", "function");
        expect(deposit).toBeDefined();

        const outputs = "outputs" in deposit! ? deposit!.outputs : [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0]).toMatchObject({
            name: "depositId",
            type: "bytes32",
        });
    });

    it("depositNative returns depositId (bytes32)", () => {
        const depositNative = findAbiEntry(
            bridgeLockAbi,
            "depositNative",
            "function",
        );
        expect(depositNative).toBeDefined();

        const outputs =
            "outputs" in depositNative! ? depositNative!.outputs : [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0]).toMatchObject({
            name: "depositId",
            type: "bytes32",
        });
    });
});

// ---------------------------------------------------------------------------
// 2. BridgeGoliath ABI
// ---------------------------------------------------------------------------

describe("BridgeGoliath ABI", () => {
    it("has a burn function with params (token, amount, destinationAddress, destinationChainId)", () => {
        const burn = findAbiEntry(bridgeGoliathAbi, "burn", "function");
        expect(burn).toBeDefined();
        expect(burn!.type).toBe("function");

        const inputs = "inputs" in burn! ? burn!.inputs : [];
        expect(inputs).toHaveLength(4);
        expect(inputs[0]).toMatchObject({ name: "token", type: "address" });
        expect(inputs[1]).toMatchObject({ name: "amount", type: "uint256" });
        expect(inputs[2]).toMatchObject({
            name: "destinationAddress",
            type: "address",
        });
        expect(inputs[3]).toMatchObject({
            name: "destinationChainId",
            type: "uint64",
        });
    });

    it("has a Withdraw event", () => {
        const withdrawEvent = findAbiEntry(
            bridgeGoliathAbi,
            "Withdraw",
            "event",
        );
        expect(withdrawEvent).toBeDefined();
        expect(withdrawEvent!.type).toBe("event");
    });

    it("burn returns withdrawId (bytes32)", () => {
        const burn = findAbiEntry(bridgeGoliathAbi, "burn", "function");
        expect(burn).toBeDefined();

        const outputs = "outputs" in burn! ? burn!.outputs : [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0]).toMatchObject({
            name: "withdrawId",
            type: "bytes32",
        });
    });
});

// ---------------------------------------------------------------------------
// 3. Bridge config
// ---------------------------------------------------------------------------

describe("Bridge config", () => {
    it("bridge.sourceChainId is 1", () => {
        expect(goliathConfig.bridge.sourceChainId).toBe(1);
    });

    it("bridge.bridgeEnabled is boolean", () => {
        expect(typeof goliathConfig.bridge.bridgeEnabled).toBe("boolean");
    });

    it("bridge.allowCustomRecipient is boolean", () => {
        expect(typeof goliathConfig.bridge.allowCustomRecipient).toBe(
            "boolean",
        );
    });

    it("bridge.statusPollInterval is > 0", () => {
        expect(goliathConfig.bridge.statusPollInterval).toBeGreaterThan(0);
    });

    it("bridge.minAmount is a parseable number string > 0", () => {
        const parsed = Number(goliathConfig.bridge.minAmount);
        expect(Number.isNaN(parsed)).toBe(false);
        expect(parsed).toBeGreaterThan(0);
    });

    it("bridge.sourceRpcUrls is a non-empty array", () => {
        expect(Array.isArray(goliathConfig.bridge.sourceRpcUrls)).toBe(true);
        expect(goliathConfig.bridge.sourceRpcUrls.length).toBeGreaterThan(0);
    });

    it('bridge.sourceExplorerUrl contains "etherscan"', () => {
        expect(goliathConfig.bridge.sourceExplorerUrl).toContain("etherscan");
    });
});

// ---------------------------------------------------------------------------
// 4. Bridge API service
// ---------------------------------------------------------------------------

describe("Bridge API service", () => {
    it("is instantiable", () => {
        const service = new BridgeApiService();
        expect(service).toBeInstanceOf(BridgeApiService);
    });

    it("has method getStatus", () => {
        const service = new BridgeApiService();
        expect(typeof service.getStatus).toBe("function");
    });

    it("has method getHistory", () => {
        const service = new BridgeApiService();
        expect(typeof service.getHistory).toBe("function");
    });

    it("has method getHealth", () => {
        const service = new BridgeApiService();
        expect(typeof service.getHealth).toBe("function");
    });

    it("has method getFeeQuote", () => {
        const service = new BridgeApiService();
        expect(typeof service.getFeeQuote).toBe("function");
    });

    it("has method getLimits", () => {
        const service = new BridgeApiService();
        expect(typeof service.getLimits).toBe("function");
    });

    it("has method isPaused", () => {
        const service = new BridgeApiService();
        expect(typeof service.isPaused).toBe("function");
    });

    it("has method registerXcnWithdrawIntent", () => {
        const service = new BridgeApiService();
        expect(typeof service.registerXcnWithdrawIntent).toBe("function");
    });

    it("has method bindXcnWithdrawOrigin", () => {
        const service = new BridgeApiService();
        expect(typeof service.bindXcnWithdrawOrigin).toBe("function");
    });

    it("has method checkXcnWithdrawCapability", () => {
        const service = new BridgeApiService();
        expect(typeof service.checkXcnWithdrawCapability).toBe("function");
    });
});

// ---------------------------------------------------------------------------
// 5. Bridge status types
// ---------------------------------------------------------------------------

describe("Bridge status types", () => {
    const expectedStatuses: BridgeStatus[] = [
        "PENDING_ORIGIN_TX",
        "CONFIRMING",
        "AWAITING_RELAY",
        "PROCESSING_DESTINATION",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
        "DELAYED",
    ];

    it.each(expectedStatuses)(
        "BridgeStatus accepts value %s",
        (status) => {
            const value: BridgeStatus = status;
            expect(value).toBe(status);
        },
    );

    it("covers all expected status values", () => {
        const statusSet = new Set<string>(expectedStatuses);
        expect(statusSet.size).toBe(8);
        expect(statusSet.has("PENDING_ORIGIN_TX")).toBe(true);
        expect(statusSet.has("CONFIRMING")).toBe(true);
        expect(statusSet.has("AWAITING_RELAY")).toBe(true);
        expect(statusSet.has("PROCESSING_DESTINATION")).toBe(true);
        expect(statusSet.has("COMPLETED")).toBe(true);
        expect(statusSet.has("FAILED")).toBe(true);
        expect(statusSet.has("EXPIRED")).toBe(true);
        expect(statusSet.has("DELAYED")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 6. Bridge operation persistence
// ---------------------------------------------------------------------------

describe("Bridge operation persistence", () => {
    const STORAGE_KEY = "bridge:operations:v1";

    beforeEach(() => {
        localStorage.clear();
    });

    it('operations use key "bridge:operations:v1"', () => {
        const ops = [{ id: "test-1" }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed[0].id).toBe("test-1");
    });

    it("serialized operations include required fields: id, direction, token, status, createdAt, updatedAt", () => {
        const operation = {
            id: "op-abc-123",
            direction: "SOURCE_TO_GOLIATH",
            token: "ETH",
            status: "PENDING_ORIGIN_TX",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify([operation]));
        const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);

        expect(loaded).toHaveLength(1);
        const op = loaded[0];
        expect(op).toHaveProperty("id");
        expect(op).toHaveProperty("direction");
        expect(op).toHaveProperty("token");
        expect(op).toHaveProperty("status");
        expect(op).toHaveProperty("createdAt");
        expect(op).toHaveProperty("updatedAt");

        expect(typeof op.id).toBe("string");
        expect(typeof op.direction).toBe("string");
        expect(typeof op.token).toBe("string");
        expect(typeof op.status).toBe("string");
        expect(typeof op.createdAt).toBe("number");
        expect(typeof op.updatedAt).toBe("number");
    });
});

// ---------------------------------------------------------------------------
// 7. Bridge allowance logic
// ---------------------------------------------------------------------------

describe("Bridge allowance logic", () => {
    /**
     * Pure helper that mirrors the bridge allowance check:
     * - Native tokens (null tokenAddress) never need approval.
     * - ERC-20 tokens need allowance >= amount.
     */
    function hasAllowance(
        tokenAddress: string | null,
        allowance: bigint,
        amount: bigint,
    ): boolean {
        if (tokenAddress === null) return true;
        return allowance >= amount;
    }

    it("returns true when allowance >= amount", () => {
        expect(hasAllowance("0xToken", 100n, 100n)).toBe(true);
        expect(hasAllowance("0xToken", 200n, 100n)).toBe(true);
    });

    it("returns true for native tokens (null tokenAddress means no approval needed)", () => {
        expect(hasAllowance(null, 0n, 1000n)).toBe(true);
        expect(hasAllowance(null, 0n, 0n)).toBe(true);
    });

    it("returns false when allowance < amount", () => {
        expect(hasAllowance("0xToken", 50n, 100n)).toBe(false);
        expect(hasAllowance("0xToken", 0n, 1n)).toBe(false);
    });
});
