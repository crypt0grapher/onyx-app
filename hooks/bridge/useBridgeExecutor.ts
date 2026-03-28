"use client";

import { useAccount } from "wagmi";
import type { Address } from "viem";
import { goliathConfig } from "@/config/goliath";
import { getGoliathNetwork } from "@/config/networks";
import { useBridgeDeposit } from "./useBridgeDeposit";
import { useBridgeBurn } from "./useBridgeBurn";
import { useBridgeXcnWithdraw } from "./useBridgeXcnWithdraw";
import { useBridgeApprove } from "./useBridgeApprove";
import { useBridgeAllowance } from "./useBridgeAllowance";
import type { BridgeTokenSymbol } from "./types";

/**
 * Orchestrator hook that selects the correct execution strategy
 * (deposit / burn / XCN-withdraw) based on `direction` and `token`,
 * and manages the approval flow when needed.
 *
 * Consumers only need to call `execute()` and `approve()` -- the hook
 * takes care of routing to the correct underlying hook.
 */
export function useBridgeExecutor(
    direction: "SOURCE_TO_GOLIATH" | "GOLIATH_TO_SOURCE",
    token: BridgeTokenSymbol,
    tokenAddress: Address | null,
    amount: bigint,
) {
    const { address } = useAccount();
    const goliathChainId = getGoliathNetwork().chainId;

    const isNativeXcn =
        token === "XCN" && direction === "GOLIATH_TO_SOURCE";
    const isNativeEth =
        token === "ETH" && direction === "SOURCE_TO_GOLIATH";

    // Determine bridge contract and chain ID for approval
    const bridgeAddress =
        direction === "SOURCE_TO_GOLIATH"
            ? goliathConfig.bridge.sourceBridgeAddress
            : goliathConfig.bridge.goliathBridgeAddress;
    const chainId =
        direction === "SOURCE_TO_GOLIATH"
            ? goliathConfig.bridge.sourceChainId
            : goliathChainId;

    // ---- Allowance (skip for native assets) ----
    const needsToken = !isNativeXcn && !isNativeEth;
    const { hasAllowance, refetch: refetchAllowance } =
        useBridgeAllowance(
            needsToken ? tokenAddress : null,
            address,
            bridgeAddress,
            chainId,
        );
    const needsApproval = needsToken && !hasAllowance(amount);

    // ---- Approve ----
    const { approve: approveInternal, isPending: isApproving } =
        useBridgeApprove(tokenAddress, bridgeAddress, chainId);

    // ---- Execution hooks ----
    const depositHook = useBridgeDeposit();
    const burnHook = useBridgeBurn();
    const xcnWithdrawHook = useBridgeXcnWithdraw();

    const execute = async (recipient?: Address) => {
        if (direction === "SOURCE_TO_GOLIATH") {
            return await depositHook.deposit({
                tokenAddress: isNativeEth ? null : tokenAddress,
                amount,
                recipient,
            });
        } else if (isNativeXcn) {
            return await xcnWithdrawHook.withdraw({ amount, recipient });
        } else {
            return await burnHook.burn({
                tokenAddress: tokenAddress!,
                amount,
                recipient,
            });
        }
    };

    const approve = async () => {
        await approveInternal();
        refetchAllowance();
    };

    // Select the active hook's state for status propagation
    const activeHook =
        direction === "SOURCE_TO_GOLIATH"
            ? depositHook
            : isNativeXcn
              ? xcnWithdrawHook
              : burnHook;

    return {
        execute,
        approve,
        needsApproval,
        isPending: activeHook.isPending || isApproving,
        isSuccess: activeHook.isSuccess,
        txHash: activeHook.txHash,
        error: activeHook.error,
        reset: activeHook.reset,
    };
}
