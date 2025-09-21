import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileRowDetail {
    label: string;
    value: string | React.ReactNode;
}

interface MobileTableRowProps {
    type: string | React.ReactNode;
    amount: string;
    details: MobileRowDetail[];
    className?: string;
}

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className={`transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
        }`}
    >
        <path
            d="M15.4002 7.20078L9.8002 12.8008L4.2002 7.20078"
            stroke="#808080"
            strokeWidth="1.44"
            strokeLinecap="square"
        />
    </svg>
);

const MobileTableRow: React.FC<MobileTableRowProps> = ({
    type,
    amount,
    details,
    className = "",
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className={`rounded-[8px] border border-[#1F1F1F] bg-[#141414] ${className}`}
        >
            <div
                className="flex py-[14px] px-[16px] items-center justify-between cursor-pointer"
                onClick={handleToggle}
            >
                <div className="flex-1">{type}</div>

                <div className="flex items-center gap-4">
                    <span className="text-primary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                        {amount}
                    </span>
                    <ExpandIcon isExpanded={isExpanded} />
                </div>
            </div>

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
                        <div className="px-[16px] pb-[14px] border-t border-[#1F1F1F]">
                            <motion.div
                                initial={{ y: -10 }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="pt-[14px] space-y-3"
                            >
                                {details.map((detail, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeOut",
                                            delay: index * 0.05,
                                        }}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-secondary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                            {detail.label}:
                                        </span>
                                        <div className="text-secondary text-[14px] font-medium leading-[20px] font-sans [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]">
                                            {detail.value}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileTableRow;
