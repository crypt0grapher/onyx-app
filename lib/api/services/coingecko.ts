import { BaseApiService } from "../base";
import { API_CONFIG, ENDPOINTS, COINGECKO_CONFIG } from "../config";
import {
    type ApiOptions,
    type CoinGeckoSimplePriceResponse,
    type CoinGeckoCoinData,
    type HistoricalPriceData,
    ParseError,
} from "../types";

export class CoinGeckoService extends BaseApiService {
    constructor() {
        super(API_CONFIG.COINGECKO_BASE_URL);
    }

    async getCurrentPrice(
        symbol: string,
        vsCurrency: string = "usd",
        options: ApiOptions = {}
    ): Promise<number> {
        const tokenId = this.getTokenId(symbol);

        const response = await this.get<CoinGeckoSimplePriceResponse>(
            this.buildUrl(ENDPOINTS.COINGECKO_SIMPLE_PRICE, {
                ids: tokenId,
                vs_currencies: vsCurrency,
            }),
            options
        );

        const tokenData = response[tokenId];
        if (!tokenData) {
            throw new ParseError(`Token data not found for ${symbol}`);
        }

        const price = tokenData[vsCurrency as keyof typeof tokenData] as number;
        if (typeof price !== "number" || !Number.isFinite(price)) {
            throw new ParseError(`Invalid price data for ${symbol}: ${price}`);
        }

        return price;
    }

    async getHistoricalPrice(
        symbol: string,
        vsCurrency: string = "usd",
        options: ApiOptions = {}
    ): Promise<HistoricalPriceData> {
        const tokenId = this.getTokenId(symbol);

        const response = await this.get<CoinGeckoSimplePriceResponse>(
            this.buildUrl(ENDPOINTS.COINGECKO_SIMPLE_PRICE, {
                ids: tokenId,
                vs_currencies: vsCurrency,
                include_24hr_change: "true",
            }),
            options
        );

        const tokenData = response[tokenId];
        if (!tokenData) {
            throw new ParseError(`Token data not found for ${symbol}`);
        }

        const currentPrice = tokenData[
            vsCurrency as keyof typeof tokenData
        ] as number;
        const change24h = tokenData[
            `${vsCurrency}_24h_change` as keyof typeof tokenData
        ] as number;

        if (
            typeof currentPrice !== "number" ||
            !Number.isFinite(currentPrice)
        ) {
            throw new ParseError(
                `Invalid price data for ${symbol}: ${currentPrice}`
            );
        }

        return {
            current: currentPrice,
            change24hPct:
                typeof change24h === "number" && Number.isFinite(change24h)
                    ? change24h
                    : null,
        };
    }

    async getDetailedTokenData(
        symbol: string,
        options: ApiOptions = {}
    ): Promise<CoinGeckoCoinData> {
        const tokenId = this.getTokenId(symbol);

        const response = await this.get<CoinGeckoCoinData>(
            this.buildUrl(`${ENDPOINTS.COINGECKO_COINS}/${tokenId}`, {
                localization: "false",
                tickers: "false",
                market_data: "true",
                community_data: "false",
                developer_data: "false",
                sparkline: "false",
            }),
            options
        );

        return response;
    }

    private getTokenId(symbol: string): string {
        const symbolUpper =
            symbol.toUpperCase() as keyof typeof COINGECKO_CONFIG.TOKEN_IDS;
        const tokenId = COINGECKO_CONFIG.TOKEN_IDS[symbolUpper];

        if (!tokenId) {
            throw new ParseError(`Token ID not found for symbol: ${symbol}`);
        }

        return tokenId;
    }
}
