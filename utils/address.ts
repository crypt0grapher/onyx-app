/**
 * Truncate an address for compact display.
 *
 * @param address - The address string to truncate
 * @returns a shortened display string or an empty string when input is falsy
 */
export const truncateAddress = (address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Truncate a transaction hash for display, showing more leading characters
 * than a wallet address.  e.g. 0x6b7a05a11e...f1df
 *
 * Hedera transaction IDs (e.g. `0.0.1083@1774674719.778114029`) are shown
 * in full because they are short enough to display inline.
 */
export const truncateTxHash = (hash: string): string => {
    if (!hash) return "";
    // Hedera tx IDs are short (~30 chars) -- display in full
    if (hash.includes("@")) return hash;
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 12)}...${hash.slice(-4)}`;
};

export default truncateAddress;
