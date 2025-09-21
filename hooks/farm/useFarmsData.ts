"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContracts } from "wagmi";
import { Address } from "viem";
import BigNumber from "bignumber.js";

import FARMS, { type FarmConfig } from "@/config/farms";
import { CONTRACTS } from "@/contracts/config";
import erc20Abi from "@/contracts/abis/erc20.json";
import masterChefAbi from "@/contracts/abis/masterChef.json";
import { formatLargeNumber } from "@/utils/format";
import { toBN } from "@/utils/amount";
import { onyxService } from "@/lib/api";
import { STAKING_CONSTANTS } from "@/contracts/config";

export type FarmView = {
    pid: number;
    title: string;
    subtitle: string;
    stakingAPR: string;
    dailyEmission: string;
    totalStaked: string;
    tokenPerSecondWei: string;
    lpStakedTotalWei: string;
};

const buildTitle = (farm: FarmConfig) =>
    `${farm.token.symbol} / ${farm.quoteToken.symbol}`;
const buildSubtitle = (farm: FarmConfig) => `Onyx / ${farm.quoteToken.symbol}`;

const getTokenPrice = (
    onyxData:
        | { markets?: Array<{ underlyingSymbol: string; tokenPrice: string }> }
        | undefined,
    symbol: string
): number => {
    if (symbol === "USDC") return 1;

    const market = onyxData?.markets?.find(
        (m) => m.underlyingSymbol.toLowerCase() === symbol.toLowerCase()
    );

    return market?.tokenPrice ? Number(new BigNumber(market.tokenPrice)) : 0;
};

const calculateTVL = (
    quoteAmountTokens: BigNumber,
    lpRatio: BigNumber
): BigNumber => {
    return quoteAmountTokens.times(new BigNumber(2)).times(lpRatio);
};

