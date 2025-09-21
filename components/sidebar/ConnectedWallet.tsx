"use client";

import { useCallback } from "react";
import Image from "next/image";
import sortIcon from "@/assets/sort.svg";
import { useWallet } from "@/context/WalletProvider";
import { truncateAddress } from "@/utils/address";
import { getWalletIcon, getWalletName } from "@/lib/wallet/metadata";
import { toSrc } from "@/utils/image";

const ConnectedWallet = () => {
    const { walletAddress, connectedWalletId, openInfoModal } = useWallet();

    const walletIcon = connectedWalletId
        ? getWalletIcon(connectedWalletId)
        : getWalletIcon("metamask");
    const walletName = connectedWalletId
        ? getWalletName(connectedWalletId)
        : "MetaMask";

    const handleOpenModal = useCallback(() => {
        openInfoModal();
    }, [openInfoModal]);

    return (
        <div
            className="flex items-center justify-between min-w-0 flex-1 md:flex-none h-11 pl-3 pr-3 py-2.5 rounded-full border border-bg-boxes-stroke bg-bg-boxes flex-shrink-0 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`Connected wallet ${walletAddress}`}
            onClick={handleOpenModal}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenModal();
                }
            }}
        >
            <div className="flex items-center">
                <Image
                    src={toSrc(walletIcon)}
                    alt={walletName}
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="text-primary text-base leading-6 font-medium truncate">
                    {truncateAddress(walletAddress)}
                </span>
            </div>
            <div className="p-1 rounded-full hover:bg-white/10 transition-colors">
                <Image
                    src={sortIcon}
                    alt="Wallet options"
                    width={20}
                    height={20}
                />
            </div>
        </div>
    );
};

export default ConnectedWallet;
