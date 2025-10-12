import { encodeAbiParameters } from "viem";
import { parseFunctionSignature, formatCallDataValue } from "./validation";

/**
 * Encodes parameters for contract calls using viem
 * @param types - Array of Solidity types
 * @param values - Array of values corresponding to the types
 * @returns Encoded hex string
 */
export const encodeParameters = (
    types: string[],
    values: (string | number | string[] | boolean | bigint)[]
): string => {
    if (types.length === 0) return "0x";

    const params = types.map((type, index) => ({
        type,
        name: `param${index}`,
    }));

    return encodeAbiParameters(params, values as never);
};

/**
 * Encodes callData for a proposal action
 * @param signature - Function signature like "transfer(address,uint256)"
 * @param callData - Array of argument values as strings
 * @returns Encoded callData hex string
 */
export const encodeCallData = (
    signature: string,
    callData: (string | undefined)[]
): string => {
    const fragment = parseFunctionSignature(signature);
    if (!fragment) return "0x";

    const callDataTypes = fragment.inputs.map((input) => input.type);

    if (callDataTypes.length === 0) {
        return "0x";
    }

    const processedCallData = callData.reduce((acc, curr, currentIndex) => {
        if (curr !== undefined && curr !== "") {
            const type = callDataTypes[currentIndex];
            const formattedValue = formatCallDataValue(curr, type);
            acc.push(formattedValue);
        }
        return acc;
    }, [] as (string | number | string[] | boolean | bigint)[]);

    if (processedCallData.length !== callDataTypes.length) {
        console.warn(
            `CallData length mismatch: expected ${callDataTypes.length}, got ${processedCallData.length}`
        );
        return "0x";
    }

    return encodeParameters(callDataTypes, processedCallData);
};
