import { isAddress, parseAbiParameters, type AbiParameter } from "viem";

export interface ParsedFunction {
    inputs: readonly AbiParameter[];
}

/**
 * Parses a function signature and returns the parsed parameters if valid
 * @param signature - Function signature like "transfer(address,uint256)"
 * @returns Parsed function info if valid, undefined otherwise
 */
export const parseFunctionSignature = (
    signature: string | undefined
): ParsedFunction | undefined => {
    if (!signature || signature.trim() === "") return undefined;

    try {
        const match = signature.match(/\(([^)]*)\)/);
        if (!match) return undefined;

        const paramsString = match[1].trim();

        if (paramsString === "") {
            return { inputs: [] };
        }

        const inputs = parseAbiParameters(paramsString);

        return { inputs };
    } catch {
        return undefined;
    }
};

/**
 * Validates if a string is a valid Ethereum address
 * @param address - Address to validate
 * @returns true if valid address
 */
export const isValidAddress = (address: string): boolean => {
    return isAddress(address);
};

/**
 * Validates if a value is a valid numeric string (for Wei amounts)
 * @param value - Value to validate
 * @returns true if valid or empty, false otherwise
 */
export const isValidValue = (value: string): boolean => {
    if (!value || value === "") return true;
    return /^\d+$/.test(value);
};

/**
 * Validates if a signature is valid
 * @param signature - Function signature to validate
 * @returns true if valid
 */
export const isValidSignature = (signature: string): boolean => {
    return !!signature && !!parseFunctionSignature(signature);
};

/**
 * Formats a callData value based on its type
 * Handles special cases like arrays and booleans
 */
export const formatCallDataValue = (
    value: string,
    type: string
): string | number | string[] | boolean | bigint => {
    if (value?.startsWith("[") && value?.endsWith("]")) {
        try {
            return JSON.parse(value) as string[];
        } catch {
            return value;
        }
    }

    if (type === "bool") {
        if (value === "0" || value.toLowerCase() === "false") {
            return false;
        }
        return true;
    }

    if (type.startsWith("uint") || type.startsWith("int")) {
        try {
            return BigInt(value);
        } catch {
            return value;
        }
    }

    return value;
};

/**
 * Validates a single callData argument against its expected type
 * @param value - The argument value
 * @param type - The expected Solidity type
 * @returns true if valid
 */
export const isValidCallDataArgument = (
    value: string,
    type: string
): boolean => {
    if (!value || value.trim() === "") return false;

    try {
        if (type === "address") {
            return isAddress(value);
        }

        if (type === "bool") {
            return true;
        }

        if (type.startsWith("uint") || type.startsWith("int")) {
            return /^\d+$/.test(value);
        }

        if (type.startsWith("bytes")) {
            return value.startsWith("0x");
        }

        formatCallDataValue(value, type);

        return true;
    } catch {
        return false;
    }
};
