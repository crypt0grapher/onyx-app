"use client";

import { useAccount, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/config/wagmi";
import { UNISWAP } from "@/contracts";
import uniSwapRouterAbi from "@/contracts/abis/uniSwapRouter";

type ExecuteParams = {
    path: `0x${string}`[];
    deadlineSec: number;
    amountInWei?: bigint;
    minimumAmountOutWei?: bigint;
    amountOutWei?: bigint;
    maximumAmountInWei?: bigint;
    valueWei?: bigint;
    to: `0x${string}`;
};

export const useExecuteSwap = () => {
    const { chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const execExactInHash = async ({
        path,
        deadlineSec,
        amountInWei,
        minimumAmountOutWei,
        valueWei,
        to,
    }: ExecuteParams) => {
        const isEthIn = !!valueWei && valueWei > BigInt(0);
        const functionName = isEthIn
            ? "swapExactETHForTokens"
            : path[path.length - 1] === UNISWAP.weth
            ? "swapExactTokensForETH"
            : "swapExactTokensForTokens";

        const args = isEthIn
            ? [minimumAmountOutWei!, path, to, BigInt(deadlineSec)]
            : [
                  amountInWei!,
                  minimumAmountOutWei!,
                  path,
                  to,
                  BigInt(deadlineSec),
              ];

        const hash = await writeContractAsync({
            address: UNISWAP.router.address,
            abi: uniSwapRouterAbi,
            functionName,
            args,
            chainId,
            value: isEthIn ? valueWei : undefined,
        });
        return hash;
    };

    const execExactIn = async ({
        path,
        deadlineSec,
        amountInWei,
        minimumAmountOutWei,
        valueWei,
        to,
    }: ExecuteParams) => {
        const isEthIn = !!valueWei && valueWei > BigInt(0);
        const functionName = isEthIn
            ? "swapExactETHForTokens"
            : path[path.length - 1] === UNISWAP.weth
            ? "swapExactTokensForETH"
            : "swapExactTokensForTokens";

        const args = isEthIn
            ? [minimumAmountOutWei!, path, to, BigInt(deadlineSec)]
            : [
                  amountInWei!,
                  minimumAmountOutWei!,
                  path,
                  to,
                  BigInt(deadlineSec),
              ];

        const hash = await writeContractAsync({
            address: UNISWAP.router.address,
            abi: uniSwapRouterAbi,
            functionName,
            args,
            chainId,
            value: isEthIn ? valueWei : undefined,
        });
        return waitForTransactionReceipt(wagmiConfig, { hash });
    };

    const execExactOutHash = async ({
        path,
        deadlineSec,
        amountOutWei,
        maximumAmountInWei,
        valueWei,
        to,
    }: ExecuteParams) => {
        const isEthIn = !!valueWei && valueWei > BigInt(0);
        const isEthOut = path[path.length - 1] === UNISWAP.weth;

        let functionName:
            | "swapETHForExactTokens"
            | "swapTokensForExactETH"
            | "swapTokensForExactTokens";
        let args:
            | readonly [bigint, `0x${string}`[], `0x${string}`, bigint]
            | readonly [bigint, bigint, `0x${string}`[], `0x${string}`, bigint];
        let value: bigint | undefined = undefined;

        if (isEthIn) {
            functionName = "swapETHForExactTokens";
            args = [amountOutWei!, path, to, BigInt(deadlineSec)];
            value = maximumAmountInWei;
        } else if (isEthOut) {
            functionName = "swapTokensForExactETH";
            args = [
                amountOutWei!,
                maximumAmountInWei!,
                path,
                to,
                BigInt(deadlineSec),
            ];
        } else {
            functionName = "swapTokensForExactTokens";
            args = [
                amountOutWei!,
                maximumAmountInWei!,
                path,
                to,
                BigInt(deadlineSec),
            ];
        }

        const hash = await writeContractAsync({
            address: UNISWAP.router.address,
            abi: uniSwapRouterAbi,
            functionName,
            args,
            chainId,
            value,
        });
        return hash;
    };

    const execExactOut = async ({
        path,
        deadlineSec,
        amountOutWei,
        maximumAmountInWei,
        valueWei,
        to,
    }: ExecuteParams) => {
        const isEthIn = !!valueWei && valueWei > BigInt(0);
        const isEthOut = path[path.length - 1] === UNISWAP.weth;

        let functionName:
            | "swapETHForExactTokens"
            | "swapTokensForExactETH"
            | "swapTokensForExactTokens";
        let args:
            | readonly [bigint, `0x${string}`[], `0x${string}`, bigint]
            | readonly [bigint, bigint, `0x${string}`[], `0x${string}`, bigint];
        let value: bigint | undefined = undefined;

        if (isEthIn) {
            functionName = "swapETHForExactTokens";
            args = [amountOutWei!, path, to, BigInt(deadlineSec)];
            value = maximumAmountInWei;
        } else if (isEthOut) {
            functionName = "swapTokensForExactETH";
            args = [
                amountOutWei!,
                maximumAmountInWei!,
                path,
                to,
                BigInt(deadlineSec),
            ];
        } else {
            functionName = "swapTokensForExactTokens";
            args = [
                amountOutWei!,
                maximumAmountInWei!,
                path,
                to,
                BigInt(deadlineSec),
            ];
        }

        const hash = await writeContractAsync({
            address: UNISWAP.router.address,
            abi: uniSwapRouterAbi,
            functionName,
            args,
            chainId,
            value,
        });
        return waitForTransactionReceipt(wagmiConfig, { hash });
    };

    return { execExactIn, execExactOut, execExactInHash, execExactOutHash };
};

export default useExecuteSwap;
