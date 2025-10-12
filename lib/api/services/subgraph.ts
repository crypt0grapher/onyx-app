import { BaseApiService } from "../base";
import { SUBGRAPH_CONFIG } from "../config";

export enum HistoryItemType {
  SUPPLY = "supply",
  STAKE = "stake",
  TRANSFER = "transfer",
  WITHDRAW = "withdraw",
  CLAIM = "claim",
  PROPOSE = "propose",
  VOTE = "vote",
  APPROVAL = "approval",
  REDEEM = "redeem",
  BORROW = "borrow",
  REPAY_BORROW = "repayBorrow",
  LIQUIDATE_BORROW = "liquidateBorrow",
  RESERVES_ADDED = "reservesAdded",
  RESERVES_REDUCED = "reservesReduced",
}

export type HistoryItem = {
  id: string;
  type: HistoryItemType | string;
  to: string;
  from: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
};

export type HistoryFilter = Partial<HistoryItem>;

export type HistoryOrder = {
  direction: "asc" | "desc";
  field: keyof HistoryItem;
};

export type HistoryPagination = {
  limit: number;
  offset: number;
};

export type HistoryResponse = {
  items: HistoryItem[];
  totalCount: number;
  hasNextPage: boolean;
};

export class SubgraphService extends BaseApiService {
  constructor() {
    super(SUBGRAPH_CONFIG.MAINNET_ENDPOINT);
  }

  private get authHeader(): Record<string, string> {
    return SUBGRAPH_CONFIG.AUTHORIZATION
      ? { Authorization: SUBGRAPH_CONFIG.AUTHORIZATION }
      : {};
  }

