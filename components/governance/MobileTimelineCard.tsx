import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Divider from "@/components/ui/common/Divider";
import StatusIcon from "@/components/ui/common/StatusIcon";
import Image from "next/image";
import arrowDownIcon from "@/assets/icons/arrow-down.svg";

interface TimelineEvent {
    label: string;
    date: string;
    type: string;
    eventDate: Date;
}

interface MobileTimelineCardProps {
    countdown: string;
    countdownLabel: string;
    timeline: TimelineEvent[];
}

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <Image
        src={arrowDownIcon}
        alt="Expand"
        width={20}
        height={20}
        className={`transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
        }`}
    />
);

const MobileTimelineCard: React.FC<MobileTimelineCardProps> = ({
    countdown,
    countdownLabel,
    timeline,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const hasEvents = Array.isArray(timeline) && timeline.length > 0;
    const firstEvent = hasEvents ? timeline[0] : undefined;

    return (
        <div className="flex p-4 flex-col items-start gap-4 shrink-0 rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
            <div className="flex items-center justify-between w-full">
                <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {countdownLabel}
                </span>
                <span className="text-primary text-[20px] leading-[28px] font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {countdown}
                </span>
            </div>

            <Divider className="flex-shrink-0 w-full" />

            <div
                className="flex items-center justify-between cursor-pointer w-full"
                onClick={handleToggle}
            >
                <div className="flex items-start">
                    <StatusIcon
                        variant={(() => {
                            if (!hasEvents) return "success";
                            const now = new Date();
                            const isPastEvent = firstEvent!.eventDate < now;
                            const type = firstEvent!.type;

                            let variant: "success" | "danger" | "normal" =
                                "success";
                            if (type === "canceled" && isPastEvent) {
                                variant = "danger";
                            } else if (isPastEvent) {
                                variant = "success";
                            } else {
                                variant = "normal";
                            }
                            return variant;
                        })()}
                        size="md"
                        className="shrink-0"
                    />
                    <div className="ml-2 flex flex-col">
                        <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {hasEvents ? firstEvent!.label : "--"}
                        </span>
                        <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {hasEvents ? firstEvent!.date : "--"}
                        </span>
                    </div>
                </div>
                <ExpandIcon isExpanded={isExpanded} />
            </div>

            <AnimatePresence>
                {isExpanded && timeline.length > 1 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { duration: 0.3, ease: "easeInOut" },
                            opacity: { duration: 0.2, ease: "easeInOut" },
                        }}
                        className="overflow-hidden w-full"
                    >
                        <div className="w-px h-4 bg-[#1F1F1F] mt-1 mb-3 ml-4" />

                        <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {timeline.slice(1).map((event, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.2,
                                        ease: "easeOut",
                                        delay: idx * 0.05,
                                    }}
                                >
                                    <div className="flex items-start">
                                        <StatusIcon
                                            variant={(() => {
                                                const now = new Date();
                                                const isPastEvent =
                                                    event.eventDate < now;
                                                const type = event.type;

                                                let variant:
                                                    | "success"
                                                    | "danger"
                                                    | "normal" = "success";
                                                if (
                                                    type === "canceled" &&
                                                    isPastEvent
                                                ) {
                                                    variant = "danger";
                                                } else if (isPastEvent) {
                                                    variant = "success";
                                                } else {
                                                    variant = "normal";
                                                }
                                                return variant;
                                            })()}
                                            size="md"
                                            className="shrink-0"
                                        />
                                        <div className="ml-2 flex flex-col">
                                            <span className="text-primary text-[14px] leading-5 font-medium font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                                {event.label}
                                            </span>
                                            <span className="text-secondary text-[14px] leading-5 font-normal font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                                {event.date}
                                            </span>
                                        </div>
                                    </div>
                                    {idx < timeline.length - 2 && (
                                        <div className="w-px h-4 bg-[#1F1F1F] mt-1 mb-3 ml-4" />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileTimelineCard;
