import { CONTRACTS } from "@/contracts";
import { Address, PublicClient } from "viem";

export type RawProposal = {
    id: string;
    proposer: Address;
    targets: Address[];
    values: string[];
    signatures: string[];
    callDatas: string[];
    startBlock: string;
    endBlock: string;
    description: string;
    state?: string;
    eta?: string | null;
    forVotes: string;
    againstVotes: string;
    createdBlockNumber: string;
    createdBlockTimestamp: string;
    createdTransactionHash: string;
    queuedBlockNumber?: string | null;
    queuedBlockTimestamp?: string | null;
    executedBlockNumber?: string | null;
    executedBlockTimestamp?: string | null;
    canceledBlockNumber?: string | null;
    canceledBlockTimestamp?: string | null;
};

export type UiProposal = {
    id: string;
    proposalId: number;
    title: string;
    description: string;
    status: "Executed" | "Expired" | "Active" | "Pending";
    userVoteStatus: "You Voted" | "You Not Voted";
    created: string;
    type: string;
};

const stripMarkdown = (s: string) => s.replace(/\*|_|~|`|#+|>\s?/g, "").trim();

export const parseDescription = (
    desc: string
): { title: string; body: string } => {
    try {
        const json = JSON.parse(desc) as {
            title?: string;
            description?: string;
        };
        if (json && (json.title || json.description)) {
            return {
                title: stripMarkdown(json.title ?? "Untitled"),
                body: json.description ?? "",
            };
        }
    } catch {}
    const [first, ...rest] = desc.split("\n");
    return { title: stripMarkdown(first || "Untitled"), body: rest.join("\n") };
};

export const deriveState = async (
    raw: RawProposal,
    publicClient: PublicClient
): Promise<"Pending" | "Active" | "Executed" | "Expired"> => {
    const start = BigInt(raw.startBlock);
    const end = BigInt(raw.endBlock);
    const latestBlock = await publicClient.getBlockNumber();

    if (latestBlock < start) return "Pending";
    if (latestBlock <= end) return "Active";

    const governor = CONTRACTS.governorBravoDelegator;
    try {
        const executed = await publicClient.readContract({
            address: governor.address,
            abi: governor.abi as never,
            functionName: "proposals",
            args: [BigInt(raw.id)],
        });
        const executedFlag = (
            executed as { executed?: boolean } | unknown as unknown[]
        )[8] as boolean | undefined;
        if (executedFlag) return "Executed";
    } catch {}

    return "Expired";
};

export const formatToUiProposal = async (
    raw: RawProposal,
    publicClient: PublicClient
): Promise<UiProposal> => {
    const { title, body } = parseDescription(raw.description);
    const state = await deriveState(raw, publicClient);
    const created = Number(raw.createdBlockTimestamp) * 1000;
    const createdStr = Number.isFinite(created)
        ? new Date(created).toLocaleString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
          })
        : "--";

    return {
        id: raw.id,
        proposalId: Number(raw.id),
        title,
        description: body,
        status: state,
        userVoteStatus: "You Not Voted",
        created: createdStr,
        type: "Protocol",
    };
};
