import type { BridgeStatus } from "@/lib/api/services/bridge";

export type BridgeTokenSymbol = "ETH" | "USDC" | "XCN";

export interface BridgeOperation {
    id: string;
    direction: "SOURCE_TO_GOLIATH" | "GOLIATH_TO_SOURCE";
    token: BridgeTokenSymbol;
    amountHuman: string;
    amountAtomic: string;
    sender: string;
    recipient: string;
    originChainId: number;
    destinationChainId: number;
    originTxHash: string | null;
    destinationTxHash: string | null;
    depositId: string | null;
    withdrawId: string | null;
    status: BridgeStatus;
    createdAt: number;
    updatedAt: number;
    errorMessage: string | null;
}
