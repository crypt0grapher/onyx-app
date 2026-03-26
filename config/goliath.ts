import { type Address } from "viem";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface GoliathDexConfig {
    factoryAddress: Address;
    routerAddress: Address;
    multicall3Address: Address;
    initCodeHash: `0x${string}`;
}

export interface GoliathTokens {
    WXCN: Address;
    USDC: Address;
    ETH: Address;
    BTC: Address;
    XAUX: Address;
    XAGX: Address;
    USDT: Address;
    stXCN: Address;
}

export interface GoliathBridgeConfig {
    bridgeEnabled: boolean;
    allowCustomRecipient: boolean;
    sourceChainId: number;
    sourceRpcUrls: string[];
    sourceExplorerUrl: string;
    sourceBridgeAddress: Address;
    goliathBridgeAddress: Address;
    statusApiBaseUrl: string;
    relayerWalletAddress: Address;
    statusPollInterval: number;
    minAmount: string;
    sourceTokens: {
        USDC: Address;
        XCN: Address;
    };
}

export interface GoliathMigrationConfig {
    migrationEnabled: boolean;
    claimEnabled: boolean;
    statsEnabled: boolean;
    historyEnabled: boolean;
    sourceStakingAddress: Address;
    deadline: number;
    statusPollMs: number;
    dataPollMs: number;
}

export interface GoliathStakingConfig {
    stakingEnabled: boolean;
    stXcnAddress: Address;
    protocolPollMs: number;
    balancePollMs: number;
}

