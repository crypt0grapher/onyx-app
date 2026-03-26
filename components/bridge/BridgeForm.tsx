"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAccount, useChainId, useBalance, useReadContract } from "wagmi";
import { type Address, parseUnits, erc20Abi } from "viem";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import Divider from "@/components/ui/common/Divider";
import BridgeTokenSelector from "@/components/bridge/BridgeTokenSelector";
import BridgeConfirmModal from "@/components/bridge/BridgeConfirmModal";
import BridgeStatusModal from "@/components/bridge/BridgeStatusModal";
import useDebounce from "@/hooks/common/useDebounce";
import type { BridgeOperation } from "@/hooks/bridge/types";
import { goliathConfig } from "@/config/goliath";
import { getGoliathNetwork } from "@/config/networks";
import { useSwitchNetwork } from "@/hooks/wallet/useSwitchNetwork";
import { useBridgeExecutor } from "@/hooks/bridge/useBridgeExecutor";
import { useBridgeOperations } from "@/hooks/bridge/useBridgeOperations";
import {
    type BridgeDirection,
    type BridgeTokenSymbol,
    type FeeQuoteResponse,
    type LimitsResponse,
    bridgeApiService,
} from "@/lib/api/services/bridge";
import bridgeIcon from "@/assets/icons/bridge.svg";

// ---------------------------------------------------------------------------
// Token decimals
// ---------------------------------------------------------------------------

