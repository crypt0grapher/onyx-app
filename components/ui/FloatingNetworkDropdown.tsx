"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { useWallet } from "@/context/WalletProvider";
import { useClickOutside } from "@/hooks/common/useClickOutside";
import { SUPPORTED_NETWORKS, type Network } from "@/config/networks";
import { toSrc } from "@/utils/image";
import arrowDown from "@/assets/icons/arrow-down.svg";

const FloatingNetworkDropdown: React.FC = () => {
    const { isConnected } = useWallet();
    const { chainId } = useAccount();
    const { switchChain, isPending } = useSwitchChain();

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, () => setIsOpen(false));

    const currentNetwork: Network | undefined = SUPPORTED_NETWORKS.find(
        (n) => n.chainId === chainId
    );

    const handleToggle = useCallback(() => {
        if (isPending) return;
        setIsOpen((prev) => !prev);
    }, [isPending]);

    const handleSelect = useCallback(
        (network: Network) => {
            if (isPending || network.chainId === chainId) return;
            switchChain({ chainId: network.chainId });
            setIsOpen(false);
        },
        [isPending, chainId, switchChain]
    );

    if (!isConnected) return null;

    const displayName = currentNetwork?.name ?? "Unknown";

    return (
        <div
            ref={containerRef}
            className="fixed top-4 right-4 lg:top-6 lg:right-6 z-50"
        >
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className={`flex items-center gap-2 bg-[#141414]/90 backdrop-blur-md border border-[#1F1F1F] rounded-full px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isPending
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-[#1a1a1a] cursor-pointer"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls="floating-network-dropdown"
                aria-label={`Current network: ${displayName}. Click to change network.`}
            >
                {currentNetwork ? (
                    <Image
                        src={toSrc(currentNetwork.icon)}
                        alt=""
                        width={18}
                        height={18}
                        className="flex-shrink-0 rounded-full"
                    />
                ) : (
                    <span className="w-[18px] h-[18px] rounded-full bg-[#333] flex-shrink-0" />
                )}

                <span className="text-[#E6E6E6] text-sm font-medium">
                    {displayName}
                </span>

                {isPending ? (
                    <div
                        className="w-4 h-4 border-2 border-[#808080] border-t-transparent rounded-full animate-spin flex-shrink-0"
                        role="status"
                        aria-label="Switching network"
                    />
                ) : (
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                    >
                        <Image
                            src={arrowDown}
                            alt=""
                            width={16}
                            height={16}
                            className="opacity-60"
                        />
                    </motion.div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 min-w-[200px] bg-[#141414] border border-[#1F1F1F] rounded-xl shadow-lg overflow-hidden"
                        id="floating-network-dropdown"
                        role="listbox"
                        aria-label="Select network"
                    >
                        {SUPPORTED_NETWORKS.map((network) => {
                            const isActive = network.chainId === chainId;
                            return (
                                <li
                                    key={network.id}
                                    role="option"
                                    aria-selected={isActive}
                                    className={`flex items-center gap-3 p-3 px-4 transition-colors cursor-pointer ${
                                        isActive
                                            ? "bg-[#1a1a1a]"
                                            : "hover:bg-[#1a1a1a]"
                                    }`}
                                    onClick={() => handleSelect(network)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleSelect(network);
                                        }
                                    }}
                                    tabIndex={0}
                                >
                                    <Image
                                        src={toSrc(network.icon)}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="flex-shrink-0 rounded-full"
                                    />
                                    <span className="text-[#E6E6E6] text-sm font-medium flex-1">
                                        {network.name}
                                    </span>
                                    {isActive && (
                                        <span
                                            className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                                            aria-hidden="true"
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FloatingNetworkDropdown;
