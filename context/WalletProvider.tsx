"use client";

import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
} from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { WalletId } from "@/types/wallet";
import { getWalletIdFromConnector } from "@/lib/wagmi/connectors";
import { createWalletConnectionService } from "@/lib/wallet/connection";
import { useTranslations } from "next-intl";
import useToast from "@/hooks/ui/useToast";
import useRevalidation from "@/hooks/common/useRevalidation";

type WalletContextValue = {
    isConnected: boolean;
    walletAddress: string;
    connectionStatus:
        | "connecting"
        | "reconnecting"
        | "connected"
        | "disconnected";
    connectedWalletId: WalletId | null;
    connect: (walletId: WalletId) => Promise<void>;
    disconnect: () => Promise<void>;
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    selectedWallet: WalletId | null;
    setSelectedWallet: (walletId: WalletId | null) => void;
    isInfoModalOpen: boolean;
    openInfoModal: () => void;
    closeInfoModal: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { address, isConnected, status, connector } = useAccount();
    const { connectors, connectAsync } = useConnect();
    const { disconnectAsync } = useDisconnect();

    const { showDangerToast, showSuccessToast } = useToast();
    const walletT = useTranslations("toast.wallet");
    const walletErrorsT = useTranslations("common.errors.wallet");
    const { revalidateStakingNow } = useRevalidation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<WalletId | null>(null);

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const [connectedWalletId, setConnectedWalletId] = useState<WalletId | null>(
        null
    );

    const connectionService = useMemo(
        () => createWalletConnectionService(connectAsync, disconnectAsync),
        [connectAsync, disconnectAsync]
    );

    const detectedWalletId = useMemo(() => {
        if (!isConnected || !connector) return null;

        if (connectedWalletId) return connectedWalletId;

        return getWalletIdFromConnector(
            connector.name,
            connector.id
        ) as WalletId;
    }, [isConnected, connector, connectedWalletId]);

    const connect = useCallback(
        async (walletId: WalletId) => {
            const result = await connectionService.connect(
                walletId,
                connectors,
                (key: string) => walletErrorsT(key)
            );

            if (result.success) {
                setConnectedWalletId(walletId);
                showSuccessToast(
                    walletT("connected"),
                    walletT("connectedSuccess", { walletId })
                );
            } else {
                showDangerToast(
                    walletT("connectionFailed"),
                    result.error || walletT("unableToConnect")
                );
            }
        },
        [
            connectionService,
            connectors,
            showDangerToast,
            showSuccessToast,
            walletT,
            walletErrorsT,
        ]
    );

    const disconnect = useCallback(async () => {
        const result = await connectionService.disconnect((key: string) =>
            walletErrorsT(key)
        );

        if (result.success) {
            setConnectedWalletId(null);
            revalidateStakingNow();
            showSuccessToast(
                walletT("disconnected"),
                walletT("disconnectedSuccess")
            );
        } else {
            showDangerToast(
                walletT("disconnectionFailed"),
                result.error || walletT("failedToDisconnect")
            );
        }
    }, [
        connectionService,
        showDangerToast,
        showSuccessToast,
        walletT,
        walletErrorsT,
        revalidateStakingNow,
    ]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const openInfoModal = () => setIsInfoModalOpen(true);
    const closeInfoModal = () => setIsInfoModalOpen(false);

    const value = useMemo(
        () => ({
            isConnected: !!isConnected,
            walletAddress: address || "",
            connectionStatus: status,
            connectedWalletId: detectedWalletId,
            connect,
            disconnect,
            isModalOpen,
            openModal,
            closeModal,
            selectedWallet,
            setSelectedWallet,
            isInfoModalOpen,
            openInfoModal,
            closeInfoModal,
        }),
        [
            isConnected,
            address,
            status,
            detectedWalletId,
            isModalOpen,
            selectedWallet,
            isInfoModalOpen,
            connect,
            disconnect,
        ]
    );

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = (): WalletContextValue => {
    const ctx = useContext(WalletContext);
    if (!ctx) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return ctx;
};

export const useWalletModal = () => {
    const {
        isModalOpen,
        openModal,
        closeModal,
        selectedWallet,
        setSelectedWallet,
    } = useWallet();
    return {
        isModalOpen,
        openModal,
        closeModal,
        selectedWallet,
        setSelectedWallet,
    };
};
