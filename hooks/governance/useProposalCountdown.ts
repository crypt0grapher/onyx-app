import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { useCountdown } from "@/hooks";
import type { RawProposal } from "@/lib/governance/format";

const BLOCK_TIME_MS = 12000;

export const useProposalCountdown = (
    raw?: RawProposal | null,
    onChainStatus?: string | null
) => {
    const t = useTranslations("governance.proposal");
    const publicClient = usePublicClient();

    const isTerminal =
        onChainStatus === "Executed" || onChainStatus === "Canceled";

    const {
        data: startBlockData,
        isPending: isPendingBlock,
        isFetching: isFetchingBlock,
    } = useQuery({
        queryKey: ["startBlock", raw?.startBlock],
        enabled: Boolean(
            raw?.startBlock && publicClient && !isTerminal
        ),
        queryFn: async () => {
            if (!raw?.startBlock || !publicClient) return null;
            try {
                const block = await publicClient.getBlock({
                    blockNumber: BigInt(raw.startBlock),
                });
                return {
                    timestamp: Number(block.timestamp),
                };
            } catch (error) {
                console.error("Error fetching start block:", error);
                return null;
            }
        },
        staleTime: Infinity,
    });

    const countdownData = useMemo(() => {
        if (!raw) return { message: "--", targetDate: null };

        const now = Date.now();
        const bn = (s?: string | null) => {
            try {
                return s ? BigInt(s) : BigInt(0);
            } catch {
                return BigInt(0);
            }
        };

        if (onChainStatus === "Executed") {
            return { message: t("status.executed"), targetDate: null };
        }

        if (onChainStatus === "Canceled") {
            return { message: t("timeline.canceled"), targetDate: null };
        }

        if (raw.eta && Number(raw.eta) > 0) {
            const etaMs = Number(raw.eta) * 1000;
            if (etaMs > now) {
                return {
                    message: t("timeUntilExecutable"),
                    targetDate: new Date(etaMs),
                };
            } else {
                return { message: t("executionReady"), targetDate: null };
            }
        }

        const endBlock = bn(raw.endBlock);
        const startBlock = bn(raw.startBlock);

        if (endBlock > BigInt(0) && startBlock > BigInt(0) && startBlockData) {
            const blockInterval =
                Number(endBlock - startBlock) * (BLOCK_TIME_MS / 1000);
            const startDate = new Date(startBlockData.timestamp * 1000);
            const activeUntilDate = new Date(startDate);
            activeUntilDate.setSeconds(startDate.getSeconds() + blockInterval);

            return {
                message: t("votingActive"),
                targetDate: activeUntilDate,
            };
        }

        if (endBlock > BigInt(0)) {
            return { message: t("votingActive"), targetDate: null };
        }

        if (startBlock > BigInt(0)) {
            return { message: t("votingPending"), targetDate: null };
        }

        return { message: t("votingActive"), targetDate: null };
    }, [raw, t, startBlockData, onChainStatus]);

    const countdown = useCountdown(countdownData.targetDate);

    const needsBlockData = Boolean(
        raw?.startBlock &&
            raw?.endBlock &&
            !isTerminal &&
            BigInt(raw.endBlock || 0) > BigInt(0) &&
            BigInt(raw.startBlock || 0) > BigInt(0)
    );

    const isLoadingCountdown =
        needsBlockData && (!publicClient || isPendingBlock || isFetchingBlock);

    return {
        message: countdownData.message,
        countdown: countdownData.targetDate ? countdown : "",
        isLoading: isLoadingCountdown,
    };
};
