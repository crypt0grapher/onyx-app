import { describe, it, expect } from "vitest";
import { navItems, isInactiveItem, footerLinks } from "@/config/navigation";

describe("navItems", () => {
    it("has expected navigation items", () => {
        const keys = navItems.map((item) => item.key);
        expect(keys).toContain("stake");
        expect(keys).toContain("swap");
        expect(keys).toContain("bridge");
        expect(keys).toContain("farm");
        expect(keys).toContain("governance");
        expect(keys).toContain("points");
        expect(keys).toContain("history");
    });

    it("all items have required fields", () => {
        for (const item of navItems) {
            expect(item.key).toBeTruthy();
            expect(item.label).toBeTruthy();
            expect(item.icon).toBeDefined();
            expect(item.href).toBeDefined();
        }
    });

    it("stake has children with goliath, ethereum staking, and migrate options", () => {
        const stake = navItems.find((item) => item.key === "stake");
        expect(stake?.children).toBeDefined();
        expect(stake!.children!.length).toBeGreaterThanOrEqual(3);
        expect(stake!.label).toBe("Staking");

        const goliathChild = stake!.children!.find(
            (c) => c.key === "stake-home",
        );
        expect(goliathChild).toBeDefined();
        expect(goliathChild!.href).toBe("/");

        const ethereumChild = stake!.children!.find(
            (c) => c.key === "ethereum-staking",
        );
        expect(ethereumChild).toBeDefined();
        expect(ethereumChild!.href).toBe("/ethereum-staking");

        const migrateChild = stake!.children!.find(
            (c) => c.key === "migrate",
        );
        expect(migrateChild).toBeDefined();
        expect(migrateChild!.href).toBe("/migrate");
    });

    it("bridge has children including legacy bridge", () => {
        const bridge = navItems.find((item) => item.key === "bridge");
        expect(bridge?.children).toBeDefined();
        const legacy = bridge!.children!.find(
            (c) => c.key === "legacy-bridge",
        );
        expect(legacy).toBeDefined();
        expect(legacy!.isExternal).toBe(true);
        expect(legacy!.href).toContain("bridge.onyx.org");
    });

    it("ai-agent links to external URL", () => {
        const aiAgent = navItems.find((item) => item.key === "ai-agent");
        expect(aiAgent).toBeDefined();
        expect(aiAgent!.href).toBe("https://ai.onyx.org/");
    });

    it("card, payments, enterprise items exist", () => {
        const keys = navItems.map((item) => item.key);
        expect(keys).toContain("card");
        expect(keys).toContain("payments");
        expect(keys).toContain("enterprise");
    });
});

describe("isInactiveItem", () => {
    it("returns true for card", () => {
        expect(isInactiveItem("card")).toBe(true);
    });

    it("returns true for payments", () => {
        expect(isInactiveItem("payments")).toBe(true);
    });

    it("returns true for enterprise", () => {
        expect(isInactiveItem("enterprise")).toBe(true);
    });

    it("returns false for active items", () => {
        expect(isInactiveItem("stake")).toBe(false);
        expect(isInactiveItem("swap")).toBe(false);
        expect(isInactiveItem("governance")).toBe(false);
        expect(isInactiveItem("farm")).toBe(false);
        expect(isInactiveItem("bridge")).toBe(false);
    });
});

describe("footerLinks", () => {
    it("has terms, disclosures, and .docs", () => {
        const keys = footerLinks.map((link) => link.key);
        expect(keys).toContain("terms");
        expect(keys).toContain("disclosures");
        expect(keys).toContain("docs");
    });

    it("all footer links have href and label", () => {
        for (const link of footerLinks) {
            expect(link.label).toBeTruthy();
            expect(link.href).toBeTruthy();
            expect(link.href).toMatch(/^https?:\/\//);
        }
    });

    it(".docs link points to onyx .docs", () => {
        const docs = footerLinks.find((l) => l.key === "docs");
        expect(docs?.href).toBe("https://docs.onyx.org");
    });
});
