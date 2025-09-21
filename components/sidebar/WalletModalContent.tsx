"use client";

import React from "react";
import { useTranslations } from "next-intl";
import WalletCard from "@/components/wallet/WalletCard";
import { walletProviders, WalletProvider } from "@/config/walletProviders";

interface WalletModalContentProps {
  /** Function called when a wallet is selected */
  onWalletSelect: (walletId: string) => void;
}

const WalletModalContent: React.FC<WalletModalContentProps> = ({
  onWalletSelect,
}) => {
  const t = useTranslations("sidebar.wallet.modal");

  const handleWalletClick = (walletId: string) => {
    onWalletSelect(walletId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {walletProviders.map((wallet: WalletProvider) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          walletDisplayName={t(`wallets.${wallet.id}`)}
          onClick={handleWalletClick}
        />
      ))}
    </div>
  );
};

export default WalletModalContent;
