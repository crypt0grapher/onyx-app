"use client";

import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { goliathConfig } from "@/config/goliath";
import { uniswapV2RouterAbi } from "@/contracts/abis/goliath";
import type { Address } from "viem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoliathSwapExecutionParams {
    path: Address[];
    amountIn: bigint;
    amountOutMin: bigint;
    /** true when the input token is native XCN (not WXCN). */
    isNativeIn: boolean;
    /** true when the output token is native XCN (not WXCN). */
    isNativeOut: boolean;
    /** Custom deadline timestamp (seconds). Defaults to now + 20 min. */
    deadline?: bigint;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Executes swaps against the Goliath Uniswap V2 router contract.
 *
 * Picks the correct router function based on whether the trade involves
 * native XCN on either side:
 *
 *   - native XCN in  -> `swapExactETHForTokens`   (payable, value = amountIn)
 *   - native XCN out -> `swapExactTokensForETH`
 *   - ERC-20 both    -> `swapExactTokensForTokens`
 */
export function useGoliathSwapExecution() {
    const { address } = useAccount();
    const {
        writeContractAsync,
        data: hash,
        isPending,
        error,
        reset,
    } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    const execute = async (params: GoliathSwapExecutionParams) => {
        if (!address) return;

        const routerAddress = goliathConfig.dex.routerAddress;
        const dl =
            params.deadline ??
            BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min

        if (params.isNativeIn) {
            // swapExactETHForTokens (native XCN -> ERC-20)
            await writeContractAsync({
                address: routerAddress,
                abi: uniswapV2RouterAbi,
                functionName: "swapExactETHForTokens",
                args: [params.amountOutMin, params.path, address, dl],
                value: params.amountIn,
            });
        } else if (params.isNativeOut) {
            // swapExactTokensForETH (ERC-20 -> native XCN)
            await writeContractAsync({
                address: routerAddress,
                abi: uniswapV2RouterAbi,
                functionName: "swapExactTokensForETH",
                args: [
                    params.amountIn,
                    params.amountOutMin,
                    params.path,
                    address,
                    dl,
                ],
            });
        } else {
            // swapExactTokensForTokens (ERC-20 -> ERC-20)
            await writeContractAsync({
                address: routerAddress,
                abi: uniswapV2RouterAbi,
                functionName: "swapExactTokensForTokens",
                args: [
                    params.amountIn,
                    params.amountOutMin,
                    params.path,
                    address,
                    dl,
                ],
            });
        }
    };

    return {
        execute,
        isPending: isPending || isConfirming,
        isSuccess,
        txHash: hash,
        error,
        reset,
    };
}
