"use client";

import { useMemo, useCallback } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { type Token } from "@/config/swap";
import { SWAP_TOKENS, type SwapTokenSymbol } from "@/config/swapTokens";
import erc20Abi from "@/contracts/abis/xcnToken.json";
import { formatTokenBalance } from "@/utils/format";
import { Address, type Abi } from "viem";

export const useBalances = (tokens: Token[]) => {
    const { address: accountAddress } = useAccount();

    const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
        address: accountAddress,
        chainId: 1,
        query: {
            enabled: !!accountAddress && tokens.some((t) => t.symbol === "ETH"),
            refetchOnWindowFocus: false,
        },
    });

    const tokenContracts = useMemo(() => {
        if (!accountAddress) return [];
        return tokens
            .filter((t) => t.symbol !== "ETH")
            .map((t) => {
                const tokenInfo = SWAP_TOKENS[t.symbol as SwapTokenSymbol];
                const address = (tokenInfo as { address?: Address }).address;
                if (!address) return null;
                return {
                    address,
                    abi: erc20Abi as Abi,
                    functionName: "balanceOf",
                    args: [accountAddress],
                    symbol: t.symbol,
                    chainId: 1,
                };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);
    }, [tokens, accountAddress]);

    const {
        data: tokenBalances,
        isFetching,
        refetch: refetchTokenBalances,
    } = useReadContracts({
        contracts: tokenContracts,
        query: {
            enabled: !!accountAddress && tokenContracts.length > 0,
            refetchOnWindowFocus: false,
        },
    });

    const balances = useMemo(() => {
        const balancesMap: Record<string, string> = {};

        if (nativeBalance) {
            balancesMap["ETH"] = formatTokenBalance(nativeBalance.value, 18, 5);
        }

        tokenContracts.forEach((contract, index) => {
            const balanceResult = tokenBalances?.[index];
            if (balanceResult?.status === "success") {
                const decimals =
                    SWAP_TOKENS[contract.symbol as SwapTokenSymbol].decimals;
                balancesMap[contract.symbol] = formatTokenBalance(
                    balanceResult.result as bigint,
                    decimals,
                    5
                );
            } else {
                if (!isFetching) {
                    balancesMap[contract.symbol] = "0";
                }
            }
        });

        return balancesMap;
    }, [nativeBalance, tokenBalances, tokenContracts, isFetching]);

    const refetchBalances = useCallback(async () => {
        await Promise.all([refetchNativeBalance(), refetchTokenBalances()]);
    }, [refetchNativeBalance, refetchTokenBalances]);

    return {
        balances,
        refetchBalances,
    };
};

export default useBalances;
