/**
 * ABI for Uniswap V2 Pair contract (Goliath fork).
 *
 * Functions:
 *   - getReserves()  -- returns (reserve0, reserve1, blockTimestampLast)
 *   - token0()       -- address of the first token in the pair
 *   - token1()       -- address of the second token in the pair
 *   - totalSupply()  -- total LP token supply
 */
export const uniswapV2PairAbi = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
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
] as const;
