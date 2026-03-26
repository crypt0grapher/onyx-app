"use client";

import React, { useEffect, ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CloseButton from "@/components/ui/buttons/CloseButton";
import Divider from "@/components/ui/common/Divider";
import onyxDecoration from "@/assets/connect-modal/onyx_dec.svg";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtext?: ReactNode;
    children: ReactNode;
    className?: string;
    showDecoration?: boolean;
    ariaLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtext,
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
                        className={`relative w-full max-w-[528px] bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg flex flex-col py-4 gap-4 ${className}`}
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

                        <div className="flex px-4 items-start justify-between relative z-10">
                            <div className="flex flex-col">
                                <h2
                                    id="modal-title"
                                    className="text-[#E6E6E6] text-xl font-medium leading-7 font-inter"
                                >
                                    {title}
                                </h2>
                                {subtext && (
                                    <div className="text-[#808080] max-w-[260px] md:max-w-none text-[12px] md:text-sm font-medium leading-5 font-inter">
                                        {subtext}
                                    </div>
                                )}
                            </div>
                            <CloseButton onClick={onClose} />
                        </div>

                        <Divider className="mt-[3px]" />

                        <div className="px-4">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
