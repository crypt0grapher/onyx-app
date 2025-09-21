"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import walletIcon from "@/assets/icons/wallet.svg";
import arrowUpIcon from "@/assets/icons/arrow_up.svg";
import { useWallet } from "@/context/WalletProvider";
import PrimaryButton from "../ui/buttons/PrimaryButton";

type ConnectWalletButtonProps = {
    label?: string;
    usePrimaryButton?: boolean;
};

const ConnectWalletButton = ({
    label,
    usePrimaryButton = false,
}: ConnectWalletButtonProps) => {
    const t = useTranslations("sidebar.wallet");
    const { openModal } = useWallet();
    const displayLabel = label || t("connect");

    if (usePrimaryButton) {
        return (
            <PrimaryButton
                label={displayLabel}
                icon={walletIcon}
                onClick={openModal}
                className="w-full"
            />
        );
    }

    return (
        <button
            onClick={openModal}
            className={[
                "group relative",
                "flex flex-col justify-center items-start gap-2",
                "h-11 px-3 py-2.5",
                "rounded-[1000px]",
                "bg-primary",
                "cursor-pointer",
                "outline-none",
                "overflow-hidden",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:shadow-lg",
                "hover:shadow-primary/20",
                "active:scale-[0.98]",
                "before:absolute before:inset-0",
                "before:bg-gradient-to-r before:from-white/0 before:via-white/15 before:to-white/0",
                "before:translate-x-[-100%] before:transition-transform before:duration-500",
                "hover:before:translate-x-[100%]",
            ].join(" ")}
            aria-label={displayLabel}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[1000px]" />

            <div className="flex justify-between items-center w-full relative z-10">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Image
                            src={walletIcon}
                            alt="Wallet"
                            width={20}
                            height={20}
                            className={[
                                "text-button-text transition-all duration-300",
                                "group-hover:scale-105 group-hover:rotate-1",
                                "group-hover:drop-shadow-sm max-w-[16px] md:max-w-none",
                            ].join(" ")}
                        />
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <span
                        className={[
                            "text-button-text",
                            "text-[14px] md:text-[16px] font-medium leading-6",
                            "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]",
                            "transition-all duration-300",
                            "group-hover:tracking-wide",
                        ].join(" ")}
                    >
                        {displayLabel}
                    </span>
                </div>
                <div className="relative">
                    <Image
                        src={arrowUpIcon}
                        alt="Connect"
                        width={20}
                        height={20}
                        className={[
                            "text-button-text transition-all duration-300",
                            "group-hover:scale-105 group-hover:translate-x-0.5",
                            "group-hover:drop-shadow-sm max-w-[16px] md:max-w-none",
                        ].join(" ")}
                    />
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            </div>

            <div className="absolute inset-0 rounded-[1000px] bg-gradient-to-r from-white/20 via-white/30 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
        </button>
    );
};

export default ConnectWalletButton;
