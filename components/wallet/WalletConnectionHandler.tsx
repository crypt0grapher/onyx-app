"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@/context/WalletProvider";
import { Modal } from "@/components/ui/modal";
import WalletModalContent from "@/components/sidebar/WalletModalContent";
import type { WalletId } from "@/types/wallet";

const WalletConnectionHandler: React.FC = () => {
    const { isModalOpen, closeModal, connect, isConnected } = useWallet();
    const t = useTranslations("sidebar.wallet.modal");
    const tWallet = useTranslations("sidebar.wallet");

    const handleWalletSelect = async (walletId: string) => {
        await connect(walletId as WalletId);
    };

    useEffect(() => {
        if (isModalOpen && isConnected) {
            closeModal();
        }
    }, [isConnected, isModalOpen, closeModal]);

    const modalSubtext = (
        <>
            {t("termsText")}{" "}
            <Link
                href="https://docs.onyx.org/terms-of-service/terms"
                className="text-[#E6E6E6] underline decoration-solid"
                target="_blank"
                rel="noopener noreferrer"
            >
                {t("termsLink")}
            </Link>
        </>
    );

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={t("title")}
            subtext={modalSubtext}
            ariaLabel={tWallet("connect") + " to Onyx Protocol"}
        >
            <WalletModalContent onWalletSelect={handleWalletSelect} />
        </Modal>
    );
};

export default WalletConnectionHandler;
