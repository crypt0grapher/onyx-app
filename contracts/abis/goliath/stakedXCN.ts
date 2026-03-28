/**
 * ABI for the StakedXCN (stXCN) contract on Goliath.
 *
 * Functions:
 *   - stake()                    -- payable, sends native XCN to receive stXCN
 *   - unstake(stXCNAmount)       -- burn stXCN to receive native XCN
 *   - balanceOf(account)         -- stXCN balance
 *   - totalSupply()              -- total stXCN supply
 *   - scaledBalanceOf(account)   -- scaled (ray-adjusted) balance
 *   - getCumulativeIndex()       -- cumulative reward index (27 decimals, ray)
 *   - getRewardRate()            -- current reward rate (ray)
 *   - getFeePercent()            -- unstake fee in basis points
 *   - getLastUpdateTimestamp()   -- last reward update timestamp (uint40 on-chain, returns uint256)
 *   - paused()                   -- whether the contract is paused
 *
 * Events:
 *   - Staked(user, xcnAmount, stXCNMinted)
 *   - Unstaked(user, stXCNBurned, xcnReturned)
 */
export const stakedXcnAbi = [
  {
    inputs: [],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stXCNAmount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'scaledBalanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCumulativeIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRewardRate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFeePercent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLastUpdateTimestamp',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'xcnAmount', type: 'uint256' },
      { indexed: false, name: 'stXCNMinted', type: 'uint256' },
    ],
    name: 'Staked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'stXCNBurned', type: 'uint256' },
      { indexed: false, name: 'xcnReturned', type: 'uint256' },
    ],
    name: 'Unstaked',
    type: 'event',
  },
] as const;