const TOKEN_DECIMALS: Record<BridgeTokenSymbol, number> = {
    ETH: 18,
    USDC: 6,
    XCN: 18,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const goliathNetwork = getGoliathNetwork();
const SOURCE_CHAIN_NAME = "Ethereum";
const GOLIATH_CHAIN_NAME = goliathNetwork.name;

/**
 * Returns the ERC-20 token address for the given token and direction.
 * Returns `null` when the token is native (no approval needed).
 */
function getTokenAddress(
    token: BridgeTokenSymbol,
    direction: BridgeDirection,
): Address | null {
    if (direction === "SOURCE_TO_GOLIATH") {
        // On the source chain, ETH is native -- no address
        if (token === "ETH") return null;
        if (token === "USDC") return goliathConfig.bridge.sourceTokens.USDC;
        if (token === "XCN") return goliathConfig.bridge.sourceTokens.XCN;
    } else {
        // On Goliath, XCN is native -- no address
        if (token === "XCN") return null;
        if (token === "ETH") return goliathConfig.tokens.ETH;
        if (token === "USDC") return goliathConfig.tokens.USDC;
    }
    return null;
}

/**
 * Returns the bridge contract address the user interacts with.
 */
function getBridgeAddress(direction: BridgeDirection): Address {
    return direction === "SOURCE_TO_GOLIATH"
        ? goliathConfig.bridge.sourceBridgeAddress
        : goliathConfig.bridge.goliathBridgeAddress;
}

/**
 * Returns the expected chain ID for the current direction.
 */
function getExpectedChainId(direction: BridgeDirection): number {
    return direction === "SOURCE_TO_GOLIATH"
        ? goliathConfig.bridge.sourceChainId
        : goliathNetwork.chainId;
}

/**
 * Returns the target network name when the user needs to switch chains.
 */
function getExpectedChainName(direction: BridgeDirection): string {
    return direction === "SOURCE_TO_GOLIATH" ? SOURCE_CHAIN_NAME : GOLIATH_CHAIN_NAME;
}

/**
 * Returns true when the token is native for the current direction.
 */
function isNativeToken(
    token: BridgeTokenSymbol,
    direction: BridgeDirection,
): boolean {
    return getTokenAddress(token, direction) === null;
}

/**
 * Sanitise amount input to allow only valid decimal numbers.
 */
function sanitiseAmount(value: string, maxDecimals: number): string {
    // Allow only digits and a single dot
    const cleaned = value.replace(/[^0-9.]/g, "");

    // Prevent multiple dots
    const parts = cleaned.split(".");
    if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");

    // Cap decimal places
    if (parts[1] && parts[1].length > maxDecimals) {
        return parts[0] + "." + parts[1].substring(0, maxDecimals);
    }

    return cleaned;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BridgeForm: React.FC = () => {
    const t = useTranslations("bridge");
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    // ---- State ------------------------------------------------------------------
    const [direction, setDirection] = useState<BridgeDirection>("SOURCE_TO_GOLIATH");
    const [selectedToken, setSelectedToken] = useState<BridgeTokenSymbol>("ETH");
    const [amount, setAmount] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [activeOperation, setActiveOperation] = useState<BridgeOperation | null>(null);
    const [feeQuote, setFeeQuote] = useState<FeeQuoteResponse | null>(null);
    const [isFetchingFee, setIsFetchingFee] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [limits, setLimits] = useState<LimitsResponse | null>(null);

    const debouncedAmount = useDebounce(amount, 500);

    // ---- Network switch ---------------------------------------------------------
    const { switchNetwork, isPending: isSwitchPending } = useSwitchNetwork();

    // ---- Derived values ---------------------------------------------------------
    const expectedChainId = getExpectedChainId(direction);
    const isOnCorrectNetwork = chainId === expectedChainId;
    const tokenAddress = getTokenAddress(selectedToken, direction);
    const bridgeAddress = getBridgeAddress(direction);
    const isNative = isNativeToken(selectedToken, direction);
    const decimals = TOKEN_DECIMALS[selectedToken];

    // ---- Balance ----------------------------------------------------------------
    // Native balance on the current chain
    const { data: nativeBalance } = useBalance({
        address,
        query: { enabled: isConnected && isOnCorrectNetwork },
    });

    // ERC-20 balance (only when the selected token is not native)
    const { data: erc20Balance } = useBalance({
        address,
        token: tokenAddress ?? undefined,
        query: {
            enabled: isConnected && isOnCorrectNetwork && tokenAddress !== null,
        },
    });

    const balance = useMemo(() => {
        if (!isConnected || !isOnCorrectNetwork) return "0";
        if (isNative) {
            return nativeBalance?.formatted ?? "0";
        }
        return erc20Balance?.formatted ?? "0";
    }, [isConnected, isOnCorrectNetwork, isNative, nativeBalance, erc20Balance]);

    // ---- ERC-20 allowance -------------------------------------------------------
    const { data: allowanceData } = useReadContract({
        address: tokenAddress ?? undefined,
        abi: erc20Abi,
        functionName: "allowance",
        args:
            address && tokenAddress
                ? [address, bridgeAddress]
                : undefined,
        query: {
            enabled:
                isConnected &&
                isOnCorrectNetwork &&
                tokenAddress !== null &&
                !!address,
        },
    });

    const needsApproval = useMemo(() => {
        if (isNative || !amount || parseFloat(amount) <= 0) return false;
        if (allowanceData === undefined) return false;
        try {
            const amountWei = parseUnits(amount, decimals);
            return (allowanceData as bigint) < amountWei;
        } catch {
            return false;
        }
    }, [isNative, amount, decimals, allowanceData]);

    // ---- Bridge execution -------------------------------------------------------
    const amountWei = useMemo(() => {
        if (!amount || parseFloat(amount) <= 0) return 0n;
        try { return parseUnits(amount, decimals); } catch { return 0n; }
    }, [amount, decimals]);

    const {
        execute: executeBridge,
        approve: approveBridge,
        needsApproval: executorNeedsApproval,
        isPending: isBridgePending,
    } = useBridgeExecutor(direction, selectedToken, tokenAddress, amountWei);

    const { addOperation, updateOperation } = useBridgeOperations();

    // ---- Fee quote --------------------------------------------------------------
    useEffect(() => {
        const fetchFee = async () => {
            if (
                !debouncedAmount ||
                parseFloat(debouncedAmount) <= 0 ||
                direction !== "GOLIATH_TO_SOURCE"
            ) {
                setFeeQuote(null);
                return;
            }

            setIsFetchingFee(true);
            try {
                const quote = await bridgeApiService.getFeeQuote({
                    token: selectedToken,
                    amount: debouncedAmount,
                    direction: "goliathToSepolia",
                });
                setFeeQuote(quote);
            } catch {
                setFeeQuote(null);
            } finally {
                setIsFetchingFee(false);
            }
        };

        fetchFee();
    }, [debouncedAmount, selectedToken, direction]);

    // ---- Fetch bridge limits on mount -------------------------------------------
    useEffect(() => {
        let cancelled = false;
        bridgeApiService.getLimits().then((data) => {
            if (!cancelled) setLimits(data);
        }).catch(() => {
            // Fall back to generic minimum — limits state stays null
        });
        return () => { cancelled = true; };
    }, []);

    // ---- Handlers ---------------------------------------------------------------
    const handleAmountChange = useCallback(
        (value: string) => {
            setAmount(sanitiseAmount(value, decimals));
        },
        [decimals],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(balance);
    }, [balance]);

    const handleSwapDirection = useCallback(() => {
        setDirection((prev) =>
            prev === "SOURCE_TO_GOLIATH" ? "GOLIATH_TO_SOURCE" : "SOURCE_TO_GOLIATH",
        );
        setAmount("");
        setFeeQuote(null);
    }, []);

    const handleOpenConfirm = useCallback(() => {
        setShowConfirmModal(true);
    }, []);

    const handleCloseConfirm = useCallback(() => {
        if (!isConfirming) setShowConfirmModal(false);
    }, [isConfirming]);

    const handleConfirmBridge = useCallback(async () => {
        if (!address || !amount) return;
        setIsConfirming(true);

        const opId = crypto.randomUUID();
        const op: BridgeOperation = {
            id: opId,
            direction,
            token: selectedToken,
            amountHuman: amount,
            amountAtomic: amountWei.toString(),
            sender: address,
            recipient: address,
            originChainId: direction === "SOURCE_TO_GOLIATH"
                ? goliathConfig.bridge.sourceChainId
                : goliathNetwork.chainId,
            destinationChainId: direction === "SOURCE_TO_GOLIATH"
                ? goliathNetwork.chainId
                : goliathConfig.bridge.sourceChainId,
            originTxHash: null,
            destinationTxHash: null,
            depositId: null,
            withdrawId: null,
            status: "PENDING_ORIGIN_TX",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            errorMessage: null,
        };

        addOperation(op);

        try {
            const txHash = await executeBridge(address);

            if (txHash) {
                updateOperation(opId, { originTxHash: txHash, status: "CONFIRMING" });
                op.originTxHash = txHash;
                op.status = "CONFIRMING";
            }

            setActiveOperation(op);
            setShowConfirmModal(false);
            setAmount("");
            setTimeout(() => setShowStatusModal(true), 210);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Bridge failed";
            if (!msg.includes("rejected") && !msg.includes("denied") && !msg.includes("4001")) {
                console.error("Bridge execution failed:", msg);
                updateOperation(opId, { status: "FAILED", errorMessage: msg });
            } else {
                // User rejected — remove the pending operation
                updateOperation(opId, { status: "FAILED", errorMessage: "Transaction rejected" });
            }
        } finally {
            setIsConfirming(false);
        }
    }, [address, amount, amountWei, direction, selectedToken, executeBridge, addOperation, updateOperation]);

    // ---- Validation -------------------------------------------------------------
    const hasValidAmount = !!amount && parseFloat(amount) > 0;
    const hasInsufficientBalance =
        hasValidAmount && parseFloat(amount) > parseFloat(balance);

    // Per-token minimum: only enforced for GOLIATH_TO_SOURCE (withdrawals)
    const tokenMinimum = useMemo(() => {
        if (direction !== "GOLIATH_TO_SOURCE") return null;
        const tokenLimits = limits?.goliathToSepolia?.tokens?.[selectedToken];
        if (tokenLimits?.minAmountFormatted) return tokenLimits.minAmountFormatted;
        // Fallback to generic minimum when limits API failed or token not found
        return goliathConfig.bridge.minAmount;
    }, [direction, limits, selectedToken]);

    const isBelowMinimum =
        hasValidAmount &&
        tokenMinimum !== null &&
        parseFloat(amount) < parseFloat(tokenMinimum);

    // ---- Button label -----------------------------------------------------------
    const buttonLabel = useMemo(() => {
        if (!isConnected) return t("actions.connect");
        if (isSwitchPending) return t("actions.switching");
        if (!isOnCorrectNetwork)
            return t("actions.switchNetwork", {
                network: getExpectedChainName(direction),
            });
        if (!hasValidAmount) return t("actions.enterAmount");
        if (needsApproval || executorNeedsApproval)
            return t("actions.approve", { token: selectedToken });
        if (isBridgePending) return t("actions.bridging");
        return t("actions.bridge", { token: selectedToken });
    }, [isConnected, isSwitchPending, isOnCorrectNetwork, hasValidAmount, needsApproval, executorNeedsApproval, isBridgePending, direction, selectedToken, t]);

    const isButtonDisabled =
        !isConnected ||
        isSwitchPending ||
        isBridgePending ||
        (isOnCorrectNetwork && (
            !hasValidAmount ||
            hasInsufficientBalance ||
            isBelowMinimum
        ));

    // ---- Unified click handler --------------------------------------------------
    const handleButtonClick = useCallback(async () => {
        if (!isConnected) return;
        if (!isOnCorrectNetwork) {
            switchNetwork({ chainId: expectedChainId });
            return;
        }
        if (needsApproval || executorNeedsApproval) {
            await approveBridge();
            return;
        }
        handleOpenConfirm();
    }, [isConnected, isOnCorrectNetwork, expectedChainId, needsApproval, executorNeedsApproval, switchNetwork, approveBridge, handleOpenConfirm]);

    // ---- Receive amount ---------------------------------------------------------
    const receiveAmount = useMemo(() => {
        if (direction === "SOURCE_TO_GOLIATH") return amount || "0";
        return feeQuote?.outputFormatted ?? (amount || "0");
    }, [direction, amount, feeQuote]);

    // ---- Fee display ------------------------------------------------------------
    const feeDisplay = useMemo(() => {
        if (direction === "SOURCE_TO_GOLIATH") return t("confirm.feeInfo");
        if (feeQuote) return `${feeQuote.feeFormatted} ${selectedToken}`;
        return "--";
    }, [direction, feeQuote, selectedToken, t]);

    // ---- Rendering --------------------------------------------------------------
    const fromNetwork =
        direction === "SOURCE_TO_GOLIATH" ? SOURCE_CHAIN_NAME : GOLIATH_CHAIN_NAME;
    const toNetwork =
        direction === "SOURCE_TO_GOLIATH" ? GOLIATH_CHAIN_NAME : SOURCE_CHAIN_NAME;

    return (
        <>
            <div className="w-full max-w-[530px] flex flex-col items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414] p-4 gap-4">
                {/* Direction selector */}
                <div className="w-full flex flex-col gap-3">
                    {/* From */}
                    <div className="flex items-center justify-between">
                        <span className="text-secondary text-[14px] font-medium leading-[20px]">
                            {t("form.from")}
                        </span>
                        <span className="text-primary text-[14px] font-medium leading-[20px]">
                            {fromNetwork}
                        </span>
                    </div>

                    {/* Swap direction button */}
                    <div className="flex justify-center my-[-6px] relative z-10">
                        <button
                            type="button"
                            onClick={handleSwapDirection}
                            className="flex items-center justify-center w-10 h-10 z-10 rounded-full border border-[#292929] bg-[#1B1B1B] cursor-pointer transition-transform duration-300 ease-out hover:rotate-180 hover:border-[#3a3a3a] hover:shadow-[0_0_12px_rgba(255,255,255,0.06)] active:scale-95"
                            aria-label={t("form.swapDirection")}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 4V16M10 16L6 12M10 16L14 12"
                                    stroke="#E6E6E6"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* To */}
                    <div className="flex items-center justify-between">
                        <span className="text-secondary text-[14px] font-medium leading-[20px]">
                            {t("form.to")}
                        </span>
                        <span className="text-primary text-[14px] font-medium leading-[20px]">
                            {toNetwork}
                        </span>
                    </div>
                </div>

                <Divider />

                {/* Token selector */}
                <BridgeTokenSelector
                    selectedToken={selectedToken}
                    onSelect={setSelectedToken}
                />

                <Divider />

                {/* Amount input */}
                <div className="w-full flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-secondary text-[14px] font-medium leading-[20px]">
                            {t("form.amount")}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-secondary text-[14px] font-normal leading-[20px]">
                                {t("form.balance")}:
                            </span>
                            <span className="text-primary text-[14px] font-medium leading-[20px]">
                                {isConnected && isOnCorrectNetwork
                                    ? `${parseFloat(balance).toFixed(4)} ${selectedToken}`
                                    : `0.00 ${selectedToken}`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full rounded-[1000px] border border-[#1F1F1F] bg-[#0F0F0F] p-[10px_16px]">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent border-none outline-none text-primary text-[14px] font-medium leading-[20px] placeholder:text-secondary [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]"
                            aria-label={t("form.amount")}
                        />
                        <button
                            type="button"
                            onClick={handleMaxClick}
                            disabled={!isConnected || !isOnCorrectNetwork}
                            className="text-[12px] font-medium leading-[16px] text-[#E6E6E6] bg-[#292929] rounded-full px-3 py-1 cursor-pointer transition-all duration-200 hover:bg-[#3a3a3a] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {t("form.max")}
                        </button>
                    </div>

                    {/* Validation messages */}
                    {hasInsufficientBalance && (
                        <span className="text-red-400 text-[12px] leading-[16px]">
                            {t("validation.insufficientBalance")}
                        </span>
                    )}
                    {isBelowMinimum && !hasInsufficientBalance && (
                        <span className="text-red-400 text-[12px] leading-[16px]">
                            {t("validation.minAmount", {
                                min: `${Number(tokenMinimum).toLocaleString()} ${selectedToken}`,
                            })}
                        </span>
                    )}
                </div>

                {/* You receive */}
                <div className="w-full rounded-[12px] bg-[#0F0F0F] p-4">
                    <span className="text-secondary text-[14px] font-normal leading-[20px]">
                        {t("form.youReceive")}
                    </span>
                    <div className="mt-2 text-primary text-[24px] font-medium leading-[32px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {isFetchingFee && direction === "GOLIATH_TO_SOURCE" ? (
                            <div className="h-8 w-32 rounded bg-[#1B1B1B] animate-pulse" />
                        ) : (
                            <>{receiveAmount} {selectedToken}</>
                        )}
                    </div>
                </div>

                {/* Summary panel */}
                <div className="w-full rounded-[12px] bg-[#0F0F0F] p-4 flex flex-col gap-2">
                    {/* Fee row */}
                    <div className="flex justify-between items-center">
                        <span className="text-[#808080] text-[14px] font-normal leading-[20px]">
                            {t("form.fee")}
                        </span>
                        <span className={`text-[14px] font-medium leading-[20px] ${
                            direction === "SOURCE_TO_GOLIATH" ? "text-green-400" : "text-[#E6E6E6]"
                        }`}>
                            {isFetchingFee ? (
                                <span className="inline-block w-3 h-3 border-2 border-[#808080] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                feeDisplay
                            )}
                        </span>
                    </div>

                    {/* ETA row */}
                    <div className="flex justify-between items-center">
                        <span className="text-[#808080] text-[14px] font-normal leading-[20px]">
                            {t("form.estimatedArrival")}
                        </span>
                        <span className="text-[#E6E6E6] text-[14px] font-medium leading-[20px]">
                            {t("form.estimatedArrivalValue")}
                        </span>
                    </div>

                </div>

                {/* Action button */}
                <div className="w-full">
                    <PrimaryButton
                        label={buttonLabel}
                        icon={bridgeIcon}
                        onClick={handleButtonClick}
                        disabled={isButtonDisabled}
                    />
                </div>
            </div>

            {/* Confirmation modal */}
            <BridgeConfirmModal
                isOpen={showConfirmModal}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmBridge}
                direction={direction}
                token={selectedToken}
                amount={amount}
                fee={feeDisplay}
                estimatedTime={t("form.estimatedArrivalValue")}
                sourceChainName={SOURCE_CHAIN_NAME}
                goliathChainName={GOLIATH_CHAIN_NAME}
                isConfirming={isConfirming}
            />

            {/* Status modal (step-by-step progress) */}
            <BridgeStatusModal
                operation={activeOperation}
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                onStatusChange={updateOperation}
            />
        </>
    );
};

export default BridgeForm;
