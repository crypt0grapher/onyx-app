import { BaseApiService } from "../base";
import { API_CONFIG, ENDPOINTS } from "../config";
import type { OnyxXcnResponse, OnyxMarket } from "../types";

export class OnyxService extends BaseApiService {
    constructor() {
        super(API_CONFIG.ONYX_BASE_URL);
    }

    async getXcnData(): Promise<OnyxXcnResponse> {
        const response = await this.get<{
            data: OnyxXcnResponse;
            status: boolean;
        }>(ENDPOINTS.ONYX_XCN);

        if (response?.data) {
            return response.data;
        }

        throw new Error("Invalid API response structure");
    }

    async getMarkets(): Promise<OnyxMarket[]> {
        const response = await this.getXcnData();
        return response.markets;
    }

    async getTokenPrice(symbol: string): Promise<string | null> {
        const data = await this.getXcnData();
        const market = data.markets.find(
            (m) => m.underlyingSymbol.toLowerCase() === symbol.toLowerCase()
        );
        return market?.tokenPrice || null;
    }

    async getDailyXcn(): Promise<string> {
        const data = await this.getXcnData();
        return String(data.dailyXcn || 0);
    }

    async getFilteredMarkets(): Promise<OnyxMarket[]> {
        const data = await this.getXcnData();
        return data.markets.filter((market) => market.underlyingDecimal !== 0);
    }

    async getXcnPrice(): Promise<string | null> {
        return this.getTokenPrice("XCN");
    }

    async getEthPrice(): Promise<string | null> {
        return this.getTokenPrice("ETH");
    }

    async getWethPrice(): Promise<string | null> {
        return this.getTokenPrice("WETH");
    }

    async getUsdcPrice(): Promise<string | null> {
        return this.getTokenPrice("USDC");
    }
}

export const onyxService = new OnyxService();
