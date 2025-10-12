"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import Divider from "@/components/ui/common/Divider";
import InputField from "@/components/ui/common/InputField";
import arrowDown from "@/assets/icons/arrow-down.svg";
import closeIcon from "@/assets/icons/close.svg";
import {
    parseFunctionSignature,
    isValidAddress,
    isValidValue,
} from "@/lib/governance/validation";

interface ProposalAction {
    id: string;
    address: string;
    value: string;
    signature: string;
    callData: string[];
}

interface ProposalActionCardProps {
    action: ProposalAction;
    actionNumber: number;
    onActionChange: (action: ProposalAction) => void;
    onDelete: () => void;
    canDelete: boolean;
    isExpandedByDefault?: boolean;
}

const ProposalActionCard: React.FC<ProposalActionCardProps> = ({
    action,
    actionNumber,
    onActionChange,
    onDelete,
    canDelete,
    isExpandedByDefault = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);
    const [hasInitiallyRendered, setHasInitiallyRendered] = useState(false);
    const t = useTranslations("governance.createProposalModal.fields");
    const tErrors = useTranslations("governance.createProposalModal.errors");

    useEffect(() => {
        if (isExpandedByDefault && !hasInitiallyRendered) {
            setHasInitiallyRendered(true);
        }
    }, [isExpandedByDefault, hasInitiallyRendered]);

    const handleFieldChange = (
        field: keyof ProposalAction,
        value: string | string[]
    ) => {
        onActionChange({
            ...action,
            [field]: value,
        });
    };

    const handleCallDataChange = (index: number, value: string) => {
        const newCallData = [...action.callData];
        newCallData[index] = value;
        handleFieldChange("callData", newCallData);
    };

    const signatureFragment = parseFunctionSignature(action.signature);
    const callDataParams = signatureFragment?.inputs || [];

    useEffect(() => {
        if (signatureFragment) {
            const expectedLength = signatureFragment.inputs.length;
            if (action.callData.length !== expectedLength) {
                const newCallData = Array(expectedLength).fill("");
                onActionChange({
                    ...action,
                    callData: newCallData,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action.signature]);

    const actionName = action.signature.trim() || "Action";

    const addressError =
        action.address && !isValidAddress(action.address)
            ? tErrors("addressInvalid")
            : "";
    const valueError =
        action.value && !isValidValue(action.value)
            ? tErrors("valueInvalid")
            : "";
    const signatureError =
        action.signature && !signatureFragment
            ? tErrors("signatureInvalid")
            : "";

    return (
        <div className="flex py-4 flex-col items-start gap-4 self-stretch rounded-lg border border-[#1F1F1F] bg-[#141414]">
            <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2">
                    <span className="text-primary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {actionName}
                    </span>
                    <StatusBadge variant="normal">#{actionNumber}</StatusBadge>
                </div>
                <div className="flex items-center gap-2">
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center w-6 h-6"
                            aria-label="Delete action"
                        >
                            <Image
                                src={closeIcon}
                                alt="Delete"
                                width={16}
                                height={16}
                                className="opacity-60 hover:opacity-100 transition-opacity duration-200"
                            />
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-center w-6 h-6"
                    >
                        <motion.div
                            initial={
                                isExpandedByDefault && !hasInitiallyRendered
                                    ? { rotate: 180 }
                                    : { rotate: 0 }
                            }
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <Image
                                src={arrowDown}
                                alt="Toggle action"
                                width={20}
                                height={20}
                                className="opacity-60 hover:opacity-100 transition-opacity duration-200"
                            />
                        </motion.div>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={
                            isExpandedByDefault && !hasInitiallyRendered
                                ? false
                                : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full overflow-hidden"
                    >
                        <Divider className="mb-4" />
                        <div className="flex flex-col gap-4 w-full px-4">
                            <div>
                                <InputField
                                    label={t("address")}
                                    placeholder={t("addressPlaceholder")}
                                    value={action.address}
                                    onChange={(value) =>
                                        handleFieldChange("address", value)
                                    }
                                    required
                                />
                                {addressError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {addressError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputField
                                    label={t("value")}
                                    placeholder={t("valuePlaceholder")}
                                    value={action.value}
                                    onChange={(value) =>
                                        handleFieldChange("value", value)
                                    }
                                />
                                {valueError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {valueError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputField
                                    label={t("signature")}
                                    placeholder={t("signaturePlaceholder")}
                                    value={action.signature}
                                    onChange={(value) =>
                                        handleFieldChange("signature", value)
                                    }
                                    required
                                />
                                {signatureError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {signatureError}
                                    </p>
                                )}
                            </div>

                            {callDataParams.map((param, index) => (
                                <div key={index}>
                                    <InputField
                                        label={`${t("callData")} (${
                                            param.type
                                        })`}
                                        placeholder={t("callDataPlaceholder")}
                                        value={action.callData[index] || ""}
                                        onChange={(value) =>
                                            handleCallDataChange(index, value)
                                        }
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProposalActionCard;
