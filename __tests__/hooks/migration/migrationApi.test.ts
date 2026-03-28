import { describe, it, expect } from "vitest";
import {
    MigrationApiService,
    type SubmitStakePreferenceRequest,
    type MigrationStatusResponse,
} from "@/lib/api/services/migration";

// ---------------------------------------------------------------------------
// 1. Instantiation
// ---------------------------------------------------------------------------

describe("MigrationApiService instantiation", () => {
    it("is instantiable", () => {
        const service = new MigrationApiService();
        expect(service).toBeInstanceOf(MigrationApiService);
    });
});

// ---------------------------------------------------------------------------
// 2. Method existence
// ---------------------------------------------------------------------------

describe("MigrationApiService methods", () => {
    const service = new MigrationApiService();

    it("has method submitStakePreference", () => {
        expect(typeof service.submitStakePreference).toBe("function");
    });

    it("has method bindOriginTxHash", () => {
        expect(typeof service.bindOriginTxHash).toBe("function");
    });

    it("has method getMigrationStatus", () => {
        expect(typeof service.getMigrationStatus).toBe("function");
    });

    it("has method getMigrationStats", () => {
        expect(typeof service.getMigrationStats).toBe("function");
    });

    it("has method getMigrationHistory", () => {
        expect(typeof service.getMigrationHistory).toBe("function");
    });
});

// ---------------------------------------------------------------------------
// 3. Type shape validation
// ---------------------------------------------------------------------------

describe("SubmitStakePreferenceRequest type shape", () => {
    // Construct an object that satisfies the interface -- if any required
    // field is missing, TypeScript will flag it at compile time. At runtime
    // we verify the object has all expected keys.
    const request: SubmitStakePreferenceRequest = {
        senderAddress: "0x1111111111111111111111111111111111111111",
        recipientAddress: "0x2222222222222222222222222222222222222222",
        amountAtomic: "1000000000000000000",
        stakeOnGoliath: true,
        idempotencyKey: "idem-key-1",
        deadline: 1711500000,
        nonce: "42",
        signature: "0xsig",
    };

    it("has senderAddress (string)", () => {
        expect(typeof request.senderAddress).toBe("string");
    });

    it("has recipientAddress (string)", () => {
        expect(typeof request.recipientAddress).toBe("string");
    });

    it("has amountAtomic (string)", () => {
        expect(typeof request.amountAtomic).toBe("string");
    });

    it("has stakeOnGoliath (boolean)", () => {
        expect(typeof request.stakeOnGoliath).toBe("boolean");
    });

    it("has idempotencyKey (string)", () => {
        expect(typeof request.idempotencyKey).toBe("string");
    });

    it("has deadline (number)", () => {
        expect(typeof request.deadline).toBe("number");
    });

    it("has nonce (string)", () => {
        expect(typeof request.nonce).toBe("string");
    });

    it("has signature (string)", () => {
        expect(typeof request.signature).toBe("string");
    });
});

describe("MigrationStatusResponse type shape", () => {
    // Construct a minimal conforming object. TypeScript enforces all
    // required fields at compile time; the runtime tests below validate
    // the key fields that the UI depends on.
    const response: MigrationStatusResponse = {
        operationId: "op-123",
        direction: "SOURCE_TO_GOLIATH",
        status: "COMPLETED",
        token: "XCN",
        amount: "1000000000000000000",
        amountFormatted: "1.0",
        sender: "0x1111111111111111111111111111111111111111",
        recipient: "0x2222222222222222222222222222222222222222",
        originChainId: 1,
        destinationChainId: 327,
        originTxHash: "0xorigin",
        destinationTxHash: "0xdest",
        originConfirmations: 12,
        requiredConfirmations: 12,
        timestamps: {
            depositedAt: "2026-03-27T00:00:00Z",
            finalizedAt: "2026-03-27T00:05:00Z",
            destinationSubmittedAt: "2026-03-27T00:06:00Z",
            completedAt: "2026-03-27T00:07:00Z",
        },
        estimatedCompletionTime: null,
        error: null,
        isSameWallet: true,
        stakeOnGoliath: true,
        stakingTxHash: null,
    };

    it("has operationId (string)", () => {
        expect(typeof response.operationId).toBe("string");
    });

    it("has status (string matching BridgeStatus)", () => {
        expect(typeof response.status).toBe("string");
        const validStatuses = [
            "PENDING_ORIGIN_TX",
            "CONFIRMING",
            "AWAITING_RELAY",
            "PROCESSING_DESTINATION",
            "COMPLETED",
            "FAILED",
            "EXPIRED",
            "DELAYED",
        ];
        expect(validStatuses).toContain(response.status);
    });

    it("has originTxHash (string | null)", () => {
        expect(
            typeof response.originTxHash === "string" ||
                response.originTxHash === null,
        ).toBe(true);
    });

    it("has destinationTxHash (string | null)", () => {
        expect(
            typeof response.destinationTxHash === "string" ||
                response.destinationTxHash === null,
        ).toBe(true);
    });

    it("has stakeOnGoliath (boolean | undefined)", () => {
        expect(
            typeof response.stakeOnGoliath === "boolean" ||
                response.stakeOnGoliath === undefined,
        ).toBe(true);
    });

    it("has stakingTxHash (string | null | undefined)", () => {
        expect(
            typeof response.stakingTxHash === "string" ||
                response.stakingTxHash === null ||
                response.stakingTxHash === undefined,
        ).toBe(true);
    });
});
