"use client";

import { useReadContract } from "wagmi";
import { erc20Abi, type Address } from "viem";

/**
 * Reads the current ERC-20 allowance granted by `ownerAddress` to
 * `spenderAddress` (typically the bridge contract).
 *
 * When `tokenAddress` is `null` the token is native (ETH on source,
 * XCN on Goliath) and no allowance is needed -- the query is disabled
 * and `hasAllowance` always returns `true`.
 */
export function useBridgeAllowance(
    tokenAddress: Address | null,
    ownerAddress: Address | undefined,
    spenderAddress: Address,
    chainId: number,
) {
    const { data: allowance, refetch } = useReadContract({
        address: tokenAddress!,
        abi: erc20Abi,
        functionName: "allowance",
        args: [ownerAddress!, spenderAddress],
        chainId,
        query: {
            enabled: !!tokenAddress && !!ownerAddress,
        },
    });

    return {
        /** Raw allowance value -- `0n` when the query is disabled or loading. */
        allowance: allowance ?? 0n,
        /**
         * Returns `true` when the current allowance is sufficient for `amount`.
         * Native tokens (no `tokenAddress`) always return `true`.
         */
        hasAllowance: (amount: bigint) =>
            !tokenAddress || (allowance ?? 0n) >= amount,
        /** Re-fetch the allowance (e.g. after an approval tx confirms). */
        refetch,
    };
}
