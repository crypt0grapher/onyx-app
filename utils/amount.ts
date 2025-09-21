import BigNumber from "bignumber.js";

const XCN_DECIMALS = 18;

/**
 * Safely converts various types to BigNumber
 * @param value - Value to convert (bigint, string, number)
 * @returns BigNumber instance
 */
export const toBN = (value: bigint | string | number): BigNumber => {
    return new BigNumber(String(value));
};

export const formatXcnAmountFromWei = (
    wei: string | number | BigNumber,
    decimals = XCN_DECIMALS,
    fractionDigits = 4
): string => {
    if (wei === null || wei === undefined) return "--";
    try {
        const tokens = new BigNumber(wei.toString()).div(
            new BigNumber(10).pow(decimals)
        );
        const value = tokens.toNumber();
        if (!Number.isFinite(value)) return "--";
        const formatted = value.toLocaleString("en-US", {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        });
        return `${formatted} XCN`;
    } catch {
        return "--";
    }
};

export default formatXcnAmountFromWei;
