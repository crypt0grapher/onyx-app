"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useWallet } from "@/context/WalletProvider";
import {
  useClipboard,
  useDeviceType,
  useToast,
  useChainDetection,
} from "@/hooks";
import { getWalletIcon, getWalletName } from "@/lib/wallet/metadata";
import { switchToChain, ChainOperationCallbacks } from "@/lib/wallet/chain";
import { networkToChainConfig } from "@/config/networks";
import { toSrc } from "@/utils/image";
import Divider from "@/components/ui/common/Divider";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import NetworkSelector from "./NetworkSelector";
import {
  SUPPORTED_NETWORKS,
  Network,
  getNetworkByChainId,
} from "@/config/networks";
import { truncateAddress } from "@/utils/address";
import copyIcon from "@/assets/icons/copy.svg";
import openExplorerIcon from "@/assets/icons/open_explorer.svg";
import walletIcon from "@/assets/icons/wallet.svg";

interface WalletInfoModalContentProps {
  onLogout: () => void;
}

const WalletInfoModalContent: React.FC<WalletInfoModalContentProps> = ({
  onLogout,
}) => {
  const { walletAddress, connectedWalletId } = useWallet();
  const { copyToClipboard } = useClipboard();
  const deviceType = useDeviceType();
  const { showSuccessToast, showDangerToast } = useToast();
  const { currentChainId } = useChainDetection();
  const t = useTranslations("sidebar.wallet.info");
  const tToast = useTranslations("toast.copyAddress");
  const tNetworkErrors = useTranslations("common.errors.network");

  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  const getCurrentNetwork = (): Network => {
    if (currentChainId) {
      const chainIdDecimal = parseInt(currentChainId, 16);
      const detectedNetwork = getNetworkByChainId(chainIdDecimal);
      if (detectedNetwork) {
        return detectedNetwork;
      }
    }
    return SUPPORTED_NETWORKS[0];
  };

  const selectedNetwork = getCurrentNetwork();

  const walletIconSrc = connectedWalletId
    ? getWalletIcon(connectedWalletId)
    : getWalletIcon("metamask");
  const walletName = connectedWalletId
    ? getWalletName(connectedWalletId)
    : "MetaMask";

  const handleCopyAddress = () => {
    if (walletAddress) {
      copyToClipboard(walletAddress);
      showSuccessToast(tToast("success"), tToast("successSubtext"));
    }
  };

  const handleOpenExplorer = () => {
    const currentNetwork = getCurrentNetwork();
    const explorerUrl = `${currentNetwork.blockExplorerUrl}/address/${walletAddress}`;
    window.open(explorerUrl, "_blank");
  };

  const handleNetworkSelect = async (network: Network) => {
    if (isNetworkSwitching) return;

    setIsNetworkSwitching(true);

    const callbacks: ChainOperationCallbacks = {
      onSuccess: (title, message) => {
        showSuccessToast(title, message);
      },
      onError: (title, message) => {
        showDangerToast(title, message);
      },
      onInfo: (title, message) => {
        showSuccessToast(title, message);
      },
    };

    try {
      const chainConfig = networkToChainConfig(network);
      await switchToChain(chainConfig, callbacks, (key, values) =>
        tNetworkErrors(key, values)
      );
    } catch (error) {
      console.error("Error switching network:", error);
      showDangerToast(
        tNetworkErrors("networkSwitchFailed"),
        tNetworkErrors("failedToSwitchNetwork", {
          chainName: network.name,
        })
      );
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center p-3 rounded-lg border border-[#1F1F1F] bg-[#141414]">
        <div className="flex items-center gap-4">
          <Image
            src={toSrc(walletIconSrc)}
            alt={`${walletName} icon`}
            width={24}
            height={24}
            className="flex-shrink-0 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-[#E6E6E6] text-base font-medium leading-6 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
              {walletName}
            </span>
            <span className="text-[#808080] text-sm font-normal leading-5 font-inter [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
              {deviceType === "mobile"
                ? truncateAddress(walletAddress)
                : walletAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAddress}
            className="group cursor-pointer"
            aria-label="Copy wallet address"
          >
            <Image
              src={copyIcon}
              alt="Copy address"
              width={20}
              height={20}
              className="transition-all cursor-pointer duration-200 group-hover:brightness-0 group-hover:invert"
            />
          </button>
          <button
            onClick={handleOpenExplorer}
            className="group cursor-pointer"
            aria-label="Open in Etherscan"
          >
            <Image
              src={openExplorerIcon}
              alt="Open explorer"
              width={20}
              height={20}
              className="transition-all cursor-pointer duration-200 group-hover:brightness-0 group-hover:invert"
            />
          </button>
        </div>
      </div>

      <NetworkSelector
        networks={SUPPORTED_NETWORKS}
        selectedNetwork={selectedNetwork}
        onNetworkSelect={handleNetworkSelect}
        isLoading={isNetworkSwitching}
      />

      <Divider />

      <SecondaryButton
        label={t("logout")}
        icon={walletIcon}
        onClick={onLogout}
        className="text-white [&_img]:brightness-0 [&_img]:invert"
      />
    </div>
  );
};

export default WalletInfoModalContent;