  protected async post<T>(
    endpoint: string,
    body: unknown,
    options: import("../types").ApiOptions = {}
  ): Promise<T> {
    const response = await this.fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.authHeader,
      },
      body: JSON.stringify(body),
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    });

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new (await import("../types")).ApiError(
        `Failed to parse response as JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildWhereClause(filter?: HistoryFilter): string {
    if (!filter || Object.keys(filter).length === 0) return "";

    const conditions = Object.entries(filter)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => {
        if (key === "type") return `${key}: ${value}`;
        return `${key}: \"${value}\"`;
      });

    return conditions.length > 0 ? `where: { ${conditions.join(", ")} }` : "";
  }

  async getHistory(
    filter: HistoryFilter = {},
    order: HistoryOrder = { direction: "desc", field: "blockTimestamp" },
    pagination: HistoryPagination = { limit: 25, offset: 0 }
  ): Promise<HistoryResponse> {
    const whereClause = this.buildWhereClause(filter);

    const query = `
      query historyItemsQuery {
        historyItems(
          first: ${pagination.limit + 1}
          skip: ${pagination.offset}
          orderBy: ${order.field}
          orderDirection: ${order.direction}
          ${whereClause}
        ) {
          id
          type
          to
          from
          amount
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    const { data, errors } = await this.post<{
      data: { historyItems: HistoryItem[] };
      errors?: Array<{ message: string }>;
    }>("", { query });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");

    const items: HistoryItem[] = data.historyItems;
    const hasNextPage = items.length > pagination.limit;
    if (hasNextPage) items.pop();

    const totalCount =
      pagination.offset + items.length + (hasNextPage ? pagination.limit : 0);

    return { items, totalCount, hasNextPage };
  }

  async searchByAddress(
    address: string,
    pagination: HistoryPagination = { limit: 25, offset: 0 }
  ): Promise<HistoryResponse> {
    const query = `
      query searchByAddress($address: String!) {
        fromTransactions: historyItems(
          first: ${Math.ceil(pagination.limit / 2)}
          skip: ${Math.floor(pagination.offset / 2)}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { from: $address }
        ) {
          id type to from amount blockNumber blockTimestamp transactionHash
        }
        toTransactions: historyItems(
          first: ${Math.ceil(pagination.limit / 2)}
          skip: ${Math.floor(pagination.offset / 2)}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { to: $address }
        ) {
          id type to from amount blockNumber blockTimestamp transactionHash
        }
      }
    `;

    const { data, errors } = await this.post<{
      data: {
        fromTransactions: HistoryItem[];
        toTransactions: HistoryItem[];
      };
      errors?: Array<{ message: string }>;
    }>("", { query, variables: { address } });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");

    const merged = [...data.fromTransactions, ...data.toTransactions];
    const unique = merged.filter(
      (item: HistoryItem, idx: number, arr: HistoryItem[]) =>
        arr.findIndex((i) => i.id === item.id) === idx
    );
    unique.sort(
      (a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp)
    );

    return {
      items: unique.slice(0, pagination.limit),
      totalCount: unique.length,
      hasNextPage: unique.length > pagination.limit,
    };
  }

  async searchByTxHash(txHash: string): Promise<HistoryResponse> {
    const query = `
      query searchByTxHash($hash: String!) {
        historyItems(where: { transactionHash: $hash }) {
          id type to from amount blockNumber blockTimestamp transactionHash
        }
      }
    `;

    const { data, errors } = await this.post<{
      data: { historyItems: HistoryItem[] };
      errors?: Array<{ message: string }>;
    }>("", { query, variables: { hash: txHash } });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");

    return {
      items: data.historyItems,
      totalCount: data.historyItems.length,
      hasNextPage: false,
    };
  }

  async getStakeWithdrawHistory(
    scope: "all" | "my" = "all",
    address?: string,
    order: HistoryOrder = { direction: "desc", field: "blockTimestamp" },
    pagination: HistoryPagination = { limit: 25, offset: 0 }
  ): Promise<HistoryResponse> {
    if (scope === "my" && address) {
      const firstHalf = Math.ceil((pagination.limit + 1) / 2);
      const skipHalf = Math.floor(pagination.offset / 2);
      const query = `
      query stakingHistoryMy($address: String!) {
        stakeFrom: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: stake, from: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
        stakeTo: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: stake, to: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
        withdrawFrom: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: withdraw, from: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
        withdrawTo: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: withdraw, to: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
        claimFrom: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: claim, from: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
        claimTo: historyItems(
          first: ${firstHalf}
          skip: ${skipHalf}
          orderBy: blockTimestamp
          orderDirection: desc
          where: { type: claim, to: $address }
        ) { id type to from amount blockNumber blockTimestamp transactionHash }
      }`;

      const { data, errors } = await this.post<{
        data: {
          stakeFrom: HistoryItem[];
          stakeTo: HistoryItem[];
          withdrawFrom: HistoryItem[];
          withdrawTo: HistoryItem[];
          claimFrom: HistoryItem[];
          claimTo: HistoryItem[];
        };
        errors?: Array<{ message: string }>;
      }>("", { query, variables: { address: address.toLowerCase() } });
      if (errors) throw new Error(errors[0]?.message || "Subgraph error");

      const merged = [
        ...data.stakeFrom,
        ...data.stakeTo,
        ...data.withdrawFrom,
        ...data.withdrawTo,
        ...data.claimFrom,
        ...data.claimTo,
      ];
      const unique = merged.filter(
        (item: HistoryItem, idx: number, arr: HistoryItem[]) =>
          arr.findIndex((i) => i.id === item.id) === idx
      );

      unique.sort((a, b) => {
        const dir = order.direction === "asc" ? 1 : -1;
        if (
          order.field === "blockTimestamp" ||
          order.field === "blockNumber" ||
          order.field === "amount"
        ) {
          const av = BigInt(a[order.field] as string);
          const bv = BigInt(b[order.field] as string);
          if (av === bv) return 0;
          return av > bv ? dir : -dir;
        }
        const av = String(a[order.field] ?? "").toLowerCase();
        const bv = String(b[order.field] ?? "").toLowerCase();
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      });

      const start = 0;
      const end = start + pagination.limit;
      const pageItems = unique.slice(start, end);

      return {
        items: pageItems,
        totalCount: unique.length,
        hasNextPage: unique.length > pagination.limit,
      };
    }

    const query = `
      query stakingHistoryAll {
        historyItems(
          first: ${pagination.limit + 1}
          skip: ${pagination.offset}
          orderBy: ${order.field}
          orderDirection: ${order.direction}
          where: { type_in: [stake, withdraw, claim] }
        ) {
          id type to from amount blockNumber blockTimestamp transactionHash
        }
      }`;

    const { data, errors } = await this.post<{
      data: { historyItems: HistoryItem[] };
      errors?: Array<{ message: string }>;
    }>("", { query });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");

    const items: HistoryItem[] = data.historyItems;
    const hasNextPage = items.length > pagination.limit;
    if (hasNextPage) items.pop();
    const totalCount =
      pagination.offset + items.length + (hasNextPage ? pagination.limit : 0);
    return { items, totalCount, hasNextPage };
  }

  async getProposals(
    first: number,
    skip: number
  ): Promise<{
    proposals: Array<{
      id: string;
      proposer: string;
      targets: string[];
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
    }>;
    proposalCounts: Array<{ count: string }>;
  }> {
    const query = `
      query proposalsQuery {
        proposals(
          first: ${first}
          skip: ${skip}
          orderBy: createdBlockTimestamp
          orderDirection: desc
        ) {
          id proposer targets values signatures callDatas startBlock endBlock description state eta forVotes againstVotes createdBlockNumber createdBlockTimestamp createdTransactionHash queuedBlockNumber queuedBlockTimestamp executedBlockNumber executedBlockTimestamp canceledBlockNumber canceledBlockTimestamp
        }
        proposalCounts(where: { id: "0" }) { count }
      }
    `;

    const { data, errors } = await this.post<{
      data: {
        proposals: Array<Record<string, string | string[] | null>>;
        proposalCounts: Array<{ count: string }>;
      };
      errors?: Array<{ message: string }>;
    }>("", { query });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");
    return data as unknown as {
      proposals: Array<{
        id: string;
        proposer: string;
        targets: string[];
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
      }>;
      proposalCounts: Array<{ count: string }>;
    };
  }

  async getProposalById(id: string): Promise<{
    proposal: {
      id: string;
      proposer: string;
      targets: string[];
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
      queuedTransactionHash?: string | null;
      executedBlockNumber?: string | null;
      executedBlockTimestamp?: string | null;
      executedTransactionHash?: string | null;
      canceledBlockNumber?: string | null;
      canceledBlockTimestamp?: string | null;
      canceledTransactionHash?: string | null;
    } | null;
  }> {
    const query = `
      query proposalByIdQuery($id: String!) {
        proposals(
          first: 1
          skip: 0
          where: { id: $id }
        ) {
          id proposer targets values signatures callDatas startBlock endBlock description state eta forVotes againstVotes createdBlockNumber createdBlockTimestamp createdTransactionHash queuedBlockNumber queuedBlockTimestamp queuedTransactionHash executedBlockNumber executedBlockTimestamp executedTransactionHash canceledBlockNumber canceledBlockTimestamp canceledTransactionHash
        }
      }
    `;

    const { data, errors } = await this.post<{
      data: {
        proposals: Array<Record<string, string | string[] | null>>;
      };
      errors?: Array<{ message: string }>;
    }>("", { query, variables: { id } });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");
    const proposal = (data.proposals?.[0] || null) as unknown as {
      id: string;
      proposer: string;
      targets: string[];
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
      queuedTransactionHash?: string | null;
      executedBlockNumber?: string | null;
      executedBlockTimestamp?: string | null;
      executedTransactionHash?: string | null;
      canceledBlockNumber?: string | null;
      canceledBlockTimestamp?: string | null;
      canceledTransactionHash?: string | null;
    } | null;
    return { proposal };
  }

  async getProposalVotes(filter?: { id?: string; address?: string; limit?: number }): Promise<{
    proposalVotes: Array<{
      id: string;
      proposal: string;
      address: string;
      support: string;
      votes: string;
      blockNumber: string;
      blockTimestamp: string;
      transactionHash: string;
    }>;
  }> {
    const whereParts: string[] = [];
    if (filter?.id) whereParts.push(`proposal: "${filter.id}"`);
    if (filter?.address) whereParts.push(`address: "${filter.address}"`);
    const where =
      whereParts.length > 0 ? `where: { ${whereParts.join(", ")} }` : "";

    const limit = filter?.limit ?? 1000;

    const query = `
      query proposalVotesQuery {
        proposalVotes(
          first: ${limit}
          ${where}
        ) {
          id
          proposal { id }
          address
          support
          votes
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    const { data, errors } = await this.post<{
      data: {
        proposalVotes: Array<{
          id: string;
          proposal: { id: string };
          address: string;
          support: string;
          votes: string;
          blockNumber: string;
          blockTimestamp: string;
          transactionHash: string;
        }>;
      };
      errors?: Array<{ message: string }>;
    }>("", { query });
    if (errors) throw new Error(errors[0]?.message || "Subgraph error");
    const proposalVotes = (data.proposalVotes || []).map((pv) => ({
      id: pv.id,
      proposal: pv.proposal?.id,
      address: pv.address,
      support: pv.support,
      votes: pv.votes,
      blockNumber: pv.blockNumber,
      blockTimestamp: pv.blockTimestamp,
      transactionHash: pv.transactionHash,
    }));
    return { proposalVotes };
  }
}
