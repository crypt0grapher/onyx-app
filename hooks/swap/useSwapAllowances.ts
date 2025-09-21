"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { UNISWAP } from "@/contracts";
import erc20Abi from "@/contracts/abis/xcnToken.json";

export const useSwapAllowances = (tokenAddress?: `0x${string}`) => {
    const { address, chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args:
            address && tokenAddress
                ? [address, UNISWAP.router.address]
                : undefined,
        query: { enabled: !!address && !!tokenAddress },
    });

    const approveAsync = async (amountWei?: bigint) => {
        if (!tokenAddress) return null as unknown as `0x${string}`;

        const approvalAmount =
            amountWei ||
            BigInt(
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            );

        const hash = await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [UNISWAP.router.address, approvalAmount],
            chainId,
        });
        return hash;
    };

    return {
        allowance: { data: allowanceData },
        approveAsync,
        refetchAllowance,
    };
};

export default useSwapAllowances;
