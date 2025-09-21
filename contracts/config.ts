import { Address } from "viem";
import xcnStakingAbi from "./abis/xcnStaking";
import xcnTokenAbi from "./abis/xcnToken";
import xcnClaimAbi from "./abis/xcnClaim";
import mainAddresses from "./addresses/main.json";
import tokenAddresses from "./addresses/tokens.json";
import uniSwapRouterAbi from "./abis/uniSwapRouter";
import masterChefAbi from "./abis/masterChef.json";
import governorBravoDelegateAbi from "./abis/governorBravoDelegate";
import oracleAbi from "./abis/oracle.json";

export const SUPPORTED_CHAINS = {
    mainnet: {
        id: 1,
        idString: "1",
    },
} as const;

export const CONTRACTS = {
    xcnToken: {
        address: tokenAddresses.xcn[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: xcnTokenAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    masterChef: {
        address: mainAddresses.masterChef[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: masterChefAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    xcnStaking: {
        address: mainAddresses.xcnStaking[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: xcnStakingAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    xcnClaim: {
        address: mainAddresses.xcnClaim[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: xcnClaimAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    treasury: {
        address: mainAddresses.xcnClaim[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    oracle: {
        address: mainAddresses.oracle[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: oracleAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    governorBravoDelegator: {
        address: mainAddresses.governorBravoDelegator[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: governorBravoDelegateAbi as unknown as object[],
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
} as const;

export const STAKING_CONSTANTS = {
    STAKING_APR_BLOCKS_PER_DAY: 6400,
    BLOCKS_PER_DAY: 7200,
    DAYS_PER_YEAR: 365,
    SECONDS_PER_BLOCK: 12,
    SECONDS_PER_DAY: 86400,
    XCN_DECIMALS: 18,
    XCN_POOL_ID: 0,
} as const;

export const UNISWAP = {
    router: {
        address: mainAddresses.uniSwapRouter[
            SUPPORTED_CHAINS.mainnet.idString
        ] as Address,
        abi: uniSwapRouterAbi,
        chainId: SUPPORTED_CHAINS.mainnet.id,
    },
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address,
} as const;
