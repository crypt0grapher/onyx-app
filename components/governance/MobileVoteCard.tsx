import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Divider from "@/components/ui/common/Divider";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import StatusIcon from "@/components/ui/common/StatusIcon";
import ProgressBar from "@/components/ui/common/ProgressBar";
import ExternalLink from "@/components/ui/common/ExternalLink";
import voteIcon from "@/assets/icons/vote.svg";
import arrowDownIcon from "@/assets/icons/arrow-down.svg";
import Image from "next/image";

interface VoteRow {
    address: string;
    votes: string;
    href?: string;
}

interface MobileVoteCardProps {
    type: "for" | "against";
    title: string;
    percentage: string;
    totalVotes: string;
    rows: VoteRow[];
    disabled?: boolean;
    isLoading?: boolean;
    hasVoted?: boolean;
    votedFor?: boolean;
    onVote?: (support: boolean) => void;
}

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <Image
        src={arrowDownIcon}
        alt="Expand"
        width={16}
        height={16}
        className={`transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
        }`}
    />
);

const MobileVoteCard: React.FC<MobileVoteCardProps> = ({
    type,
    title,
    percentage,
    totalVotes,
    rows,
    disabled = false,
    isLoading = false,
    hasVoted = false,
    votedFor,
    onVote,
}) => {
    const t = useTranslations("governance.proposal");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const variant = type === "for" ? "success" : "danger";

    let buttonLabel: string;
    if (isLoading) {
        buttonLabel = t("casting");
    } else if (hasVoted && votedFor !== undefined) {
        if (type === "for" && votedFor === true) {
            buttonLabel = t("votedFor");
        } else if (type === "against" && votedFor === false) {
            buttonLabel = t("votedAgainst");
        } else {
            buttonLabel = type === "for" ? t("voteFor") : t("voteAgainst");
        }
    } else {
        buttonLabel = type === "for" ? t("voteFor") : t("voteAgainst");
    }

    const handleVote = () => {
        try {
            if (onVote) onVote(type === "for");
        } catch {}
    };

    return (
        <div className="flex p-4 flex-col items-start gap-4 shrink-0 rounded-[8px] border border-[#1F1F1F] bg-[#141414] h-full">
            <div
                className="flex items-center w-full cursor-pointer"
                onClick={handleToggle}
            >
                <StatusIcon variant={variant} />
                <div className="flex flex-col ml-4">
                    <span className="text-primary text-[20px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {title}
                    </span>
                    <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {percentage}
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-primary text-[20px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                        {totalVotes}
                    </span>
                    <ExpandIcon isExpanded={isExpanded} />
                </div>
            </div>

            <ProgressBar
                value={parseFloat(percentage) || 0}
                variant={variant}
            />

            <Divider className="w-full" />

            <div className="flex-1 w-full">
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                height: { duration: 0.3, ease: "easeInOut" },
                                opacity: { duration: 0.2, ease: "easeInOut" },
                            }}
                            className="overflow-hidden"
                        >
                            <motion.div
                                initial={{ y: -10 }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="pb-4"
                            >
                                <div className="flex p-[10px_16px] justify-between items-center rounded-[8px] border border-[#292929] bg-[#1B1B1B] mb-2">
                                    <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                        {t("addresses")} ({rows.length})
                                    </span>
                                    <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                        {t("votes")}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {rows.map((row, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeOut",
                                                delay: index * 0.05,
                                            }}
                                            className="flex p-[12px_16px] flex-col items-start gap-2 rounded-[8px] border border-[#292929] bg-[#1B1B1B]"
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <ExternalLink
                                                    href={row.href || "#"}
                                                    underline={false}
                                                    className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]"
                                                >
                                                    {row.address}
                                                </ExternalLink>
                                                <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                                    {row.votes}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-auto w-full">
                <PrimaryButton
                    label={buttonLabel}
                    icon={voteIcon}
                    disabled={disabled || isLoading || hasVoted}
                    onClick={handleVote}
                />
            </div>
        </div>
    );
};

export default MobileVoteCard;
