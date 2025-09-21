"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { UNISWAP } from "@/contracts";
import uniSwapRouterAbi from "@/contracts/abis/uniSwapRouter";

type Params = {
    path: `0x${string}`[];
    amountInWei?: bigint;
    amountOutWei?: bigint;
};

export const useSwapQuote = ({ path, amountInWei, amountOutWei }: Params) => {
    const chainId = UNISWAP.router.chainId;
    const isExactIn =
        typeof amountInWei === "bigint" && amountInWei > BigInt(0);
    const isExactOut =
        typeof amountOutWei === "bigint" && amountOutWei > BigInt(0);

    const getOut = useReadContract({
        address: UNISWAP.router.address,
        abi: uniSwapRouterAbi,
        functionName: "getAmountsOut",
        args: isExactIn ? [amountInWei!, path] : undefined,
        chainId,
        query: { enabled: isExactIn },
    });

    const getIn = useReadContract({
        address: UNISWAP.router.address,
        abi: uniSwapRouterAbi,
        functionName: "getAmountsIn",
        args: isExactOut ? [amountOutWei!, path] : undefined,
        chainId,
        query: { enabled: isExactOut },
    });

    return useMemo(() => ({ getOut, getIn }), [getOut, getIn]);
};

export default useSwapQuote;
