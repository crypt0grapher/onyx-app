"use client";

import React, { useEffect, ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CloseButton from "@/components/ui/buttons/CloseButton";
import Divider from "@/components/ui/common/Divider";
import onyxDecoration from "@/assets/connect-modal/onyx_dec.svg";

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: number;
    totalSteps: number;
    title: string;
    children: ReactNode;
    className?: string;
    showDecoration?: boolean;
    ariaLabel?: string;
}

const ProposalModal: React.FC<ProposalModalProps> = ({
    isOpen,
    onClose,
    step,
    totalSteps,
    title,
    children,
    className = "",
    showDecoration = true,
    ariaLabel,
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const overlayVariants = {
        hidden: {
            opacity: 0,
        },
        visible: {
            opacity: 1,
        },
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
        },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/60"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    aria-label={ariaLabel}
                >
                    <motion.div
                        className={`relative overflow-hidden w-full max-w-[600px] max-h-[80vh] bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg flex flex-col ${className}`}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showDecoration && (
                            <div className="hidden md:block absolute top-0 right-0 pointer-events-none z-[0]">
                                <Image
                                    src={onyxDecoration}
                                    alt="Onyx decoration"
                                    width={160}
                                    height={84}
                                    className="object-contain"
                                />
                            </div>
                        )}

                        <div className="flex px-4 py-4 items-start justify-between relative z-10 flex-shrink-0">
                            <div className="flex flex-col">
                                <span className="text-secondary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                    Step {step}/{totalSteps}
                                </span>
                                <h2
                                    id="modal-title"
                                    className="text-[#E6E6E6] text-xl font-medium leading-7 font-inter"
                                >
                                    {title}
                                </h2>
                            </div>
                            <CloseButton onClick={onClose} />
                        </div>

                        <Divider className="flex-shrink-0" />

                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            <div className="py-4">{children}</div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProposalModal;
