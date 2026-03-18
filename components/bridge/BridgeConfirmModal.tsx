"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import Divider from "@/components/ui/common/Divider";
import { type BridgeDirection, type BridgeTokenSymbol } from "@/lib/api/services/bridge";

interface BridgeConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    direction: BridgeDirection;
    token: BridgeTokenSymbol;
    amount: string;
    fee: string;
    estimatedTime: string;
    sourceChainName: string;
    goliathChainName: string;
    isConfirming: boolean;
}

const BridgeConfirmModal: React.FC<BridgeConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    direction,
    token,
    amount,
    fee,
    estimatedTime,
    sourceChainName,
    goliathChainName,
    isConfirming,
}) => {
    const t = useTranslations("bridge");

    const fromNetwork =
        direction === "SOURCE_TO_GOLIATH" ? sourceChainName : goliathChainName;
    const toNetwork =
        direction === "SOURCE_TO_GOLIATH" ? goliathChainName : sourceChainName;
    const directionLabel = `${fromNetwork} -> ${toNetwork}`;

    const rows: Array<{ label: string; value: string }> = [
        { label: t("confirm.amount"), value: `${amount} ${token}` },
        { label: t("confirm.direction"), value: directionLabel },
        { label: t("confirm.fee"), value: fee },
        { label: t("confirm.eta"), value: estimatedTime },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t("confirm.title")}
            ariaLabel={t("confirm.title")}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between items-center"
                        >
                            <span className="text-[#808080] text-[14px] font-normal leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                {row.label}
                            </span>
                            <span className="text-[#E6E6E6] text-[14px] font-medium leading-[20px] [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                <Divider />

                <div className="flex gap-3">
                    <SecondaryButton
                        label={t("confirm.cancel")}
                        onClick={onClose}
                        disabled={isConfirming}
                        className="flex-1"
                    />
                    <div className="flex-1">
                        <PrimaryButton
                            label={
                                isConfirming
                                    ? t("actions.bridging")
                                    : t("confirm.confirm")
                            }
                            onClick={onConfirm}
                            disabled={isConfirming}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BridgeConfirmModal;
