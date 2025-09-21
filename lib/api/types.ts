export type TokenQuote = {
    symbol: string;
    valueUsd: number;
    change24hPct: number | null;
    updatedAt: string;
    chainId: number;
    source: string;
};

export type HistoricalPriceData = {
    current: number;
    change24hPct: number | null;
};

export type ApiOptions = {
    signal?: AbortSignal;
    timeoutMs?: number;
};

export type CoinGeckoSimplePriceResponse = Record<
    string,
    {
        usd?: number;
        eur?: number;
        btc?: number;
        eth?: number;
        usd_24h_change?: number;
        usd_7d_change?: number;
        usd_30d_change?: number;
        [key: string]: number | undefined;
    }
>;

export type CoinGeckoCoinData = {
    id: string;
    symbol: string;
    name: string;
    market_data: {
        current_price: {
            [currency: string]: number;
        };
        price_change_percentage_24h?: number;
        price_change_percentage_7d?: number;
        price_change_percentage_30d?: number;
    };
    last_updated: string;
};

export interface OnyxMarket {
    underlyingSymbol: string;
    underlyingDecimal: number;
    tokenPrice: string;
    liquidity: string;
    borrowXcnApy: string;
    borrowApy: string;
    supplyXcnApy: string;
    supplyApy: string;
    totalBorrowsUsd: string;
    totalSupplyUsd: string;
}

export interface OnyxXcnResponse {
    dailyXcn: number;
    xcnRate: string;
    reserves: number;
    markets: OnyxMarket[];
    request: {
        addresses: string[];
    };
}

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: Response
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export class NetworkError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = "NetworkError";
    }
}

export class ParseError extends Error {
    constructor(message: string, public data?: unknown) {
        super(message);
        this.name = "ParseError";
    }
}
