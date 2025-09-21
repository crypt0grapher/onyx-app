"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import StatusBadge from "@/components/ui/pills/StatusBadge";
import Divider from "@/components/ui/common/Divider";
import arrowDown from "@/assets/icons/arrow-down.svg";

interface ProposalAction {
    id: string;
    address: string;
    value: string;
    signature: string;
}

interface ConfirmationCardProps {
    title: string;
    stepBadge: string;
    isExpandedByDefault?: boolean;
    children: React.ReactNode;
}

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
    title,
    stepBadge,
    isExpandedByDefault = false,
    children,
}) => {
    const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);
    const [hasInitiallyRendered, setHasInitiallyRendered] = useState(false);

    useEffect(() => {
        if (isExpandedByDefault && !hasInitiallyRendered) {
            setHasInitiallyRendered(true);
        }
    }, [isExpandedByDefault, hasInitiallyRendered]);

    return (
        <div className="flex py-4 flex-col items-start gap-4 self-stretch rounded-lg border border-[#1F1F1F] bg-[#141414]">
            <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2">
                    <span className="text-[#E6E6E6] text-[14px] font-medium leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {title}
                    </span>
                    <StatusBadge variant="normal">{stepBadge}</StatusBadge>
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
                            alt="Toggle section"
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
                        <div className="w-full px-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface ProposalInfoContentProps {
    proposalName: string;
    description: string;
}

const ProposalInfoContent: React.FC<ProposalInfoContentProps> = ({
    proposalName,
    description,
}) => {
    const t = useTranslations(
        "governance.createProposalModal.confirmationCards"
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between w-full">
                <span className="text-secondary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("labels.proposalName")}
                </span>
                <span className="text-primary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] text-right flex-1 ml-4">
                    {proposalName}
                </span>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-secondary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {t("labels.description")}
                </span>
                <div className="prose prose-sm max-w-none">
                    <div
                        className="text-[#E6E6E6] text-[14px] font-normal leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] [&_h1]:text-[2em] [&_h1]:font-semibold [&_h1]:text-[#E6E6E6] [&_h1]:m-0 [&_h2]:text-[1.5em] [&_h2]:font-semibold [&_h2]:text-[#E6E6E6] [&_h2]:m-0 [&_h3]:text-[1.17em] [&_h3]:font-semibold [&_h3]:text-[#E6E6E6] [&_h3]:m-0 [&_h4]:text-[1em] [&_h4]:font-semibold [&_h4]:text-[#E6E6E6] [&_h4]:m-0 [&_p]:m-0 [&_p]:text-[#E6E6E6] [&_ul]:pl-6 [&_ul]:m-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:text-[#E6E6E6] [&_ol]:pl-6 [&_ol]:m-0 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:text-[#E6E6E6] [&_li]:text-[#E6E6E6] [&_li]:mb-1 [&_li]:leading-6 [&_strong]:font-semibold [&_strong]:text-[#E6E6E6] [&_em]:italic [&_em]:text-[#E6E6E6] [&_a]:text-[#E6E6E6] [&_a]:font-medium [&_a]:leading-5 [&_a]:underline [&_a]:decoration-solid [&_a]:decoration-skip-ink-none [&_a]:decoration-auto [&_a]:underline-offset-auto [&_a]:underline-from-font [&_ul_li_::marker]:text-[#E6E6E6] [&_ol_li_::marker]:text-[#E6E6E6]"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                </div>
            </div>
        </div>
    );
};

interface ActionsContentProps {
    actions: ProposalAction[];
}

const ActionsContent: React.FC<ActionsContentProps> = ({ actions }) => {
    const t = useTranslations(
        "governance.createProposalModal.confirmationCards"
    );

    return (
        <div className="flex flex-col gap-3">
            {actions.map((action, index) => (
                <div
                    key={action.id}
                    className="flex items-start justify-between w-full"
                >
                    <span className="text-secondary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {t("labels.action")}
                        {index + 1}
                    </span>
                    <span className="text-primary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] text-right flex-1 ml-4">
                        {action.signature || t("labels.noSignature")}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ConfirmationCard;
export { ProposalInfoContent, ActionsContent };
