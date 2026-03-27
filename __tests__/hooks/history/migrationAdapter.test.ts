import { describe, it, expect, vi } from "vitest";
import type { MigrationStatusResponse } from "@/lib/api/services/migration";

// ---------------------------------------------------------------------------
// Mock the explorer utility so we get deterministic URLs without pulling in
// the full SUPPORTED_NETWORKS config (which imports image assets).
// ---------------------------------------------------------------------------
vi.mock("@/utils/explorer", () => ({
  buildExplorerUrl: (value: string, kind: string, chainId?: number) => {
    const bases: Record<number, string> = {
      1: "https://etherscan.io",
      327: "https://explorer.goliath.net",
      80888: "https://explorer.onyx.org",
    };
    const base = (chainId && bases[chainId]) || "https://explorer.goliath.net";
    return `${base}/${kind}/${value}`;
  },
}));

// Import AFTER mocks are declared so the mock is in place.
import {
  adaptMigrationItems,
  resolveNetwork,
} from "@/hooks/history/adapters/migrationAdapter";

// ---------------------------------------------------------------------------
// Helpers -- build a full MigrationStatusResponse with sensible defaults.
// ---------------------------------------------------------------------------

function buildMigrationResponse(
  overrides: Partial<MigrationStatusResponse> = {},
): MigrationStatusResponse {
  return {
    operationId: "op-001",
    direction: "SOURCE_TO_GOLIATH",
    status: "COMPLETED",
    token: "XCN",
    amount: "1000000000000000000",
    amountFormatted: "1.0",
    sender: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    recipient: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    originChainId: 1,
    destinationChainId: 327,
    originTxHash: "0xabc123",
    destinationTxHash: "0xdef456",
    originConfirmations: 12,
    requiredConfirmations: 12,
    timestamps: {
      depositedAt: "2026-03-27T12:00:00Z",
      finalizedAt: null,
      destinationSubmittedAt: null,
      completedAt: null,
    },
    estimatedCompletionTime: null,
    error: null,
    isSameWallet: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Status mapping (tested indirectly through adaptMigrationItems)
// ---------------------------------------------------------------------------

describe("status mapping via adaptMigrationItems", () => {
  it("maps COMPLETED to confirmed", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "COMPLETED" }),
    ]);
    expect(items[0].status).toBe("confirmed");
  });

  it("maps FAILED to failed", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "FAILED" }),
    ]);
    expect(items[0].status).toBe("failed");
  });

  it("maps PENDING_ORIGIN_TX to pending", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "PENDING_ORIGIN_TX" }),
    ]);
    expect(items[0].status).toBe("pending");
  });

  it("maps CONFIRMING to pending", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "CONFIRMING" }),
    ]);
    expect(items[0].status).toBe("pending");
  });

  it("maps AWAITING_RELAY to pending", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "AWAITING_RELAY" }),
    ]);
    expect(items[0].status).toBe("pending");
  });

  it("maps EXPIRED to pending (non-terminal fallback)", () => {
    const items = adaptMigrationItems([
      buildMigrationResponse({ status: "EXPIRED" }),
    ]);
    expect(items[0].status).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// 2. resolveNetwork
// ---------------------------------------------------------------------------

describe("resolveNetwork", () => {
  it("resolves chainId 1 to ethereum", () => {
    expect(resolveNetwork(1)).toBe("ethereum");
  });

  it("resolves chainId 327 to goliath", () => {
    expect(resolveNetwork(327)).toBe("goliath");
  });

  it("resolves chainId 80888 to onyx", () => {
    expect(resolveNetwork(80888)).toBe("onyx");
  });

  it("resolves Sepolia (11155111) to goliath, not ethereum", () => {
    expect(resolveNetwork(11155111)).toBe("goliath");
  });

  it("resolves unknown chainId 0 to goliath", () => {
    expect(resolveNetwork(0)).toBe("goliath");
  });
});

// ---------------------------------------------------------------------------
// 3. adaptMigrationItems output shape and field mapping
// ---------------------------------------------------------------------------

describe("adaptMigrationItems", () => {
  it("sets type to migrate", () => {
    const [item] = adaptMigrationItems([buildMigrationResponse()]);
    expect(item.type).toBe("migrate");
  });

  it("sets source to migration-api", () => {
    const [item] = adaptMigrationItems([buildMigrationResponse()]);
    expect(item.source).toBe("migration-api");
  });

  it("maps timestamps.depositedAt to a unix timestamp", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({
        timestamps: {
          depositedAt: "2026-03-27T12:00:00Z",
          finalizedAt: null,
          destinationSubmittedAt: null,
          completedAt: null,
        },
      }),
    ]);
    // 2026-03-27T12:00:00Z => 1774699200 seconds
    const expected = Math.floor(
      new Date("2026-03-27T12:00:00Z").getTime() / 1000,
    );
    expect(item.timestamp).toBe(expected);
  });

  it("returns timestamp 0 when depositedAt is null", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({
        timestamps: {
          depositedAt: null,
          finalizedAt: null,
          destinationSubmittedAt: null,
          completedAt: null,
        },
      }),
    ]);
    expect(item.timestamp).toBe(0);
  });

  it("returns empty explorerUrl when originTxHash is null", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({ originTxHash: null }),
    ]);
    expect(item.explorerUrl).toBe("");
  });

  it("returns undefined destinationExplorerUrl when destinationTxHash is null", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({ destinationTxHash: null }),
    ]);
    expect(item.destinationExplorerUrl).toBeUndefined();
  });

  it("builds correct origin explorer URL for Ethereum (chain 1)", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({
        originChainId: 1,
        originTxHash: "0xoriginHash",
      }),
    ]);
    expect(item.explorerUrl).toBe("https://etherscan.io/tx/0xoriginHash");
  });

  it("builds correct destination explorer URL for Goliath (chain 327)", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({
        destinationChainId: 327,
        destinationTxHash: "0xdestHash",
      }),
    ]);
    expect(item.destinationExplorerUrl).toBe(
      "https://explorer.goliath.net/tx/0xdestHash",
    );
  });

  it("returns an empty array for empty input", () => {
    const result = adaptMigrationItems([]);
    expect(result).toEqual([]);
  });

  it("preserves operationId as item id", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({ operationId: "op-unique-42" }),
    ]);
    expect(item.id).toBe("op-unique-42");
  });

  it("maps sender and recipient to from/to fields", () => {
    const [item] = adaptMigrationItems([
      buildMigrationResponse({
        sender: "0x1111111111111111111111111111111111111111",
        recipient: "0x2222222222222222222222222222222222222222",
      }),
    ]);
    expect(item.from).toBe("0x1111111111111111111111111111111111111111");
    expect(item.to).toBe("0x2222222222222222222222222222222222222222");
  });
});
