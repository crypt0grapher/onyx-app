import { createPublicClient, http } from "viem";
import { goliathChain } from "@/config/wagmi";

/**
 * Dedicated viem public client for Goliath chain.
 * Always connects to the Goliath RPC regardless of which chain
 * the user's wallet is currently on.
 */
export const goliathPublicClient = createPublicClient({
    chain: goliathChain,
    transport: http(goliathChain.rpcUrls.default.http[0]),
});
