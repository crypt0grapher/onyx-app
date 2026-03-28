export interface GoliathProtocolData {
  totalSupply: bigint;
  cumulativeIndex: bigint; // Ray (27 decimals)
  rewardRateRay: bigint; // Ray (27 decimals)
  feePercentBps: number; // Basis points
  lastUpdateTimestamp: number;
  isPaused: boolean;
  contractBalance: bigint; // Native XCN held by contract
}

export interface GoliathUserData {
  stXcnBalance: bigint;
  scaledBalance: bigint;
  underlyingXcn: bigint; // Estimated XCN value
}

export const RAY = 10n ** 27n;
export const WAD = 10n ** 18n;
export const BPS_BASE = 10000n;
export const SECONDS_PER_YEAR = 31536000n;
