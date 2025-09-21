"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/hooks/common/useClickOutside";
import { toSrc } from "@/utils/image";
import { Network } from "@/config/networks";
import arrowDown from "@/assets/icons/arrow-down.svg";

interface NetworkSelectorProps {
    networks: Network[];
    selectedNetwork: Network;
    onNetworkSelect: (network: Network) => void;
    isLoading?: boolean;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
    networks,
    selectedNetwork,
    onNetworkSelect,
    isLoading = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    const handleToggle = () => {
        if (isLoading) return;
        setIsOpen(!isOpen);
    };

    const handleNetworkClick = (network: Network) => {
        if (isLoading) return;
        onNetworkSelect(network);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`flex justify-between items-center w-full p-2.5 px-4 rounded-full border border-[#1F1F1F] bg-[#141414] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isLoading
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-[#1a1a1a] cursor-pointer"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls="network-dropdown"
                role="combobox"
            >
                <div className="flex items-center gap-5">
                    <Image
                        src={toSrc(selectedNetwork.icon)}
                        alt={`${selectedNetwork.name} icon`}
                        width={20}
                        height={20}
                        className="flex-shrink-0 rounded-full"
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-[#E6E6E6] text-sm font-medium leading-5 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {selectedNetwork.name}
                        </span>
                        <span className="text-[#808080] text-sm font-medium leading-5 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            ({selectedNetwork.network})
                        </span>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-[#808080] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Image
                                src={arrowDown}
                                alt="Expand"
                                width={20}
                                height={20}
                                className="opacity-60"
                            />
                        </motion.div>
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-[#1F1F1F] rounded-lg shadow-lg z-50"
                        id="network-dropdown"
                        role="listbox"
                    >
                        {networks.map((network) => (
                            <button
                                key={network.id}
                                onClick={() => handleNetworkClick(network)}
                                className="flex items-center gap-5 w-full p-3 px-4 hover:bg-[#1a1a1a] transition-colors text-left focus:outline-none focus:bg-[#1a1a1a]"
                                role="option"
                                aria-selected={
                                    network.id === selectedNetwork.id
                                }
                            >
                                <Image
                                    src={toSrc(network.icon)}
                                    alt={`${network.name} icon`}
                                    width={20}
                                    height={20}
                                    className="flex-shrink-0 rounded-full"
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-[#E6E6E6] text-sm font-medium leading-5 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                        {network.name}
                                    </span>
                                    <span className="text-[#808080] text-sm font-medium leading-5 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                        ({network.network})
                                    </span>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NetworkSelector;
