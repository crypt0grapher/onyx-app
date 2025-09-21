"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@/context/WalletProvider";
import { Modal } from "@/components/ui/modal";
import WalletInfoModalContent from "@/components/sidebar/WalletInfoModalContent";

/**
 * Handles wallet info modal display and interactions.
 * Uses the global Modal component with WalletInfoModalContent.
 * Rendered at the app level to ensure proper overlay behavior.
 */
const WalletInfoHandler: React.FC = () => {
  const { isInfoModalOpen, closeInfoModal, disconnect } = useWallet();
  const t = useTranslations("sidebar.wallet.info");

  const handleLogout = async () => {
    await disconnect();
    closeInfoModal();
  };

  return (
    <Modal
      isOpen={isInfoModalOpen}
      onClose={closeInfoModal}
      title={t("title")}
      subtext={t("subtext")}
      ariaLabel="Wallet information and settings"
      showDecoration={true}
    >
      <WalletInfoModalContent onLogout={handleLogout} />
    </Modal>
  );
};

export default WalletInfoHandler;
