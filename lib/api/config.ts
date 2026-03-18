export const API_CONFIG = {
  COINGECKO_BASE_URL: "https://api.coingecko.com/api/v3",
  ONYX_BASE_URL: "https://v2api.onyx.org/api",
  DEFAULT_TIMEOUT: 8000,
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_INTERVAL: 5000,
  CACHE_DURATION: 30000,
} as const;

export const ENDPOINTS = {
  COINGECKO_SIMPLE_PRICE: "/simple/price",
  COINGECKO_COINS: "/coins",
  ONYX_XCN: "/xcn",
} as const;

export const COINGECKO_CONFIG = {
  TOKEN_IDS: {
    XCN: "chain-2",
    ETH: "ethereum",
  },
  VS_CURRENCIES: {
    USD: "usd",
    EUR: "eur",
    BTC: "btc",
    ETH: "eth",
  },
  PRICE_CHANGE_PERIODS: {
    "1h": "1h",
    "24h": "24h",
    "7d": "7d",
    "14d": "14d",
    "30d": "30d",
    "200d": "200d",
    "1y": "1y",
  },
} as const;

export const SUBGRAPH_CONFIG = {
  MAINNET_ENDPOINT:
    (process.env.NEXT_PUBLIC_SUBGRAPH_URL as string) ||
    "https://gateway.thegraph.com/api/subgraphs/id/AcAkjzDWFrupaLfEcw7aoTZGcpQEVqs7dM2HCM2aD7hB",
  AUTHORIZATION: process.env.NEXT_PUBLIC_SUBGRAPH_AUTH
    ? `Bearer ${process.env.NEXT_PUBLIC_SUBGRAPH_AUTH}`
    : undefined,
} as const;

export const POINTS_CONFIG = {
  BASE_URL:
    (process.env.NEXT_PUBLIC_POINTS_API_URL as string) ||
    "https://pnt.onyx.org/api/v1",
  SUBSQUID_URL:
    (process.env.NEXT_PUBLIC_POINTS_SQUID_URL as string) ||
    "https://pnt-squid.onyx.org/graphql",
} as const;

export const BRIDGE_CONFIG = {
  BASE_URL:
    (process.env.NEXT_PUBLIC_BRIDGE_API_URL as string) ||
    "https://bridge-api.goliath.net/api/v1",
  DEFAULT_TIMEOUT: 15000,
} as const;
