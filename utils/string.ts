/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalizes transaction type string
 * @param type - The transaction type to capitalize
 * @returns The capitalized transaction type
 */
export const capitalizeType = (type: string): string => {
    return capitalize(String(type));
};
