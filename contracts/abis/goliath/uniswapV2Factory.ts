/**
 * ABI for Uniswap V2 Factory contract (Goliath fork).
 *
 * Functions:
 *   - getPair(tokenA, tokenB) -- returns the pair address for two tokens
 *   - allPairsLength()        -- returns total number of pairs created
 */
export const uniswapV2FactoryAbi = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allPairsLength',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
