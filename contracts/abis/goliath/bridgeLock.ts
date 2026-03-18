/**
 * ABI for the BridgeLock contract (Ethereum mainnet).
 *
 * Functions:
 *   - deposit(token, amount, destinationAddress) -- lock ERC-20 tokens on the source chain
 *   - depositNative(destinationAddress) -- lock native ETH on the source chain (payable)
 *
 * Events:
 *   - Deposit -- emitted on every deposit
 */
export const bridgeLockAbi = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destinationAddress', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ name: 'depositId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'destinationAddress', type: 'address' }],
    name: 'depositNative',
    outputs: [{ name: 'depositId', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'depositId', type: 'bytes32' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'destinationAddress', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint64' },
      { indexed: false, name: 'sourceChainId', type: 'uint64' },
    ],
    name: 'Deposit',
    type: 'event',
  },
] as const;