export const useFarmsData = () => {
    const { address } = useAccount();

    const { data: onyxData, isLoading: isOnyxLoading } = useQuery({
        queryKey: ["onyx-prices"],
        queryFn: () => onyxService.getXcnData(),
        staleTime: 30000,
        refetchInterval: 30000,
        retry: 3,
        retryDelay: 1000,
    });

    const contracts = useMemo(() => {
        type UseReadContractsArg = NonNullable<
            Parameters<typeof useReadContracts>[0]
        >;
        const calls: unknown[] = [];
        FARMS.forEach((farm) => {
            const lp = farm.lpAddress;
            const token = farm.token.address;
            const quote = farm.quoteToken.address;
            const mc = CONTRACTS.masterChef.address;

            calls.push({
                address: token,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [lp],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: quote,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [lp],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: lp,
                abi: erc20Abi,
                functionName: "totalSupply",
                args: [],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: lp,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [mc],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: mc,
                abi: masterChefAbi,
                functionName: "poolInfo",
                args: [BigInt(farm.pid)],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: mc,
                abi: masterChefAbi,
                functionName: "totalAllocPoint",
                args: [],
                chainId: CONTRACTS.masterChef.chainId,
            });
            calls.push({
                address: mc,
                abi: masterChefAbi,
                functionName: "xcnPerSecond",
                args: [],
                chainId: CONTRACTS.masterChef.chainId,
            });

            if (address) {
                calls.push({
                    address: lp,
                    abi: erc20Abi,
                    functionName: "allowance",
                    args: [address as Address, mc],
                    chainId: CONTRACTS.masterChef.chainId,
                });
                calls.push({
                    address: lp,
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [address as Address],
                    chainId: CONTRACTS.masterChef.chainId,
                });
                calls.push({
                    address: mc,
                    abi: masterChefAbi,
                    functionName: "userInfo",
                    args: [BigInt(farm.pid), address as Address],
                    chainId: CONTRACTS.masterChef.chainId,
                });
                calls.push({
                    address: mc,
                    abi: masterChefAbi,
                    functionName: "pendingXcn",
                    args: [BigInt(farm.pid), address as Address],
                    chainId: CONTRACTS.masterChef.chainId,
                });
            }
        });
        return calls as UseReadContractsArg["contracts"];
    }, [address]);

    const { data, isLoading, isError } = useReadContracts({
        contracts,
        query: {
            refetchOnWindowFocus: false,
        },
    });

    const farms: FarmView[] = useMemo(() => {
        if (!data || isError) {
            return [];
        }

        const views: FarmView[] = [];
        let i = 0;
        FARMS.forEach((farm) => {
            const tokenBalLp = data[i++]?.result as bigint | undefined;
            const quoteBalLp = data[i++]?.result as bigint | undefined;

            const lpTotalSupply = data[i++]?.result as bigint | undefined;
            const lpBalMc = data[i++]?.result as bigint | undefined;
            const poolInfo = data[i++]?.result as
                | {
                      lpToken: Address;
                      allocPoint: bigint;
                      lastRewardTime: bigint;
                      accXcnPerShare: bigint;
                  }
                | undefined;
            const totalAllocPointRes = data[i++]?.result as bigint | undefined;
            const xcnPerSecondRes = data[i++]?.result as bigint | undefined;

            if (address) {
                i += 4;
            }

            if (
                tokenBalLp === undefined ||
                quoteBalLp === undefined ||
                lpTotalSupply === undefined ||
                lpBalMc === undefined ||
                !poolInfo ||
                totalAllocPointRes === undefined ||
                xcnPerSecondRes === undefined
            ) {
                return;
            }

            const allocPointRaw = poolInfo
                ? (poolInfo as unknown as bigint[])[1]
                : 0;
            const allocPoint = BigInt(String(allocPointRaw || 0));
            const totalAllocPoint = totalAllocPointRes ?? BigInt(0);
            const xcnPerSecondWei =
                !xcnPerSecondRes || xcnPerSecondRes === BigInt(0)
                    ? BigInt("200000000000000000")
                    : xcnPerSecondRes;

            const bnLpTotal = toBN(lpTotalSupply);
            const bnLpMc = toBN(lpBalMc);
            const lpRatio = bnLpTotal.isZero()
                ? new BigNumber(0)
                : bnLpMc.div(bnLpTotal);

            const quoteAmountTokens = toBN(quoteBalLp).div(
                new BigNumber(10).pow(farm.quoteToken.decimals)
            );

            const poolWeight = toBN(allocPoint).div(toBN(totalAllocPoint));
            const tokensPerSecondForPool =
                toBN(xcnPerSecondWei).times(poolWeight);

            const xcnUsd = getTokenPrice(onyxData, "XCN");

            const quoteSymbol =
                farm.quoteToken.symbol === "WETH"
                    ? "ETH"
                    : farm.quoteToken.symbol;
            const quoteUsd = getTokenPrice(onyxData, quoteSymbol);

            const lpTotalInQuoteToken = calculateTVL(
                quoteAmountTokens,
                lpRatio
            );

            const tvlUsd = lpTotalInQuoteToken.times(quoteUsd);

            let effectiveTokenPerSecond = tokensPerSecondForPool;
            if (onyxData?.dailyXcn && String(onyxData.dailyXcn) !== "0") {
                const dailyXcnWei = new BigNumber(onyxData.dailyXcn);
                effectiveTokenPerSecond = dailyXcnWei
                    .div(STAKING_CONSTANTS.SECONDS_PER_DAY)
                    .times(poolWeight);
            }

            const yearlyTokens = effectiveTokenPerSecond
                .times(STAKING_CONSTANTS.SECONDS_PER_DAY)
                .times(STAKING_CONSTANTS.DAYS_PER_YEAR)
                .div(new BigNumber(10).pow(18));

            const apr = tvlUsd.isZero()
                ? new BigNumber(0)
                : yearlyTokens.times(xcnUsd).div(tvlUsd).times(100);

            const dailyTokens = effectiveTokenPerSecond
                .times(STAKING_CONSTANTS.SECONDS_PER_DAY)
                .div(new BigNumber(10).pow(18));

            const stakingAPR = `${apr.isFinite() ? apr.toFixed(2) : "0.00"}%`;
            const dailyEmission = formatLargeNumber(dailyTokens.toNumber(), 2);
            const lpStakedTokens = toBN(lpBalMc).div(new BigNumber(10).pow(18));
            const totalStaked = `${formatLargeNumber(
                lpStakedTokens.toNumber(),
                2
            )} ($${formatLargeNumber(tvlUsd.toNumber(), 2)})`;

            views.push({
                pid: farm.pid,
                title: buildTitle(farm),
                subtitle: buildSubtitle(farm),
                stakingAPR,
                dailyEmission,
                totalStaked,
                tokenPerSecondWei: effectiveTokenPerSecond.toFixed(0),
                lpStakedTotalWei: lpBalMc.toString(),
            });
        });

        return views;
    }, [data, isError, address, onyxData]);

    return {
        farms,
        isLoading: isLoading || isOnyxLoading,
    };
};

export default useFarmsData;
