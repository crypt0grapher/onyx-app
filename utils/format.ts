import { BigNumber } from "bignumber.js";

/**
 * Format a percentage value for display
 * @param value - The percentage value (e.g., 15.75 for 15.75%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "15.75%")
 */
export const formatToReadablePercentage = (
    value: number,
    decimals = 2
): string => {
    if (value === null || value === undefined || !isFinite(value)) {
        return "--";
    }
    return `${value.toFixed(decimals)}%`;
};

/**
 * Convert Wei to token amount and format for display
 * @param valueWei - The value in Wei as BigNumber or string
 * @param decimals - Token decimals (default: 18)
 * @param displayDecimals - Number of decimals to show (default: 2)
 * @param shortenLargeValue - Whether to shorten large values (e.g., "1.2M")
 * @returns Formatted token string
 */
export const convertWeiToTokens = (
    valueWei: BigNumber | string,
    decimals = 18,
    displayDecimals = 2,
    shortenLargeValue = false
): string => {
    if (!valueWei) {
        return "--";
    }

    try {
        const value = new BigNumber(valueWei.toString()).div(
            new BigNumber(10).pow(decimals)
        );

        if (shortenLargeValue) {
            return formatLargeNumber(value.toNumber(), displayDecimals);
        }

        const multiplier = Math.pow(10, displayDecimals);
        const truncated =
            Math.floor(value.toNumber() * multiplier) / multiplier;
        return truncated.toFixed(displayDecimals);
    } catch {
        return "--";
    }
};

/**
 * Format large numbers with K, M, B suffixes
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23M", "4.56B")
 */
export const formatLargeNumber = (value: number, decimals = 2): string => {
    if (value === null || value === undefined || !isFinite(value)) {
        return "--";
    }

    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1e9) {
        return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
    }
    if (absValue >= 1e6) {
        return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
    }
    if (absValue >= 1e3) {
        return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
    }

    return `${sign}${absValue.toFixed(decimals)}`;
};

/**
 * Format currency values (USD)
 * @param value - The value in cents
 * @param shortenLargeValue - Whether to shorten large values
 * @returns Formatted currency string
 */
export const formatCentsToReadableValue = (
    value: BigNumber | number,
    shortenLargeValue = false
): string => {
    if (!value) {
        return "--";
    }

    try {
        const dollarValue = new BigNumber(value.toString()).div(100).toNumber();

        if (shortenLargeValue) {
            return `${formatLargeNumber(dollarValue, 2)}`;
        }

        return `${dollarValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    } catch {
        return "--";
    }
};

/**
 * Calculate staking APR from contract data
 * @param rewardPerBlock - Reward per block in Wei
 * @param totalStaked - Total staked amount in Wei
 * @param blocksPerDay - Number of blocks per day (default: 7200)
 * @param daysPerYear - Number of days per year (default: 365)
 * @returns APR as a percentage number
 */
export const calculateStakingAPR = (
    rewardPerBlock: BigNumber | string,
    totalStaked: BigNumber | string,
    blocksPerDay = 7200,
    daysPerYear = 365
): number => {
    if (!rewardPerBlock || !totalStaked) {
        return 0;
    }

    try {
        const rewardBN = new BigNumber(rewardPerBlock.toString());
        const totalStakedBN = new BigNumber(totalStaked.toString());

        if (totalStakedBN.isZero()) {
            return 0;
        }

        const apr = rewardBN
            .times(blocksPerDay)
            .times(daysPerYear)
            .div(totalStakedBN)
            .times(100);

        return apr.toNumber();
    } catch {
        return 0;
    }
};

/**
 * Calculate daily emission from reward per block
 * @param rewardPerBlock - Reward per block in Wei
 * @param blocksPerDay - Number of blocks per day (default: 7200)
 * @param decimals - Token decimals (default: 18)
 * @returns Daily emission as a number
 */
export const calculateDailyEmission = (
    rewardPerBlock: BigNumber | string,
    blocksPerDay = 7200,
    decimals = 18
): number => {
    if (!rewardPerBlock) {
        return 0;
    }

    try {
        const rewardBN = new BigNumber(rewardPerBlock.toString());

        const dailyEmission = rewardBN
            .times(blocksPerDay)
            .div(new BigNumber(10).pow(decimals));

        return dailyEmission.toNumber();
    } catch {
        return 0;
    }
};

/**
 * Format a token balance from Wei with trimmed trailing zeros
 * @param valueWei - Value in Wei as bigint or string/number
 * @param decimals - Token decimals
 * @param maxDecimals - Max decimals to display (default 6)
 */
export const formatTokenBalance = (
    valueWei: bigint | string | number | undefined,
    decimals: number,
    maxDecimals = 6
): string => {
    if (valueWei === undefined || valueWei === null) return "0";
    try {
        const weiStr =
            typeof valueWei === "bigint"
                ? valueWei.toString()
                : String(valueWei);
        const tokens = new BigNumber(weiStr).div(
            new BigNumber(10).pow(decimals)
        );
        const factor = new BigNumber(10).pow(maxDecimals);
        const floored = tokens
            .times(factor)
            .integerValue(BigNumber.ROUND_FLOOR)
            .div(factor);
        const fixed = floored.toFixed(maxDecimals);
        return fixed.replace(/\.0+$|(?<=\..*?)0+$/g, "").replace(/\.$/, "");
    } catch {
        return "0";
    }
};

/**
 * Calculates the USD value of a token amount.
 * @param amount The amount of the token as a string.
 * @param priceUsd The USD price of one token.
 * @returns The total value in USD.
 */
export const calculateUsdValue = (amount: string, priceUsd: number) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount * priceUsd;
};
