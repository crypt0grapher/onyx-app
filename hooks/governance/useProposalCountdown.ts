import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCountdown } from "@/hooks";
import type { RawProposal } from "@/lib/governance/format";

export const useProposalCountdown = (raw?: RawProposal | null) => {
    const t = useTranslations("governance.proposal");
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

        if (raw.executedBlockTimestamp) {
            return { message: t("status.executed"), targetDate: null };
        }

        if (raw.canceledBlockTimestamp) {
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
        if (endBlock > BigInt(0)) {
            return { message: t("votingActive"), targetDate: null };
        }

        const startBlock = bn(raw.startBlock);
        if (startBlock > BigInt(0)) {
            return { message: t("votingPending"), targetDate: null };
        }

        return { message: t("votingActive"), targetDate: null };
    }, [raw, t]);

    const countdown = useCountdown(countdownData.targetDate);

    return {
        message: countdownData.message,
        countdown: countdownData.targetDate ? countdown : "",
    };
};
