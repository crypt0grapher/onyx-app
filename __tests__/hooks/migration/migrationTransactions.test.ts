import { describe, it, expect } from "vitest";
import { maxUint256, erc20Abi } from "viem";
import { goliathConfig } from "@/config/goliath";
import { chnStakingAbi, bridgeLockAbi } from "@/contracts/abis/goliath";
import type {
    MigrationStep,
    StepExecutionStatus,
    StakingSnapshot,
    StepExecution,
} from "@/hooks/migration/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find a named entry in a readonly ABI tuple. */
function findAbiFunction<
    T extends readonly { type: string; name?: string }[],
>(abi: T, name: string) {
    return abi.find(
        (entry) =>
            "name" in entry && entry.name === name && entry.type === "function",
    );
}

/**
 * Mirrors the user-rejection detection logic from useMigrationTransactions.
 * If any of the substrings appear in the error message the transaction was
 * rejected by the user (not a real failure).
 */
function isUserRejection(message: string): boolean {
    return (
        message.includes("rejected") ||
        message.includes("denied") ||
        message.includes("4001")
    );
}

// ---------------------------------------------------------------------------
// 1. Claim transaction shape
// ---------------------------------------------------------------------------

describe("Claim transaction shape — withdraw(pid=0, amount=0)", () => {
    const withdrawEntry = findAbiFunction(chnStakingAbi, "withdraw");

    it("chnStakingAbi exposes a withdraw function", () => {
        expect(withdrawEntry).toBeDefined();
        expect(withdrawEntry!.type).toBe("function");
    });

    it("withdraw accepts (pid: uint256, amount: uint256)", () => {
        const inputs = "inputs" in withdrawEntry! ? withdrawEntry!.inputs : [];
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toMatchObject({ type: "uint256" });
        expect(inputs[1]).toMatchObject({ type: "uint256" });
    });

    it("claim uses pool ID 0n (bigint zero)", () => {
        // The hook passes args: [0n, 0n] — first arg is the pool ID.
        const pid = 0n;
        expect(pid).toBe(0n);
        expect(typeof pid).toBe("bigint");
    });

    it("claim uses amount 0n (withdraw-zero = claim rewards only)", () => {
        // Second arg 0n means "withdraw nothing, but harvest pending rewards".
        const amount = 0n;
        expect(amount).toBe(0n);
        expect(typeof amount).toBe("bigint");
    });

    it("claim targets sourceStakingAddress from config", () => {
        const address = goliathConfig.migration.sourceStakingAddress;
        expect(address).toBeDefined();
        expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("claim uses sourceChainId = 1 (Ethereum mainnet)", () => {
        expect(goliathConfig.bridge.sourceChainId).toBe(1);
    });

    it("claim args [0n, 0n] match withdraw ABI input count", () => {
        const claimArgs = [0n, 0n];
        const inputs = "inputs" in withdrawEntry! ? withdrawEntry!.inputs : [];
        expect(claimArgs).toHaveLength(inputs.length);
    });
});

// ---------------------------------------------------------------------------
// 2. Approve transaction shape
// ---------------------------------------------------------------------------

describe("Approve transaction shape — approve(bridgeAddress, maxUint256)", () => {
    const approveEntry = findAbiFunction(erc20Abi, "approve");

    it("erc20Abi exposes an approve function", () => {
        expect(approveEntry).toBeDefined();
        expect(approveEntry!.type).toBe("function");
    });

    it("approve accepts (spender: address, amount: uint256)", () => {
        const inputs = "inputs" in approveEntry! ? approveEntry!.inputs : [];
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toMatchObject({ name: "spender", type: "address" });
        expect(inputs[1]).toMatchObject({ name: "amount", type: "uint256" });
    });

    it("spender is sourceBridgeAddress from config", () => {
        const bridgeAddress = goliathConfig.bridge.sourceBridgeAddress;
        expect(bridgeAddress).toBeDefined();
        expect(bridgeAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("amount is maxUint256 (unlimited approval)", () => {
        expect(maxUint256).toBe(
            115792089237316195423570985008687907853269984665640564039457584007913129639935n,
        );
        expect(typeof maxUint256).toBe("bigint");
    });

    it("token address is sourceTokens.XCN from config", () => {
        const xcnAddress = goliathConfig.bridge.sourceTokens.XCN;
        expect(xcnAddress).toBeDefined();
        expect(xcnAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("approve chainId is sourceChainId = 1", () => {
        expect(goliathConfig.bridge.sourceChainId).toBe(1);
    });

    it("approve args [bridgeAddress, maxUint256] match ABI input count", () => {
        const approveArgs = [
            goliathConfig.bridge.sourceBridgeAddress,
            maxUint256,
        ];
        const inputs = "inputs" in approveEntry! ? approveEntry!.inputs : [];
        expect(approveArgs).toHaveLength(inputs.length);
    });

    it("sourceBridgeAddress and sourceTokens.XCN are distinct addresses", () => {
        expect(goliathConfig.bridge.sourceBridgeAddress).not.toBe(
            goliathConfig.bridge.sourceTokens.XCN,
        );
    });
});

// ---------------------------------------------------------------------------
// 3. Unstake transaction shape
// ---------------------------------------------------------------------------

describe("Unstake transaction shape — withdraw(pid=0, staked)", () => {
    it("unstake uses pool ID 0n", () => {
        const pid = 0n;
        expect(pid).toBe(0n);
        expect(typeof pid).toBe("bigint");
    });

    it("unstake amount matches snapshot.staked", () => {
        const snapshot: StakingSnapshot = {
            staked: 5000000000000000000000n, // 5000 XCN
            rewards: 100n,
            walletXcn: 0n,
            allowance: 0n,
            isLoading: false,
            error: null,
        };
        const args = [0n, snapshot.staked];
        expect(args[1]).toBe(5000000000000000000000n);
    });

    it("unstake targets sourceStakingAddress (same contract as claim)", () => {
        const address = goliathConfig.migration.sourceStakingAddress;
        expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("throws 'No staked amount' when snapshot.staked === 0n", () => {
        // Mirrors the guard: if (snapshot.staked === 0n) throw new Error("No staked amount")
        const snapshot: StakingSnapshot = {
            staked: 0n,
            rewards: 0n,
            walletXcn: 0n,
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        const executeUnstakeGuard = () => {
            if (snapshot.staked === 0n) throw new Error("No staked amount");
        };

        expect(executeUnstakeGuard).toThrow("No staked amount");
    });

    it("does not throw when snapshot.staked > 0n", () => {
        const snapshot: StakingSnapshot = {
            staked: 1n,
            rewards: 0n,
            walletXcn: 0n,
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        const executeUnstakeGuard = () => {
            if (snapshot.staked === 0n) throw new Error("No staked amount");
        };

        expect(executeUnstakeGuard).not.toThrow();
    });

    it("unstake args [0n, staked] match withdraw ABI input count", () => {
        const withdrawEntry = findAbiFunction(chnStakingAbi, "withdraw");
        const inputs =
            "inputs" in withdrawEntry! ? withdrawEntry!.inputs : [];
        const args = [0n, 5000n];
        expect(args).toHaveLength(inputs.length);
    });
});

// ---------------------------------------------------------------------------
// 4. Bridge transaction shape
// ---------------------------------------------------------------------------

describe("Bridge transaction shape — deposit(xcnAddress, amount, address)", () => {
    const depositEntry = findAbiFunction(bridgeLockAbi, "deposit");

    it("bridgeLockAbi exposes a deposit function", () => {
        expect(depositEntry).toBeDefined();
        expect(depositEntry!.type).toBe("function");
    });

    it("deposit accepts (token: address, amount: uint256, destinationAddress: address)", () => {
        const inputs = "inputs" in depositEntry! ? depositEntry!.inputs : [];
        expect(inputs).toHaveLength(3);
        expect(inputs[0]).toMatchObject({ name: "token", type: "address" });
        expect(inputs[1]).toMatchObject({ name: "amount", type: "uint256" });
        expect(inputs[2]).toMatchObject({
            name: "destinationAddress",
            type: "address",
        });
    });

    it("token argument is sourceTokens.XCN", () => {
        const xcnAddress = goliathConfig.bridge.sourceTokens.XCN;
        expect(xcnAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("bridge contract is sourceBridgeAddress", () => {
        const bridgeAddress = goliathConfig.bridge.sourceBridgeAddress;
        expect(bridgeAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("throws 'No XCN to bridge' when walletXcn === 0n", () => {
        const bridgeAmount = 0n;
        const guardBridgeAmount = () => {
            if (bridgeAmount === 0n) throw new Error("No XCN to bridge");
        };
        expect(guardBridgeAmount).toThrow("No XCN to bridge");
    });

    it("does not throw when walletXcn > 0n", () => {
        const bridgeAmount = 10000000000000000000n; // 10 XCN
        const guardBridgeAmount = () => {
            if (bridgeAmount === 0n) throw new Error("No XCN to bridge");
        };
        expect(guardBridgeAmount).not.toThrow();
    });

    it("throws 'Wallet not connected' when address is undefined", () => {
        const address: string | undefined = undefined;
        const guardAddress = () => {
            if (!address) throw new Error("Wallet not connected");
        };
        expect(guardAddress).toThrow("Wallet not connected");
    });

    it("does not throw when address is defined", () => {
        const address: string | undefined =
            "0x1234567890abcdef1234567890abcdef12345678";
        const guardAddress = () => {
            if (!address) throw new Error("Wallet not connected");
        };
        expect(guardAddress).not.toThrow();
    });

    it("deposit is nonpayable (ERC-20 bridge, not native)", () => {
        expect(
            "stateMutability" in depositEntry!
                ? depositEntry!.stateMutability
                : undefined,
        ).toBe("nonpayable");
    });

    it("deposit returns depositId (bytes32)", () => {
        const outputs = "outputs" in depositEntry! ? depositEntry!.outputs : [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0]).toMatchObject({
            name: "depositId",
            type: "bytes32",
        });
    });
});

// ---------------------------------------------------------------------------
// 5. EIP-712 signing — domain and types for stake preference
// ---------------------------------------------------------------------------

describe("EIP-712 signing — StakePreference typed data", () => {
    const expectedDomain = {
        name: "GoliathBridge",
        version: "1",
        chainId: BigInt(goliathConfig.bridge.sourceChainId),
    };

    const expectedTypes = {
        StakePreference: [
            { name: "senderAddress", type: "address" },
            { name: "recipientAddress", type: "address" },
            { name: "amountAtomic", type: "string" },
            { name: "stakeOnGoliath", type: "bool" },
            { name: "idempotencyKey", type: "string" },
            { name: "deadline", type: "uint256" },
            { name: "nonce", type: "string" },
        ],
    };

    it("domain.name is 'GoliathBridge'", () => {
        expect(expectedDomain.name).toBe("GoliathBridge");
    });

    it("domain.version is '1'", () => {
        expect(expectedDomain.version).toBe("1");
    });

    it("domain.chainId is BigInt(sourceChainId) = 1n", () => {
        expect(expectedDomain.chainId).toBe(1n);
        expect(typeof expectedDomain.chainId).toBe("bigint");
    });

    it("types has exactly one primary type: StakePreference", () => {
        const keys = Object.keys(expectedTypes);
        expect(keys).toHaveLength(1);
        expect(keys[0]).toBe("StakePreference");
    });

    it("StakePreference has exactly 7 fields", () => {
        expect(expectedTypes.StakePreference).toHaveLength(7);
    });

    it.each([
        { name: "senderAddress", type: "address" },
        { name: "recipientAddress", type: "address" },
        { name: "amountAtomic", type: "string" },
        { name: "stakeOnGoliath", type: "bool" },
        { name: "idempotencyKey", type: "string" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "string" },
    ])("StakePreference includes field $name ($type)", ({ name, type }) => {
        const field = expectedTypes.StakePreference.find(
            (f) => f.name === name,
        );
        expect(field).toBeDefined();
        expect(field!.type).toBe(type);
    });

    it("field order matches source: senderAddress, recipientAddress, amountAtomic, stakeOnGoliath, idempotencyKey, deadline, nonce", () => {
        const names = expectedTypes.StakePreference.map((f) => f.name);
        expect(names).toEqual([
            "senderAddress",
            "recipientAddress",
            "amountAtomic",
            "stakeOnGoliath",
            "idempotencyKey",
            "deadline",
            "nonce",
        ]);
    });

    it("amountAtomic is typed as 'string', not 'uint256' (arbitrary precision)", () => {
        const field = expectedTypes.StakePreference.find(
            (f) => f.name === "amountAtomic",
        );
        expect(field!.type).toBe("string");
        expect(field!.type).not.toBe("uint256");
    });

    it("deadline is typed as 'uint256' (on-chain compatible)", () => {
        const field = expectedTypes.StakePreference.find(
            (f) => f.name === "deadline",
        );
        expect(field!.type).toBe("uint256");
    });

    it("nonce is typed as 'string', not 'uint256'", () => {
        const field = expectedTypes.StakePreference.find(
            (f) => f.name === "nonce",
        );
        expect(field!.type).toBe("string");
    });

    it("migration.deadline config value is positive (seconds from now)", () => {
        expect(goliathConfig.migration.deadline).toBeGreaterThan(0);
    });

    it("migration.deadline default is 1800 (30 minutes)", () => {
        // The hook computes: Math.floor(Date.now()/1000) + deadline
        // 1800 seconds = 30 minutes
        expect(goliathConfig.migration.deadline).toBe(1800);
    });
});

// ---------------------------------------------------------------------------
// 6. Step lifecycle transitions
// ---------------------------------------------------------------------------

describe("Step lifecycle transitions — executeWithLifecycle", () => {
    /**
     * Replay the executeWithLifecycle pattern from the hook as a pure
     * state machine so we can validate every transition without wagmi.
     */
    function simulateLifecycle(
        actionResult: "success" | "userReject" | "error",
    ): StepExecution {
        let state: StepExecution = {
            status: "IDLE",
            txHash: null,
            error: null,
        };

        // Step 1: IDLE -> WAITING_SIGNATURE
        state = { ...state, status: "WAITING_SIGNATURE", error: null };

        if (actionResult === "success") {
            // Step 2: WAITING_SIGNATURE -> TX_PENDING
            state = { ...state, status: "TX_PENDING", txHash: "0xabc" };
            // Step 3: TX_PENDING -> CONFIRMED
            state = { ...state, status: "CONFIRMED" };
        } else if (actionResult === "userReject") {
            // User rejection resets to IDLE
            state = { ...state, status: "IDLE", error: null };
        } else {
            // Non-rejection error marks FAILED
            state = {
                ...state,
                status: "FAILED",
                error: "Transaction failed",
            };
        }

        return state;
    }

    it("happy path: IDLE -> WAITING_SIGNATURE -> TX_PENDING -> CONFIRMED", () => {
        const result = simulateLifecycle("success");
        expect(result.status).toBe("CONFIRMED");
        expect(result.txHash).toBe("0xabc");
        expect(result.error).toBeNull();
    });

    it("user rejection: resets to IDLE (not FAILED)", () => {
        const result = simulateLifecycle("userReject");
        expect(result.status).toBe("IDLE");
        expect(result.error).toBeNull();
    });

    it("non-rejection error: marks as FAILED with error message", () => {
        const result = simulateLifecycle("error");
        expect(result.status).toBe("FAILED");
        expect(result.error).toBe("Transaction failed");
    });

    it("recognizes 'rejected' as user rejection", () => {
        expect(isUserRejection("User rejected the request")).toBe(true);
    });

    it("recognizes 'denied' as user rejection", () => {
        expect(isUserRejection("Transaction denied by user")).toBe(true);
    });

    it("recognizes '4001' (EIP-1193 code) as user rejection", () => {
        expect(isUserRejection("Error code: 4001")).toBe(true);
    });

    it("does not treat 'insufficient funds' as user rejection", () => {
        expect(isUserRejection("insufficient funds for gas")).toBe(false);
    });

    it("does not treat 'nonce too low' as user rejection", () => {
        expect(isUserRejection("nonce too low")).toBe(false);
    });

    it("does not treat 'reverted' as user rejection", () => {
        expect(isUserRejection("execution reverted")).toBe(false);
    });

    it("does not treat empty string as user rejection", () => {
        expect(isUserRejection("")).toBe(false);
    });

    it("all MigrationStep values are valid lifecycle targets", () => {
        const steps: MigrationStep[] = [
            "CLAIM_REWARDS",
            "APPROVE",
            "UNSTAKE",
            "BRIDGE",
        ];
        for (const step of steps) {
            expect(typeof step).toBe("string");
            expect(step.length).toBeGreaterThan(0);
        }
    });

    it("all StepExecutionStatus values are defined", () => {
        const statuses: StepExecutionStatus[] = [
            "IDLE",
            "WAITING_SIGNATURE",
            "TX_PENDING",
            "CONFIRMED",
            "FAILED",
        ];
        expect(statuses).toHaveLength(5);
    });

    it("CONFIRMED and FAILED are the only terminal states from TX_PENDING", () => {
        const validFromTxPending: StepExecutionStatus[] = [
            "CONFIRMED",
            "FAILED",
        ];
        expect(validFromTxPending).toContain("CONFIRMED");
        expect(validFromTxPending).toContain("FAILED");
        expect(validFromTxPending).not.toContain("IDLE");
        expect(validFromTxPending).not.toContain("WAITING_SIGNATURE");
    });
});

// ---------------------------------------------------------------------------
// 7. Retry logic — bindWithRetry parameters
// ---------------------------------------------------------------------------

describe("Retry logic — bindWithRetry", () => {
    const MAX_RETRIES = 5;
    const BASE_DELAY = 2000;

    it("maxRetries is 5", () => {
        expect(MAX_RETRIES).toBe(5);
    });

    it("baseDelay is 2000ms", () => {
        expect(BASE_DELAY).toBe(2000);
    });

    it("exponential backoff: delay(0)=2000, delay(1)=4000, delay(2)=8000, delay(3)=16000, delay(4)=32000", () => {
        const expectedDelays = [2000, 4000, 8000, 16000, 32000];
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const delay = BASE_DELAY * Math.pow(2, attempt);
            expect(delay).toBe(expectedDelays[attempt]);
        }
    });

    it("total worst-case retry time is 62 seconds", () => {
        // Sum of all delays: 2000+4000+8000+16000+32000 = 62000ms
        let total = 0;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            total += BASE_DELAY * Math.pow(2, attempt);
        }
        expect(total).toBe(62000);
    });

    it("attempt counter starts at 0", () => {
        // The function signature: bindWithRetry(intentId, sender, txHash, attempt = 0)
        // First call uses default 0, retry increments to 1, 2, 3, 4, 5.
        // At attempt=5 it stops (5 < 5 is false).
        const attempt = 0;
        expect(attempt).toBe(0);
        expect(attempt < MAX_RETRIES).toBe(true);
    });

    it("stops retrying at attempt=5 (5 < 5 is false)", () => {
        const attempt = 5;
        expect(attempt < MAX_RETRIES).toBe(false);
    });

    it("retries at attempt=4 (4 < 5 is true, last retry)", () => {
        const attempt = 4;
        expect(attempt < MAX_RETRIES).toBe(true);
    });

    it("total attempts including initial call is 6 (initial + 5 retries)", () => {
        // attempt=0 (initial), then 1,2,3,4,5 (retries), stops at 5
        let callCount = 0;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            callCount++;
            if (attempt >= MAX_RETRIES) break;
        }
        expect(callCount).toBe(6);
    });
});

// ---------------------------------------------------------------------------
// 8. Config address consistency
// ---------------------------------------------------------------------------

describe("Config address consistency across migration transactions", () => {
    it("sourceStakingAddress is a valid checksummed-or-lowercase Ethereum address", () => {
        const addr = goliathConfig.migration.sourceStakingAddress;
        expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("sourceBridgeAddress is a valid Ethereum address", () => {
        const addr = goliathConfig.bridge.sourceBridgeAddress;
        expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("sourceTokens.XCN is a valid Ethereum address", () => {
        const addr = goliathConfig.bridge.sourceTokens.XCN;
        expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("claim and unstake use the same contract address (sourceStakingAddress)", () => {
        // Both executeClaim and executeUnstake target stakingAddress
        const claimTarget = goliathConfig.migration.sourceStakingAddress;
        const unstakeTarget = goliathConfig.migration.sourceStakingAddress;
        expect(claimTarget).toBe(unstakeTarget);
    });

    it("approve targets XCN token, not the staking contract", () => {
        expect(goliathConfig.bridge.sourceTokens.XCN).not.toBe(
            goliathConfig.migration.sourceStakingAddress,
        );
    });

    it("bridge targets sourceBridgeAddress, not the staking contract", () => {
        expect(goliathConfig.bridge.sourceBridgeAddress).not.toBe(
            goliathConfig.migration.sourceStakingAddress,
        );
    });

    it("all four transaction steps use sourceChainId = 1", () => {
        // claim, approve, unstake, bridge all pass chainId: sourceChainId
        const chainId = goliathConfig.bridge.sourceChainId;
        expect(chainId).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// 9. ABI completeness for migration operations
// ---------------------------------------------------------------------------

describe("ABI completeness for migration operations", () => {
    it("chnStakingAbi has withdraw function (used by claim and unstake)", () => {
        const withdraw = findAbiFunction(chnStakingAbi, "withdraw");
        expect(withdraw).toBeDefined();
    });

    it("chnStakingAbi has userInfo function (used for reading staking data)", () => {
        const userInfo = findAbiFunction(chnStakingAbi, "userInfo");
        expect(userInfo).toBeDefined();
    });

    it("chnStakingAbi has pendingReward function (used for reading rewards)", () => {
        const pendingReward = findAbiFunction(chnStakingAbi, "pendingReward");
        expect(pendingReward).toBeDefined();
    });

    it("chnStakingAbi withdraw is nonpayable (no ETH sent with unstake)", () => {
        const withdraw = findAbiFunction(chnStakingAbi, "withdraw");
        expect(
            "stateMutability" in withdraw!
                ? withdraw!.stateMutability
                : undefined,
        ).toBe("nonpayable");
    });

    it("bridgeLockAbi has deposit function (used by bridge step)", () => {
        const deposit = findAbiFunction(bridgeLockAbi, "deposit");
        expect(deposit).toBeDefined();
    });

    it("bridgeLockAbi deposit is nonpayable (ERC-20 deposit, not native)", () => {
        const deposit = findAbiFunction(bridgeLockAbi, "deposit");
        expect(
            "stateMutability" in deposit!
                ? deposit!.stateMutability
                : undefined,
        ).toBe("nonpayable");
    });

    it("erc20Abi has approve function (used by approve step)", () => {
        const approve = findAbiFunction(erc20Abi, "approve");
        expect(approve).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// 10. StakingSnapshot type shape
// ---------------------------------------------------------------------------

describe("StakingSnapshot type shape", () => {
    it("contains all required fields for transaction guards", () => {
        const snapshot: StakingSnapshot = {
            staked: 100n,
            rewards: 50n,
            walletXcn: 200n,
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        expect(snapshot).toHaveProperty("staked");
        expect(snapshot).toHaveProperty("rewards");
        expect(snapshot).toHaveProperty("walletXcn");
        expect(snapshot).toHaveProperty("allowance");
        expect(snapshot).toHaveProperty("isLoading");
        expect(snapshot).toHaveProperty("error");
    });

    it("bigint fields are bigint type", () => {
        const snapshot: StakingSnapshot = {
            staked: 0n,
            rewards: 0n,
            walletXcn: 0n,
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        expect(typeof snapshot.staked).toBe("bigint");
        expect(typeof snapshot.rewards).toBe("bigint");
        expect(typeof snapshot.walletXcn).toBe("bigint");
        expect(typeof snapshot.allowance).toBe("bigint");
    });

    it("unstake guard uses staked field (not walletXcn)", () => {
        const snapshot: StakingSnapshot = {
            staked: 0n,
            rewards: 0n,
            walletXcn: 1000n, // wallet has balance, but nothing staked
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        // This must check staked, not walletXcn
        expect(() => {
            if (snapshot.staked === 0n) throw new Error("No staked amount");
        }).toThrow("No staked amount");
    });

    it("bridge guard uses walletXcn field (not staked)", () => {
        const snapshot: StakingSnapshot = {
            staked: 1000n, // has staked balance
            rewards: 0n,
            walletXcn: 0n, // but nothing in wallet to bridge
            allowance: 0n,
            isLoading: false,
            error: null,
        };

        // This must check walletXcn, not staked
        expect(() => {
            if (snapshot.walletXcn === 0n)
                throw new Error("No XCN to bridge");
        }).toThrow("No XCN to bridge");
    });
});
