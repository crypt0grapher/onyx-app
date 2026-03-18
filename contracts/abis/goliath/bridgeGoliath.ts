/**
 * ABI for the Goliath Bridge contract.
 *
 * Functions:
 *   - burn(token, amount, destinationAddress) -- burn bridged tokens on Goliath
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
    ],
    name: 'Withdraw',
    type: 'event',
  },
] as const;
