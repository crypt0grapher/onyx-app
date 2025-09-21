import { Address, Hex } from "viem";
import { getPublicClient } from "wagmi/actions";
import { wagmiConfig } from "@/config/wagmi";
import { CONTRACTS } from "@/contracts/config";
import type { AbiEvent } from "viem";

type LogBase = { blockNumber: bigint; transactionHash: Hex };

export type FarmLogsResult = {
    deposits: Array<{
        amount: bigint;
        blockNumber: bigint;
        tx: Hex;
        timestamp?: number;
    }>;
    withdraws: Array<{
        amount: bigint;
        blockNumber: bigint;
        tx: Hex;
        timestamp?: number;
    }>;
    transfers: Array<{
        amount: bigint;
        blockNumber: bigint;
        tx: Hex;
        timestamp?: number;
    }>;
    blockTimestamps: Map<bigint, number>;
};

const DepositEvent = {
    type: "event",
    name: "Deposit",
    inputs: [
        { name: "user", type: "address", indexed: true },
        { name: "pid", type: "uint256", indexed: true },
        { name: "amount", type: "uint256", indexed: false },
    ],
} as const satisfies AbiEvent;

const WithdrawEvent = {
    type: "event",
    name: "Withdraw",
    inputs: [
        { name: "user", type: "address", indexed: true },
        { name: "pid", type: "uint256", indexed: true },
        { name: "amount", type: "uint256", indexed: false },
    ],
} as const satisfies AbiEvent;

const TransferEvent = {
    type: "event",
    name: "Transfer",
    inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
    ],
} as const satisfies AbiEvent;

export interface GetFarmLogsParams {
    pid: number;
    user: Address;
    fromBlock: bigint;
    toBlock: bigint;
    chunkSize?: bigint;
}

export const getFarmLogs = async ({
    pid,
    user,
    fromBlock,
    toBlock,
    chunkSize = BigInt(50000),
}: GetFarmLogsParams): Promise<FarmLogsResult> => {
    const client = getPublicClient(wagmiConfig, {
        chainId: CONTRACTS.masterChef.chainId,
    });
    if (!client) throw new Error("Public client unavailable");
    const mc = CONTRACTS.masterChef.address as Address;
    const xcn = CONTRACTS.xcnToken.address as Address;

    const deposits: FarmLogsResult["deposits"] = [];
    const withdraws: FarmLogsResult["withdraws"] = [];
    const transfers: FarmLogsResult["transfers"] = [];
    const blockTimestamps: Map<bigint, number> = new Map();

    const boundedFrom = fromBlock < BigInt(0) ? BigInt(0) : fromBlock;
    let start = boundedFrom;
    while (start <= toBlock) {
        const end =
            start + chunkSize - BigInt(1) <= toBlock
                ? start + chunkSize - BigInt(1)
                : toBlock;
        const [depositLogs, withdrawLogs, transferLogs] = await Promise.all([
            client
                .getLogs({
                    address: mc,
                    event: DepositEvent,
                    args: { user, pid: BigInt(pid) },
                    fromBlock: start,
                    toBlock: end,
                })
                .catch(() => []),
            client
                .getLogs({
                    address: mc,
                    event: WithdrawEvent,
                    args: { user, pid: BigInt(pid) },
                    fromBlock: start,
                    toBlock: end,
                })
                .catch(() => []),
            client
                .getLogs({
                    address: xcn,
                    event: TransferEvent,
                    args: { from: mc, to: user },
                    fromBlock: start,
                    toBlock: end,
                })
                .catch(() => []),
        ]);

        for (const log of depositLogs as Array<
            LogBase & { args?: { amount?: bigint } }
        >) {
            const amount = log?.args?.amount ?? BigInt(0);
            deposits.push({
                amount,
                blockNumber: log.blockNumber,
                tx: log.transactionHash,
            });
        }
        for (const log of withdrawLogs as Array<
            LogBase & { args?: { amount?: bigint } }
        >) {
            const amount = log?.args?.amount ?? BigInt(0);
            withdraws.push({
                amount,
                blockNumber: log.blockNumber,
                tx: log.transactionHash,
            });
        }
        for (const log of transferLogs as Array<
            LogBase & { args?: { value?: bigint } }
        >) {
            const amount = log?.args?.value ?? BigInt(0);
            transfers.push({
                amount,
                blockNumber: log.blockNumber,
                tx: log.transactionHash,
            });
        }

        start = end + BigInt(1);
    }

    const uniqueBlocks = Array.from(
        new Set([
            ...deposits.map((l) => l.blockNumber),
            ...withdraws.map((l) => l.blockNumber),
            ...transfers.map((l) => l.blockNumber),
        ])
    );

    await Promise.all(
        uniqueBlocks.map(async (bn) => {
            try {
                const block = await client.getBlock({ blockNumber: bn });
                const ts = Number(block.timestamp) * 1000;
                blockTimestamps.set(bn, ts);
            } catch {
                // Skip blocks we failed to fetch timestamp for
            }
        })
    );

    deposits.forEach((d) => (d.timestamp = blockTimestamps.get(d.blockNumber)));
    withdraws.forEach(
        (w) => (w.timestamp = blockTimestamps.get(w.blockNumber))
    );
    transfers.forEach(
        (t) => (t.timestamp = blockTimestamps.get(t.blockNumber))
    );

    return { deposits, withdraws, transfers, blockTimestamps };
};

export const estimateFromBlockForDays = async (
    days: number,
    approxBlocksPerDay: number
): Promise<bigint> => {
    const client = getPublicClient(wagmiConfig, {
        chainId: CONTRACTS.masterChef.chainId,
    });
    if (!client) return BigInt(0);
    const latest = await client.getBlockNumber();
    const delta = BigInt(days * approxBlocksPerDay);
    return latest > delta ? latest - delta : BigInt(0);
};
