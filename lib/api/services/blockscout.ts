/**
 * Blockscout API service for fetching contract event logs.
 *
 * The Goliath chain uses a Hedera-based JSON-RPC relay that often rejects
 * `eth_getLogs` calls for large block ranges (returning HTTP 400). This
 * service queries the Blockscout explorer's Etherscan-compatible API
 * instead, which reliably returns indexed event logs.
 */

import { decodeAbiParameters } from "viem";

// ---------------------------------------------------------------------------
// Event signature topic0 hashes (keccak256)
// ---------------------------------------------------------------------------

/**
 * topic0 for Staked(address indexed user, uint256 xcnAmount, uint256 stXCNMinted)
 *
 * keccak256("Staked(address,uint256,uint256)")
 */
const STAKED_TOPIC0 =
    "0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90";

/**
 * topic0 for Unstaked(address indexed user, uint256 stXCNBurned, uint256 xcnReturned)
 *
 * keccak256("Unstaked(address,uint256,uint256)")
 */
const UNSTAKED_TOPIC0 =
    "0x7fc4727e062e336010f2c282598ef5f14facb3de68cf8195c2f23e1454b2b74e";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockscoutLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    timeStamp: string;
    transactionHash: string;
    logIndex: string;
}

interface BlockscoutApiResponse {
    status: string;
    message: string;
    result: BlockscoutLog[] | string;
}

export interface StakingEventFromExplorer {
    type: "Staked" | "Unstaked";
    transactionHash: string;
    blockNumber: bigint;
    timestamp: number;
    user: string;
    /** For Staked: xcnAmount. For Unstaked: xcnReturned. */
    xcnAmount: bigint;
    /** For Staked: stXCNMinted. For Unstaked: stXCNBurned. */
    stXcnAmount: bigint;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padAddress(address: string): string {
    return "0x" + address.toLowerCase().slice(2).padStart(64, "0");
}

/**
 * Parse a numeric string that may be decimal or hex-prefixed.
 */
function parseNumeric(value: string): number {
    if (value.startsWith("0x") || value.startsWith("0X")) {
        return parseInt(value, 16);
    }
    return parseInt(value, 10);
}

function parseBigIntNumeric(value: string): bigint {
    if (value.startsWith("0x") || value.startsWith("0X")) {
        return BigInt(value);
    }
    return BigInt(value);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetch staking (Staked + Unstaked) event logs from Blockscout's
 * Etherscan-compatible API for a given user address.
 *
 * @param contractAddress  StakedXCN contract address
 * @param userAddress      Wallet address to filter events for
 * @param explorerUrl      Base explorer URL (e.g. "https://explorer.goliath.net")
 * @returns Parsed staking events sorted by block number descending
 */
export async function fetchStakingEventsFromExplorer(
    contractAddress: string,
    userAddress: string,
    explorerUrl: string,
): Promise<StakingEventFromExplorer[]> {
    try {
        const paddedUser = padAddress(userAddress);

        const params = new URLSearchParams({
            module: "logs",
            action: "getLogs",
            address: contractAddress.toLowerCase(),
            fromBlock: "0",
            toBlock: "latest",
            // Filter topic1 (indexed user address)
            topic0_1_opr: "and",
            topic1: paddedUser,
        });

        const response = await fetch(
            `${explorerUrl}/api?${params.toString()}`,
        );
        if (!response.ok) return [];

        const data: BlockscoutApiResponse = await response.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
            return [];
        }

        const events: StakingEventFromExplorer[] = [];

        for (const log of data.result) {
            const topic0 = log.topics[0]?.toLowerCase();
            const isStaked = topic0 === STAKED_TOPIC0;
            const isUnstaked = topic0 === UNSTAKED_TOPIC0;

            if (!isStaked && !isUnstaked) continue;

            try {
                // Decode the non-indexed data fields:
                // Staked:   (uint256 xcnAmount, uint256 stXCNMinted)
                // Unstaked: (uint256 stXCNBurned, uint256 xcnReturned)
                const decoded = decodeAbiParameters(
                    [
                        { name: "a", type: "uint256" },
                        { name: "b", type: "uint256" },
                    ],
                    log.data as `0x${string}`,
                );

                const blockNumber = parseBigIntNumeric(log.blockNumber);
                const timestamp = parseNumeric(log.timeStamp);

                if (isStaked) {
                    events.push({
                        type: "Staked",
                        transactionHash: log.transactionHash,
                        blockNumber,
                        timestamp,
                        user: userAddress,
                        xcnAmount: decoded[0], // xcnAmount
                        stXcnAmount: decoded[1], // stXCNMinted
                    });
                } else {
                    events.push({
                        type: "Unstaked",
                        transactionHash: log.transactionHash,
                        blockNumber,
                        timestamp,
                        user: userAddress,
                        xcnAmount: decoded[1], // xcnReturned
                        stXcnAmount: decoded[0], // stXCNBurned
                    });
                }
            } catch {
                // Skip malformed log entries
            }
        }

        // Sort by block number descending (most recent first)
        events.sort(
            (a, b) => Number(b.blockNumber - a.blockNumber),
        );

        return events;
    } catch {
        return [];
    }
}
