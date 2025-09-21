/**
 * Utility functions for farm-related components
 */

export type StakedValueData = {
    main: string;
    secondary: string | null;
};

/**
 * Parses a staked value string to separate main value and secondary value (usually in parentheses)
 * @param value - The staked value string (e.g., "99.53K ($2.69M)")
 * @returns Object with main and secondary values
 */
export const parseStakedValue = (value: string): StakedValueData => {
    const match = value.match(/^(.+?)\s*(\(.+\))$/);
    if (match) {
        return {
            main: match[1].trim(),
            secondary: match[2].trim(),
        };
    }
    return { main: value, secondary: null };
};
