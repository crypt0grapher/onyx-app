import { BaseApiService } from "../base";
import { BRIDGE_CONFIG } from "../config";
import { ApiError } from "../types";

// ---------------------------------------------------------------------------
// Bridge types
// ---------------------------------------------------------------------------

export type BridgeStatus =
    | "PENDING_ORIGIN_TX"
    | "CONFIRMING"
    | "AWAITING_RELAY"
    | "PROCESSING_DESTINATION"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | "DELAYED";

export type BridgeDirection = "SOURCE_TO_GOLIATH" | "GOLIATH_TO_SOURCE";

export type BridgeTokenSymbol = "ETH" | "USDC" | "XCN";

export interface BridgeStatusResponse {
    operationId: string;
    direction: BridgeDirection;
    status: BridgeStatus;
    token: BridgeTokenSymbol;
    amount: string;
    amountFormatted: string;
    sender: string;
    recipient: string;
    originChainId: number;
    destinationChainId: number;
    originTxHash: string | null;
    destinationTxHash: string | null;
    originConfirmations: number;
    requiredConfirmations: number;
    timestamps: {
        depositedAt: string | null;
        finalizedAt: string | null;
        destinationSubmittedAt: string | null;
        completedAt: string | null;
    };
    estimatedCompletionTime: string | null;
    error: string | null;
    isSameWallet: boolean;
}

