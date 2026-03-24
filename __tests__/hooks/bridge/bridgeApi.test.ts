import { describe, it, expect } from "vitest";
import { BridgeApiService } from "@/lib/api/services/bridge";

describe("BridgeApiService", () => {
    it("is instantiable", () => {
        const service = new BridgeApiService();
        expect(service).toBeInstanceOf(BridgeApiService);
    });
});