export interface GoliathConfig {
    dex: GoliathDexConfig;
    tokens: GoliathTokens;
    bridge: GoliathBridgeConfig;
    migration: GoliathMigrationConfig;
    staking: GoliathStakingConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read an environment variable and cast it to an `Address` (`0x${string}`).
 * Falls back to the provided default when the env var is not set.
 */
const envAddress = (
    envKey: string,
    fallback: Address,
): Address => {
    return (process.env[envKey] as Address | undefined) || fallback;
};

const envBool = (envKey: string, fallback: boolean): boolean => {
    const raw = process.env[envKey];
    if (raw === undefined) return fallback;
    return raw === "true" || raw === "1";
};

const envNumber = (envKey: string, fallback: number): number => {
    const raw = process.env[envKey];
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const envString = (envKey: string, fallback: string): string => {
    return process.env[envKey] || fallback;
};

const envCsvList = (envKey: string, fallback: string[]): string[] => {
    const raw = process.env[envKey];
    if (!raw) return fallback;
    return raw.split(",").map((s) => s.trim());
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function loadGoliathConfig(): GoliathConfig {
    const dex: GoliathDexConfig = {
        factoryAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_FACTORY_ADDRESS",
            "0x008c99EedA17E193e5F788536234C6b3520B8D15",
        ),
        routerAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_ROUTER_ADDRESS",
            "0xa973c5626eEaF7F482439753953e9B28C6aF3674",
        ),
        multicall3Address: envAddress(
            "NEXT_PUBLIC_GOLIATH_MULTICALL3_ADDRESS",
            "0x88b4BC8e5bd74327B5456466F3f30143986cC1f9",
        ),
        initCodeHash: envString(
            "NEXT_PUBLIC_GOLIATH_INIT_CODE_HASH",
            "0x29ac827a7d364439c40cf6909f17f7f9144875302b275bae9498ac55cafc04ea",
        ) as `0x${string}`,
    };

    const tokens: GoliathTokens = {
        WXCN: envAddress(
            "NEXT_PUBLIC_GOLIATH_WXCN_ADDRESS",
            "0x1a0Da75ADf091a69E7285e596bB27218D77E17a9",
        ),
        USDC: envAddress(
            "NEXT_PUBLIC_GOLIATH_USDC_ADDRESS",
            "0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B",
        ),
        ETH: envAddress(
            "NEXT_PUBLIC_GOLIATH_ETH_ADDRESS",
            "0x9253587505c3B7E7b9DEE118AE1AcB53eEC0E4b6",
        ),
        BTC: envAddress(
            "NEXT_PUBLIC_GOLIATH_BTC_ADDRESS",
            "0xDf30632AC69E3AD2A96D7538d5B874E0ddA4101E",
        ),
        // Not yet deployed on mainnet (chain 327)
        XAUX: envAddress(
            "NEXT_PUBLIC_GOLIATH_XAUX_ADDRESS",
            "0x3421E2336B39BFb2B4B999b51e33a67AAE45D62d",
        ),
        // Not yet deployed on mainnet (chain 327)
        XAGX: envAddress(
            "NEXT_PUBLIC_GOLIATH_XAGX_ADDRESS",
            "0x18C1457621178409d8841cE18d2dE6c25aB7D16e",
        ),
        // Not yet deployed on mainnet (chain 327)
        USDT: envAddress(
            "NEXT_PUBLIC_GOLIATH_USDT_ADDRESS",
            "0x86381420c71d404ca6C3C0873e80Fe8AEF2dD6C7",
        ),
        stXCN: envAddress(
            "NEXT_PUBLIC_GOLIATH_STXCN_ADDRESS",
            "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74",
        ),
    };

    const bridge: GoliathBridgeConfig = {
        bridgeEnabled: envBool("NEXT_PUBLIC_GOLIATH_BRIDGE_ENABLED", true),
        allowCustomRecipient: envBool(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_ALLOW_CUSTOM_RECIPIENT",
            false,
        ),
        sourceChainId: envNumber(
            "NEXT_PUBLIC_GOLIATH_SOURCE_CHAIN_ID",
            1,
        ),
        sourceRpcUrls: envCsvList(
            "NEXT_PUBLIC_GOLIATH_SOURCE_RPC_URLS",
            ["https://ethereum-rpc.publicnode.com"],
        ),
        sourceExplorerUrl: envString(
            "NEXT_PUBLIC_GOLIATH_SOURCE_EXPLORER_URL",
            "https://etherscan.io",
        ),
        sourceBridgeAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_SOURCE_BRIDGE_ADDRESS",
            "0xa9fd64b5095d626f5a3a67e6db7fb766345f8092",
        ),
        goliathBridgeAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_ADDRESS",
            "0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2",
        ),
        statusApiBaseUrl: envString(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_STATUS_API_URL",
            "https://bridge.goliath.net/api/v1",
        ),
        relayerWalletAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_RELAYER_ADDRESS",
            "0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB",
        ),
        statusPollInterval: envNumber(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_POLL_INTERVAL",
            5000,
        ),
        minAmount: envString(
            "NEXT_PUBLIC_GOLIATH_BRIDGE_MIN_AMOUNT",
            "0.001",
        ),
        sourceTokens: {
            USDC: envAddress(
                "NEXT_PUBLIC_GOLIATH_SOURCE_USDC_ADDRESS",
                "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            ),
            XCN: envAddress(
                "NEXT_PUBLIC_GOLIATH_SOURCE_XCN_ADDRESS",
                "0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18",
            ),
        },
    };

    const migration: GoliathMigrationConfig = {
        migrationEnabled: envBool(
            "NEXT_PUBLIC_GOLIATH_MIGRATION_ENABLED",
            true,
        ),
        claimEnabled: envBool("NEXT_PUBLIC_GOLIATH_CLAIM_ENABLED", true),
        statsEnabled: envBool("NEXT_PUBLIC_GOLIATH_STATS_ENABLED", false),
        historyEnabled: envBool("NEXT_PUBLIC_GOLIATH_HISTORY_ENABLED", false),
        sourceStakingAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_SOURCE_STAKING_ADDRESS",
            "0x23445c63feef8d85956dc0f19ade87606d0e19a9",
        ),
        deadline: envNumber("NEXT_PUBLIC_GOLIATH_MIGRATION_DEADLINE", 1800),
        statusPollMs: envNumber(
            "NEXT_PUBLIC_GOLIATH_MIGRATION_STATUS_POLL_MS",
            3000,
        ),
        dataPollMs: envNumber(
            "NEXT_PUBLIC_GOLIATH_MIGRATION_DATA_POLL_MS",
            15000,
        ),
    };

    const staking: GoliathStakingConfig = {
        stakingEnabled: envBool("NEXT_PUBLIC_GOLIATH_STAKING_ENABLED", true),
        stXcnAddress: envAddress(
            "NEXT_PUBLIC_GOLIATH_STXCN_ADDRESS",
            "0xA553a603e2f84fEa6c1fc225E0945FE176C72F74",
        ),
        protocolPollMs: envNumber(
            "NEXT_PUBLIC_GOLIATH_STAKING_PROTOCOL_POLL_MS",
            30000,
        ),
        balancePollMs: envNumber(
            "NEXT_PUBLIC_GOLIATH_STAKING_BALANCE_POLL_MS",
            15000,
        ),
    };

    return { dex, tokens, bridge, migration, staking };
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const goliathConfig: GoliathConfig = loadGoliathConfig();
