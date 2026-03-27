/**
 * ABI for the BridgeMint contract deployed on Goliath mainnet (chain 327).
 *
 * Functions:
 *   - burn(token, amount, destinationAddress, destinationChainId) -- burn bridged tokens on Goliath
 *
 * Events:
 *   - Withdraw -- emitted on every burn/withdrawal
 */
export const bridgeGoliathAbi = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destinationAddress', type: 'address' },
      { name: 'destinationChainId', type: 'uint64' },
    ],
    name: 'burn',
    outputs: [{ name: 'withdrawId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'withdrawId', type: 'bytes32' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'destinationAddress', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint64' },
      { indexed: false, name: 'sourceChainId', type: 'uint64' },
      { indexed: false, name: 'destinationChainId', type: 'uint64' },
    ],
    name: 'Withdraw',
    type: 'event',
  },
] as const;
