export interface StakingSnapshot {
    staked: bigint;
    rewards: bigint;
    walletXcn: bigint;
    allowance: bigint;
    isLoading: boolean;
    error: string | null;
}

export type MigrationStep =
    | "CLAIM_REWARDS"
    | "APPROVE"
    | "UNSTAKE"
    | "BRIDGE";

export type StepExecutionStatus =
    | "IDLE"
    | "WAITING_SIGNATURE"
    | "TX_PENDING"
    | "CONFIRMED"
    | "FAILED";

export interface StepExecution {
    status: StepExecutionStatus;
    txHash: string | null;
    error: string | null;
}

export interface MigrationPreferences {
    stakeOnGoliath: boolean;
    isToggleLocked: boolean;
}

export interface PendingMigration {
    originTxHash: string;
    intentId: string;
    stakeOnGoliath: boolean;
    timestamp: number;
}
