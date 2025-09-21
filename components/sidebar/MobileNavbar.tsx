"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import AnimatedHamburger from "@/components/sidebar/AnimatedHamburger";
import SidebarHeader from "@/components/sidebar/SidebarHeader";
import SidebarNavigation from "@/components/sidebar/SidebarNavigation";
import SidebarFooter from "@/components/sidebar/SidebarFooter";
import WalletCapsule from "@/components/sidebar/WalletCapsule";
import Divider from "../ui/common/Divider";

export default function MobileNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);

    const handleHamburgerClick = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleHamburgerKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsMobileMenuOpen(!isMobileMenuOpen);
        }
    };

    const handleNavigate = () => {
        setIsMobileMenuOpen(false);
    };

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const update = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight || 0);
            }
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <>
            <div className="lg:hidden relative z-[50]">
                <div className="px-4 pt-4" ref={headerRef}>
                    <div className="flex items-center justify-between">
                        <SidebarHeader />
                        <div className="flex items-center gap-2">
                            <WalletCapsule />
                            <div
                                className={[
                                    "flex items-center justify-center",
                                    "w-[44px] h-[44px]",
                                    "rounded-full",
                                    "border border-bg-boxes-stroke bg-bg-boxes",
                                    "flex-shrink-0",
                                ].join(" ")}
                            >
                                <button
                                    onClick={handleHamburgerClick}
                                    onKeyDown={handleHamburgerKeyDown}
                                    className="p-2 rounded-full outline-none"
                                    aria-label="Toggle menu"
                                    aria-expanded={isMobileMenuOpen}
                                >
                                    <AnimatedHamburger
                                        isOpen={isMobileMenuOpen}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                    <Divider className="mb-[25px] mt-[16px]" />
                </div>
            </div>

            {isMounted &&
                createPortal(
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div
                                key="mobile-overlay"
                                className="lg:hidden fixed inset-0 z-[49]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.25,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                            >
                                <motion.div
                                    className="absolute left-0 right-0 bottom-0 bg-[#0f0f0f]"
                                    style={{
                                        top: headerHeight,
                                        willChange: "transform",
                                        backfaceVisibility: "hidden",
                                        transform: "translateZ(0)",
                                    }}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Mobile menu"
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{
                                        duration: 0.35,
                                        ease: [0.32, 0.72, 0, 1],
                                        type: "tween",
                                    }}
                                >
                                    <div className="h-full px-4 py-4 overflow-y-auto">
                                        <SidebarNavigation
                                            className="mb-6"
                                            onNavigate={handleNavigate}
                                        />

                                        <SidebarFooter className="mt-auto" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
