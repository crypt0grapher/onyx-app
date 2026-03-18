/**
 * ABI for the CHNStaking contract (Sepolia).
 * Used for the migration feature to read staked positions and withdraw.
 *
 * Functions:
 *   - userInfo(pid, user)         -- staked amount, reward debt, pending reward per pool
 *   - pendingReward(pid, user)    -- outstanding unclaimed rewards
 *   - withdraw(pid, amount)       -- unstake tokens from a pool
 *   - getStakingAmount(pid, user) -- convenience read for staked amount
 */
export const chnStakingAbi = [
  {
    inputs: [
      { name: 'pid', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'userInfo',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'rewardDebt', type: 'uint256' },
      { name: 'pendingTokenReward', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_pid', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    name: 'pendingReward',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_pid', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'pid', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'getStakingAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
