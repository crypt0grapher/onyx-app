"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import Divider from "@/components/ui/common/Divider";
import InputField from "@/components/ui/common/InputField";
import arrowDown from "@/assets/icons/arrow-down.svg";

interface ProposalAction {
    id: string;
    address: string;
    value: string;
    signature: string;
}

interface ProposalActionCardProps {
    action: ProposalAction;
    actionNumber: number;
    onActionChange: (action: ProposalAction) => void;
    isExpandedByDefault?: boolean;
}

const ProposalActionCard: React.FC<ProposalActionCardProps> = ({
    action,
    actionNumber,
    onActionChange,
    isExpandedByDefault = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);
    const [hasInitiallyRendered, setHasInitiallyRendered] = useState(false);

    useEffect(() => {
        if (isExpandedByDefault && !hasInitiallyRendered) {
            setHasInitiallyRendered(true);
        }
    }, [isExpandedByDefault, hasInitiallyRendered]);

    const handleFieldChange = (field: keyof ProposalAction, value: string) => {
        onActionChange({
            ...action,
            [field]: value,
        });
    };

    const actionName = action.signature.trim() || "Action";

    return (
        <div className="flex py-4 flex-col items-start gap-4 self-stretch rounded-lg border border-[#1F1F1F] bg-[#141414]">
            <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2">
                    <span className="text-primary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {actionName}
                    </span>
                    <StatusBadge variant="normal">#{actionNumber}</StatusBadge>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center w-6 h-6 ml-2"
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
                            <InputField
                                label="Address"
                                placeholder="Address"
                                value={action.address}
                                onChange={(value) =>
                                    handleFieldChange("address", value)
                                }
                            />

                            <InputField
                                label="Value"
                                placeholder="Value"
                                value={action.value}
                                onChange={(value) =>
                                    handleFieldChange("value", value)
                                }
                            />

                            <InputField
                                label="Signature"
                                placeholder="Signature"
                                value={action.signature}
                                onChange={(value) =>
                                    handleFieldChange("signature", value)
                                }
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProposalActionCard;
