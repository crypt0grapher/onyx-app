import { describe, it, expect } from "vitest";
import { goliathConfig } from "@/config/goliath";

// ---------------------------------------------------------------------------
// Migration config -- mainnet readiness validation
// ---------------------------------------------------------------------------

describe("goliathConfig.migration", () => {
  const { migration } = goliathConfig;

  // -------------------------------------------------------------------------
  // 1. Feature flags
  // -------------------------------------------------------------------------
  describe("feature flags", () => {
    it("migrationEnabled defaults to true", () => {
      expect(migration.migrationEnabled).toBe(true);
    });

    it("claimEnabled defaults to true", () => {
      expect(migration.claimEnabled).toBe(true);
    });

    it("statsEnabled defaults to false", () => {
      expect(migration.statsEnabled).toBe(false);
    });

    it("historyEnabled defaults to false", () => {
      expect(migration.historyEnabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Migration addresses
  // -------------------------------------------------------------------------
  describe("migration addresses", () => {
    it("sourceStakingAddress is the expected mainnet contract", () => {
      expect(migration.sourceStakingAddress).toBe(
        "0x23445c63feef8d85956dc0f19ade87606d0e19a9",
      );
    });

    it("sourceStakingAddress is a valid Ethereum address", () => {
      expect(migration.sourceStakingAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Bridge addresses used by migration
  // -------------------------------------------------------------------------
  describe("bridge addresses used by migration", () => {
    const { bridge } = goliathConfig;

    it("sourceChainId is 1 (Ethereum mainnet)", () => {
      expect(bridge.sourceChainId).toBe(1);
    });

    it("sourceTokens.XCN is the mainnet XCN contract", () => {
      expect(bridge.sourceTokens.XCN).toBe(
        "0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18",
      );
    });

    it("sourceBridgeAddress is a valid Ethereum address", () => {
      expect(bridge.sourceBridgeAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("sourceBridgeAddress is the expected mainnet bridge contract", () => {
      expect(bridge.sourceBridgeAddress).toBe(
        "0xa9fd64b5095d626f5a3a67e6db7fb766345f8092",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 4. Migration timing config
  // -------------------------------------------------------------------------
  describe("timing config", () => {
    it("deadline is 1800 (30 minutes)", () => {
      expect(migration.deadline).toBe(1800);
    });

    it("statusPollMs is greater than zero", () => {
      expect(migration.statusPollMs).toBeGreaterThan(0);
    });

    it("dataPollMs is greater than zero", () => {
      expect(migration.dataPollMs).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Cross-reference consistency
  // -------------------------------------------------------------------------
  describe("cross-reference consistency", () => {
    const { bridge } = goliathConfig;

    it("bridge.sourceChainId is mainnet (1), not a testnet", () => {
      expect(bridge.sourceChainId).toBe(1);
    });

    it("migration.sourceStakingAddress differs from bridge.sourceBridgeAddress", () => {
      expect(migration.sourceStakingAddress).not.toBe(
        bridge.sourceBridgeAddress,
      );
    });
  });
});
