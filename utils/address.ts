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

export default truncateAddress;
