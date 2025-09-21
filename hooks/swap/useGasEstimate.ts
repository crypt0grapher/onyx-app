"use client";

import { useMemo } from "react";
import { Address, encodeFunctionData, formatEther, type Abi } from "viem";
import { useAccount, useEstimateGas, useEstimateFeesPerGas } from "wagmi";
import { UNISWAP } from "@/contracts";
import uniSwapRouterAbi from "@/contracts/abis/uniSwapRouter";

type GasEstimateExactIn = {
    direction: "exactIn";
    path: Address[];
    amountInWei: bigint;
    minimumAmountOutWei: bigint;
    deadlineSec: number;
    ethUsdPrice: number;
    to?: Address;
    fromAddress?: Address;
};

type GasEstimateExactOut = {
    direction: "exactOut";
    path: Address[];
    amountOutWei: bigint;
    maximumAmountInWei: bigint;
    deadlineSec: number;
    ethUsdPrice: number;
    to?: Address;
    fromAddress?: Address;
};

type GasEstimateParams = GasEstimateExactIn | GasEstimateExactOut;

export const useGasEstimate = (params: GasEstimateParams | null) => {
    const { address: accountAddress } = useAccount();
    const FALLBACK_SIM_ADDRESS =
        "0x000000000000000000000000000000000000dEaD" as Address;

    const calldata = useMemo(() => {
        if (!params) return null;
        const { path, deadlineSec, fromAddress, to } =
            params as GasEstimateParams;
        const toAddress = (to ||
            accountAddress ||
            FALLBACK_SIM_ADDRESS) as Address;

        let functionName:
            | "swapExactETHForTokens"
            | "swapExactTokensForETH"
            | "swapExactTokensForTokens"
            | "swapETHForExactTokens"
            | "swapTokensForExactETH"
            | "swapTokensForExactTokens";
        let args:
            | readonly [bigint, Address[], Address, bigint]
            | readonly [bigint, bigint, Address[], Address, bigint];
        let value: bigint | undefined = undefined;

        const isEthIn = !fromAddress;
        const isEthOut = path[path.length - 1] === UNISWAP.weth;

        if (params.direction === "exactIn") {
            const amountInWei = (params as GasEstimateExactIn).amountInWei;
            const minimumAmountOutWei = (params as GasEstimateExactIn)
                .minimumAmountOutWei;
            if (isEthIn) {
                functionName = "swapExactETHForTokens";
                args = [
                    minimumAmountOutWei,
                    path,
                    toAddress,
                    BigInt(deadlineSec),
                ];
                value = amountInWei;
            } else if (isEthOut) {
                functionName = "swapExactTokensForETH";
                args = [
                    amountInWei,
                    minimumAmountOutWei,
                    path,
                    toAddress,
                    BigInt(deadlineSec),
                ];
            } else {
                functionName = "swapExactTokensForTokens";
                args = [
                    amountInWei,
                    minimumAmountOutWei,
                    path,
                    toAddress,
                    BigInt(deadlineSec),
                ];
            }
        } else {
            const amountOutWei = (params as GasEstimateExactOut).amountOutWei;
            const maximumAmountInWei = (params as GasEstimateExactOut)
                .maximumAmountInWei;
            if (isEthIn) {
                functionName = "swapETHForExactTokens";
                args = [amountOutWei, path, toAddress, BigInt(deadlineSec)];
                value = maximumAmountInWei;
            } else if (isEthOut) {
                functionName = "swapTokensForExactETH";
                args = [
                    amountOutWei,
                    maximumAmountInWei,
                    path,
                    toAddress,
                    BigInt(deadlineSec),
                ];
            } else {
                functionName = "swapTokensForExactTokens";
                args = [
                    amountOutWei,
                    maximumAmountInWei,
                    path,
                    toAddress,
                    BigInt(deadlineSec),
                ];
            }
        }

        return {
            data: encodeFunctionData({
                abi: uniSwapRouterAbi as Abi,
                functionName,
                args: args as unknown as
                    | readonly [bigint, Address[], Address, bigint]
                    | readonly [bigint, bigint, Address[], Address, bigint],
            }),
            value,
        };
    }, [params, accountAddress]);

    const gasLimit = useEstimateGas({
        account: (accountAddress || FALLBACK_SIM_ADDRESS) as Address,
        to: UNISWAP.router.address,
        data: calldata?.data,
        value: calldata?.value,
        query: { enabled: !!calldata },
    });

    const feesPerGas = useEstimateFeesPerGas({
        query: { enabled: true },
    });

    const gasFeeUsd = useMemo(() => {
        if (!params || !calldata) return null;
        if (params.ethUsdPrice <= 0) return null;

        const limit = gasLimit.data as bigint | undefined;
        const maxFeePerGas = feesPerGas.data?.maxFeePerGas;
        if (!limit || !maxFeePerGas) return null;

        const bufferedLimit = (limit * BigInt(120)) / BigInt(100);

        const totalWei = bufferedLimit * maxFeePerGas;
        const feeEth = Number(formatEther(totalWei));
        return feeEth * params.ethUsdPrice;
    }, [params, calldata, gasLimit.data, feesPerGas.data?.maxFeePerGas]);

    return gasFeeUsd;
};

export default useGasEstimate;
