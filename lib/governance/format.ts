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
  status:
    | "Pending"
    | "Active"
    | "Canceled"
    | "Defeated"
    | "Succeeded"
    | "Queued"
    | "Expired"
    | "Executed";
  userVoteStatus: "You Have Voted" | "You Have Not Voted";
  created: string;
  type: string;
  forVotes: string;
  againstVotes: string;
};

const decodeHtmlEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));

const stripHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripMarkdown = (s: string) =>
  decodeHtmlEntities(
    stripHtml(s)
  )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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
        body: stripMarkdown(json.description ?? ""),
      };
    }
  } catch {}
  const [first, ...rest] = desc.split("\n");
  return {
    title: stripMarkdown(first || "Untitled"),
    body: stripMarkdown(rest.join("\n")),
  };
};

export const extractDescriptionBody = (desc: string): string => {
  try {
    const json = JSON.parse(desc) as {
      title?: string;
      description?: string;
    };
    if (json && (json.title || json.description)) {
      return json.description ?? "";
    }
  } catch {}
  const [, ...rest] = desc.split("\n");
  return rest.join("\n");
};

const STATE_MAP: Record<number, UiProposal["status"]> = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
};

export const readOnChainState = async (
  proposalId: string | number,
  publicClient: PublicClient
): Promise<UiProposal["status"]> => {
  const governor = CONTRACTS.governorBravoDelegator;
  const stateNum = (await publicClient.readContract({
    address: governor.address,
    abi: governor.abi as never,
    functionName: "state",
    args: [BigInt(proposalId)],
  })) as number;
  return STATE_MAP[stateNum] ?? "Pending";
};

export const readOnChainStates = async (
  proposals: RawProposal[],
  publicClient: PublicClient
): Promise<Map<string, UiProposal["status"]>> => {
  const governor = CONTRACTS.governorBravoDelegator;
  const results = await publicClient.multicall({
    contracts: proposals.map((p) => ({
      address: governor.address,
      abi: governor.abi as never,
      functionName: "state",
      args: [BigInt(p.id)],
    })),
    allowFailure: true,
  });

  const stateMap = new Map<string, UiProposal["status"]>();
  proposals.forEach((p, i) => {
    const r = results[i];
    if (r.status === "success") {
      stateMap.set(p.id, STATE_MAP[Number(r.result)] ?? "Pending");
    } else {
      stateMap.set(p.id, "Pending");
    }
  });
  return stateMap;
};

export const formatToUiProposal = async (
  raw: RawProposal,
  publicClient: PublicClient,
  precomputedStatus?: UiProposal["status"]
): Promise<UiProposal> => {
  const { title, body } = parseDescription(raw.description);
  const state =
    precomputedStatus ?? (await readOnChainState(raw.id, publicClient));
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
    userVoteStatus: "You Have Not Voted",
    created: createdStr,
    type: "Protocol",
    forVotes: raw.forVotes,
    againstVotes: raw.againstVotes,
  };
};
