import ethIcon from "@/assets/icons/eth.svg";
import xcnIcon from "@/assets/icons/XCN.svg";
import usdcIcon from "@/assets/icons/usdc.svg";
import usdtIcon from "@/assets/icons/usdt.svg";
import daiIcon from "@/assets/icons/dai.svg";
import wbtcIcon from "@/assets/icons/wbtc.svg";

export interface Token {
    id: string;
    name: string;
    symbol: string;
    icon: string;
    decimals: number;
    address?: string;
}

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    lastUpdated: number;
}

export interface SwapSettings {
    slippageTolerance: number;
    gasPrice: number;
    gasFee: number;
}

export const SUPPORTED_TOKENS: Token[] = [
    {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        icon: ethIcon,
        decimals: 18,
        address: "0x1234655495698459499",
    },
    {
        id: "onyx-coin",
        name: "Onyx Coin",
        symbol: "XCN",
        icon: xcnIcon,
        decimals: 18,
        address: "0xa2cd3d43c775978a96bdbf12d733d5a1ed94fb18",
    },
    {
        id: "usd-coin",
        name: "USD Coin",
        symbol: "USDC",
        icon: usdcIcon,
        decimals: 6,
        address: "0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c8",
    },
    {
        id: "tether",
        name: "Tether",
        symbol: "USDT",
        icon: usdtIcon,
        decimals: 6,
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    {
        id: "dai",
        name: "Dai",
        symbol: "DAI",
        icon: daiIcon,
        decimals: 18,
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
    {
        id: "wrapped-bitcoin",
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        icon: wbtcIcon,
        decimals: 8,
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    },
];

export const getTokenBySymbol = (symbol: string): Token | undefined => {
    return SUPPORTED_TOKENS.find((token) => token.symbol === symbol);
};

export const formatTokenAmount = (
    amount: number,
    decimals: number = 6
): string => {
    if (amount === 0) return "0";

    if (amount >= 1e15) {
        return (amount / 1e15).toFixed(3) + "Q";
    }

    if (amount >= 1e12) {
        return (amount / 1e12).toFixed(3) + "T";
    }

    if (amount >= 1e9) {
        return (amount / 1e9).toFixed(3) + "B";
    }

    if (amount >= 1e6) {
        return (amount / 1e6).toFixed(3) + "M";
    }

    const maxDecimals = Math.min(decimals, 6);

    if (amount < 0.01) {
        return amount.toFixed(maxDecimals);
    }

    return amount.toFixed(maxDecimals);
};

export const formatUSDValue = (amount: number): string => {
    if (amount === 0) return "$0.00";

    if (amount >= 1e15) {
        return `~ $1e+${Math.floor(Math.log10(amount))}`;
    }

    if (amount >= 1e12) {
        return `~ $${(amount / 1e12).toFixed(2)}T`;
    }

    if (amount >= 1e9) {
        return `~ $${(amount / 1e9).toFixed(2)}B`;
    }

    if (amount >= 1e6) {
        return `~ $${(amount / 1e6).toFixed(2)}M`;
    }

    if (amount < 0.01) {
        return `~ $${amount.toFixed(6)}`;
    }

    return `~ $${amount.toFixed(2)}`;
};
