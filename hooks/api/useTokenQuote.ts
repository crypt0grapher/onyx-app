"use client";

import useSWR from "swr";
import { CoinGeckoService, type TokenQuote } from "@/lib/api";
import { SUPPORTED_CHAINS } from "@/contracts/config";

const coinGeckoService = new CoinGeckoService();

export type UseTokenQuoteOptions = {
    enabled?: boolean;
    refreshIntervalMs?: number;
    chainId?: number;
};

const fetcher = async (key: string): Promise<TokenQuote> => {
    const [, symbol, chainId] = key.split("-");

    const { current: price, change24hPct } =
        await coinGeckoService.getHistoricalPrice(symbol, "usd");

    return {
        symbol: symbol.toUpperCase(),
        valueUsd: price,
        change24hPct,
        updatedAt: new Date().toISOString(),
        chainId: Number(chainId),
        source: "coingecko",
    };
};

export const useTokenQuote = (
    symbol: string,
    options?: UseTokenQuoteOptions
) => {
    const enabled = options?.enabled ?? true;
    const refreshInterval = options?.refreshIntervalMs ?? 30_000;
    const chainId = options?.chainId ?? SUPPORTED_CHAINS.mainnet.id;

    const { data, error, isLoading, mutate } = useSWR(
        enabled ? `tokenQuote-${symbol.toUpperCase()}-${chainId}` : null,
        fetcher,
        {
            refreshInterval,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 30_000,
            errorRetryCount: 3,
            errorRetryInterval: 5_000,
        }
    );

    return {
        data,
        error,
        isLoading,
        mutate,
    };
};

export default useTokenQuote;
