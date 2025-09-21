"use client";

import { useCallback, useState } from "react";
import { type Token, SUPPORTED_TOKENS } from "@/config/swap";

export interface SwapState {
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    slippageBps: number;
    deadlineSec: number;
    activeInput: "from" | "to";
}

export const useSwapState = () => {
    const [fromToken, setFromToken] = useState<Token>(SUPPORTED_TOKENS[0]);
    const [toToken, setToToken] = useState<Token>(SUPPORTED_TOKENS[1]);
    const [fromAmount, setFromAmount] = useState<string>("");
    const [toAmount, setToAmount] = useState<string>("");
    const [slippageBps] = useState<number>(50);
    const [deadlineSec] = useState<number>(
        Math.floor(Date.now() / 1000) + 20 * 60
    );
    const [activeInput, setActiveInput] = useState<"from" | "to">("from");

    const handleFromAmountChange = useCallback((amount: string) => {
        setActiveInput("from");
        setFromAmount(amount);
        if (!amount || amount.trim() === "") {
            setToAmount("");
        }
    }, []);

    const handleToAmountChange = useCallback((amount: string) => {
        setActiveInput("to");
        setToAmount(amount);
        if (!amount || amount.trim() === "") {
            setFromAmount("");
        }
    }, []);

    const handleFromTokenSelect = useCallback(
        (token: Token) => {
            setFromToken(token);
            if (activeInput === "from" && fromAmount) {
                setTimeout(() => setToAmount(""), 0);
            } else if (activeInput === "to" && toAmount) {
                setTimeout(() => setFromAmount(""), 0);
            } else {
                setFromAmount("");
                setToAmount("");
            }
        },
        [activeInput, fromAmount, toAmount]
    );

    const handleToTokenSelect = useCallback(
        (token: Token) => {
            setToToken(token);
            if (activeInput === "to" && toAmount) {
                setTimeout(() => setFromAmount(""), 0);
            } else if (activeInput === "from" && fromAmount) {
                setTimeout(() => setToAmount(""), 0);
            } else {
                setFromAmount("");
                setToAmount("");
            }
        },
        [activeInput, fromAmount, toAmount]
    );

    const resetAmounts = useCallback(() => {
        setFromAmount("");
        setToAmount("");
        setActiveInput("from");
    }, []);

    return {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        slippageBps,
        deadlineSec,
        activeInput,
        handleFromAmountChange,
        handleToAmountChange,
        handleFromTokenSelect,
        handleToTokenSelect,
        resetAmounts,
        setFromToken,
        setToToken,
        setFromAmount,
        setToAmount,
        setActiveInput,
    };
};

export default useSwapState;