export interface BridgeHistoryResponse {
    operations: BridgeStatusResponse[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface BridgeHealthResponse {
    status: "healthy" | "unhealthy";
    version: string;
    chains: {
        sepolia: {
            connected: boolean;
            lastBlock: number;
            lastProcessedBlock: number;
            lag: number;
        };
        goliath: {
            connected: boolean;
            lastBlock: number;
            lastProcessedBlock: number;
            lag: number;
        };
    };
    relayer: {
        pendingOperations: number;
        lastProcessedAt: string;
    };
}

export interface FeeQuoteResponse {
    inputAmount: string;
    inputFormatted: string;
    feeAmount: string;
    feeFormatted: string;
    feeBps: number;
    outputAmount: string;
    outputFormatted: string;
    token: string;
}

export interface TokenLimits {
    minAmount: string;
    minAmountFormatted: string;
    minFee: string;
    minFeeFormatted: string;
}

export interface DirectionLimits {
    feeBps: number;
    tokens: Record<string, TokenLimits>;
}

export interface LimitsResponse {
    goliathToSepolia: DirectionLimits;
    sepoliaToGoliath: DirectionLimits;
}

export interface XcnWithdrawIntentResponse {
    intentId: string;
    relayerWalletAddress: string;
    expiresAt: string;
}

export interface BindXcnWithdrawResponse {
    intentId: string;
    originTxHash: string;
}

// ---------------------------------------------------------------------------
// Request param types
// ---------------------------------------------------------------------------

export interface BridgeStatusParams {
    originTxHash?: string;
    depositId?: string;
    withdrawId?: string;
}

export interface BridgeHistoryParams {
    address: string;
    limit?: number;
    offset?: number;
    status?: BridgeStatus;
    direction?: BridgeDirection;
}

export interface XcnWithdrawIntentParams {
    senderAddress: string;
    recipientAddress: string;
    amountAtomic: string;
    idempotencyKey: string;
    deadline: number;
    nonce: string;
    signature: string;
}

export interface BindXcnWithdrawParams {
    intentId: string;
    senderAddress: string;
    originTxHash: string;
}

export interface FeeQuoteParams {
    token: string;
    amount: string;
    direction: string;
}

// ---------------------------------------------------------------------------
// Root discovery response (for capability checks)
// ---------------------------------------------------------------------------

interface RootDiscoveryResponse {
    endpoints?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class BridgeApiService extends BaseApiService {
    private readonly rootUrl: string;

    constructor() {
        super(BRIDGE_CONFIG.BASE_URL);
        this.rootUrl = BRIDGE_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "/");
    }

    /**
     * Fetch the status of a bridge operation by origin tx hash, deposit ID,
     * or withdraw ID. Returns `null` when the operation is not found (404).
     */
    async getStatus(
        params: BridgeStatusParams,
    ): Promise<BridgeStatusResponse | null> {
        const queryParams: Record<string, string> = {};

        if (params.originTxHash) {
            queryParams.originTxHash = params.originTxHash;
        }
        if (params.depositId) {
            queryParams.depositId = params.depositId;
        }
        if (params.withdrawId) {
            queryParams.withdrawId = params.withdrawId;
        }

        const url = this.buildUrl("/bridge/status", queryParams);

        try {
            return await this.get<BridgeStatusResponse>(url, {
                timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
            });
        } catch (error) {
            if (error instanceof ApiError && error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Fetch bridge operation history for a given wallet address.
     */
    async getHistory(
        params: BridgeHistoryParams,
    ): Promise<BridgeHistoryResponse> {
        const queryParams: Record<string, string | number> = {
            address: params.address,
        };

        if (params.limit !== undefined) {
            queryParams.limit = params.limit;
        }
        if (params.offset !== undefined) {
            queryParams.offset = params.offset;
        }
        if (params.status) {
            queryParams.status = params.status;
        }
        if (params.direction) {
            queryParams.direction = params.direction;
        }

        const url = this.buildUrl("/bridge/history", queryParams);

        return this.get<BridgeHistoryResponse>(url, {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }

    /**
     * Check bridge relayer health.
     */
    async getHealth(): Promise<BridgeHealthResponse> {
        const url = this.buildUrl("/health");

        return this.get<BridgeHealthResponse>(url, {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }

    /**
     * Register an intent to withdraw XCN through the bridge.
     */
    async registerXcnWithdrawIntent(
        params: XcnWithdrawIntentParams,
    ): Promise<XcnWithdrawIntentResponse> {
        return this.post<XcnWithdrawIntentResponse>(
            "/bridge/xcn-withdraw-intent",
            params,
            { timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT },
        );
    }

    /**
     * Bind an origin transaction hash to an existing XCN withdraw intent.
     */
    async bindXcnWithdrawOrigin(
        params: BindXcnWithdrawParams,
    ): Promise<BindXcnWithdrawResponse> {
        return this.post<BindXcnWithdrawResponse>(
            "/bridge/xcn-withdraw-intent/bind-origin",
            params,
            { timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT },
        );
    }

    /**
     * Get a fee quote for a bridge transfer.
     */
    async getFeeQuote(params: FeeQuoteParams): Promise<FeeQuoteResponse> {
        const url = this.buildUrl("/bridge/fee-quote", {
            token: params.token,
            amount: params.amount,
            direction: params.direction,
        });

        return this.get<FeeQuoteResponse>(url, {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }

    /**
     * Fetch current bridge transfer limits for all tokens and directions.
     */
    async getLimits(): Promise<LimitsResponse> {
        const url = this.buildUrl("/bridge/limits");

        return this.get<LimitsResponse>(url, {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }

    /**
     * Returns `true` when the bridge is paused or unreachable.
     */
    async isPaused(): Promise<boolean> {
        try {
            const health = await this.getHealth();
            return health.status !== "healthy";
        } catch {
            return true;
        }
    }

    /**
     * Probe the root discovery endpoint to check whether XCN withdraw
     * capability (intent + bind-origin) is available on the relayer.
     */
    async checkXcnWithdrawCapability(): Promise<boolean> {
        try {
            const response = await this.fetchWithTimeout(this.rootUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
            });

            const data = (await response.json()) as RootDiscoveryResponse;

            if (!data.endpoints) {
                return false;
            }

            return (
                "xcnWithdrawIntent" in data.endpoints &&
                "xcnWithdrawBindOrigin" in data.endpoints
            );
        } catch {
            return false;
        }
    }
}

export const bridgeApiService = new BridgeApiService();
