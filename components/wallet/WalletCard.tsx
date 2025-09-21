"use client";

import Image from "next/image";
import { WalletProvider } from "@/config/walletProviders";
import { toSrc } from "@/utils/image";

interface WalletCardProps {
    wallet: WalletProvider;
    walletDisplayName: string;
    onClick: (walletId: string) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({
    wallet,
    walletDisplayName,
    onClick,
}) => {
    const handleClick = () => {
        if (!wallet.disabled) {
            onClick(wallet.id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && !wallet.disabled) {
            e.preventDefault();
            onClick(wallet.id);
        }
    };

    const iconSrc = toSrc(wallet.icon);

    return (
        <button
            className={`flex items-start cursor-pointer gap-2 w-full py-4 pl-4 rounded-lg border border-[#1F1F1F] bg-[#141414] transition-all duration-200 ease-out ${
                wallet.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#141414]/80 hover:border-[#292929] focus:outline-none focus:ring-2 focus:ring-primary/20"
            }
            `}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={wallet.disabled}
            role="button"
            tabIndex={0}
            aria-label={`Connect ${walletDisplayName}`}
        >
            <Image
                src={iconSrc}
                alt={`${walletDisplayName} icon`}
                width={24}
                height={24}
                className="flex-shrink-0"
            />
            <span className="text-[#E6E6E6] text-base font-medium leading-6 font-inter">
                {walletDisplayName}
            </span>
        </button>
    );
};

export default WalletCard;
