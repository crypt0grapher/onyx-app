"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useWallet } from "@/context/WalletProvider";
import { useChainDetection } from "@/hooks/wallet/useChainDetection";
import { useToast } from "@/hooks";
import {
    switchToOnyxNetwork,
    ChainOperationCallbacks,
} from "@/lib/wallet/chain";
import ledger from "@/assets/icons/ledger.svg";
import plus from "@/assets/icons/plus.svg";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import { type ImageLikeSrc } from "@/utils/image";

const AddXcnNetworkCard: React.FC = () => {
    const t = useTranslations("sidebar.footer");
    const tCommon = useTranslations("common");
    const tNetworkErrors = useTranslations("common.errors.network");
    const { isConnected } = useWallet();
    const { isOnOnyxChain, isLoading: isChainDetectionLoading } =
        useChainDetection();
    const { showSuccessToast, showDangerToast } = useToast();
    const [isAddingNetwork, setIsAddingNetwork] = useState(false);

    const shouldShow =
        isConnected && !isOnOnyxChain && !isChainDetectionLoading;

    const handleAddNetwork = async () => {
        if (isAddingNetwork) return;

        setIsAddingNetwork(true);

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
            await switchToOnyxNetwork(callbacks, (key, values) =>
                tNetworkErrors(key, values)
            );
        } catch (error) {
            console.error("Error switching to Onyx network:", error);
            showDangerToast(
                tNetworkErrors("networkSwitchFailed"),
                tNetworkErrors("failedToSwitchNetwork", { chainName: "Onyx" })
            );
        } finally {
            setIsAddingNetwork(false);
        }
    };

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="mb-6 rounded-[8px] border border-bg-boxes-stroke bg-bg-boxes p-4 text-center">
            <div className="flex justify-center">
                <Image src={ledger} alt="Ledger" width={20} height={20} />
            </div>
            <div
                className={[
                    "text-primary",
                    "mt-2 text-[16px] leading-6 font-medium",
                ].join(" ")}
            >
                {t("accessLedger")}
            </div>
            <div
                className={[
                    "text-secondary",
                    "mt-1 text-[14px] leading-5 font-normal",
                ].join(" ")}
            >
                {t("addNetwork")}
            </div>
            <div className="mt-3 flex justify-center">
                <PrimaryButton
                    label={
                        isAddingNetwork
                            ? tCommon("loading")
                            : t("addNetworkButton")
                    }
                    icon={plus as ImageLikeSrc}
                    onClick={handleAddNetwork}
                    disabled={isAddingNetwork}
                />
            </div>
        </div>
    );
};

export default AddXcnNetworkCard;
