import { BaseApiService } from "../base";
import { BRIDGE_CONFIG } from "../config";
import { ApiError } from "../types";
import type { BridgeStatus, BridgeDirection, BridgeTokenSymbol } from "./bridge";

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface SubmitStakePreferenceRequest {
    senderAddress: string;
    recipientAddress: string;
    amountAtomic: string;
    stakeOnGoliath: boolean;
    idempotencyKey: string;
    deadline: number;
    nonce: string;
    signature: string;
}

export interface BindOriginTxHashRequest {
    intentId: string;
    senderAddress: string;
    originTxHash: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface SubmitStakePreferenceResponse {
    intentId: string;
    senderAddress: string;
    stakeOnGoliath: boolean;
    expiresAt: string;
}

export interface BindOriginTxHashResponse {
    success: boolean;
}

export interface MigrationStatusResponse {
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
    stakeOnGoliath?: boolean;
    stakingTxHash?: string | null;
    stakingError?: string | null;
}

export interface MigrationStatsResponse {
    totalMigrations: number;
    totalAmountMigrated: string;
    totalStaked: number;
    totalUnstaked: number;
    activeMigrations: number;
}

export interface MigrationHistoryResponse {
    operations: MigrationStatusResponse[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class MigrationApiService extends BaseApiService {
    constructor() {
        super(BRIDGE_CONFIG.BASE_URL);
    }

    /**
     * Submit a stake preference for a migration operation. The preference
     * indicates whether tokens should be auto-staked on Goliath after bridging.
     */
    async submitStakePreference(
        payload: SubmitStakePreferenceRequest,
    ): Promise<SubmitStakePreferenceResponse> {
        return this.post<SubmitStakePreferenceResponse>(
            "/migration/stake-preference",
            payload,
            { timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT },
        );
    }

    /**
     * Bind an origin transaction hash to a previously submitted stake
     * preference intent, so the relayer can track the on-chain deposit.
     */
    async bindOriginTxHash(
        payload: BindOriginTxHashRequest,
    ): Promise<BindOriginTxHashResponse> {
        return this.post<BindOriginTxHashResponse>(
            "/migration/stake-preference/bind-origin",
            payload,
            { timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT },
        );
    }

    /**
     * Fetch the status of a migration operation by its origin transaction hash.
     * Returns `null` when the operation is not found (404).
     */
    async getMigrationStatus(
        originTxHash: string,
    ): Promise<MigrationStatusResponse | null> {
        const url = this.buildUrl("/bridge/status", { originTxHash });

        try {
            return await this.get<MigrationStatusResponse>(url, {
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
     * Fetch aggregate migration statistics (total count, amounts, staked vs
     * unstaked breakdown, active migrations).
     */
    async getMigrationStats(): Promise<MigrationStatsResponse> {
        return this.get<MigrationStatsResponse>("/migration/stats", {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }

    /**
     * Fetch paginated migration history for a given wallet address.
     */
    async getMigrationHistory(
        address: string,
        limit: number = 10,
        offset: number = 0,
    ): Promise<MigrationHistoryResponse> {
        const url = this.buildUrl("/migration/history", {
            address,
            limit,
            offset,
        });

        return this.get<MigrationHistoryResponse>(url, {
            timeoutMs: BRIDGE_CONFIG.DEFAULT_TIMEOUT,
        });
    }
}

export const migrationApiService = new MigrationApiService();
