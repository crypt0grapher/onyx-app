"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useTranslations } from "next-intl";
import { CONTRACTS } from "@/contracts";
import { useTransactionExecutor, useToast } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { encodeCallData } from "@/lib/governance/encoding";

export type CreateProposalParams = {
    title: string;
    description: string;
    actions: Array<{
        address: string;
        value?: string;
        signature?: string;
        callData?: string[];
    }>;
};

export const useCreateProposal = () => {
    const { address, chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { executeTransaction } = useTransactionExecutor();
    const queryClient = useQueryClient();
    const { showDangerToast } = useToast();
    const tToast = useTranslations("toast.governance");
    const tToastWallet = useTranslations("toast.wallet");
    const tToastNetwork = useTranslations("toast.network");

    const createProposal = async ({
        title,
        description,
        actions,
    }: CreateProposalParams) => {
        if (!address) {
            showDangerToast(
                tToastWallet("needsConnection"),
                tToastWallet("needsConnectionSubtext")
            );
            return null;
        }

        if (chainId !== CONTRACTS.governorBravoDelegator.chainId) {
            showDangerToast(
                tToastNetwork("wrongNetwork"),
                tToastNetwork("wrongNetworkGovernanceSubtext")
            );
            return null;
        }

        const targets = actions.map((a) => a.address);
        const values = actions.map((a) =>
            a.value && a.value !== "" ? a.value : "0"
        );
        const signatures = actions.map((a) => (a.signature || "").trim());
        const callDatas = actions.map((a) =>
            encodeCallData(a.signature || "", a.callData || [])
        );

        const descriptionPayload = JSON.stringify({
            version: 1,
            title,
            description,
        });

        const tx = await executeTransaction({
            action: async () =>
                await writeContractAsync({
                    address: CONTRACTS.governorBravoDelegator.address,
                    abi: CONTRACTS.governorBravoDelegator.abi as never,
                    functionName: "propose",
                    args: [
                        targets,
                        values,
                        signatures,
                        callDatas,
                        descriptionPayload,
                    ],
                }),
            successText: tToast("proposalCreated"),
            successSubtext: tToast("proposalCreatedSubtext"),
            errorText: tToast("proposalFailed"),
        });

        if (tx) {
            queryClient.invalidateQueries({ queryKey: ["gov-proposals"] });
            queryClient.invalidateQueries({
                queryKey: ["gov-latest-proposal-id", address],
            });
            queryClient.invalidateQueries({
                queryKey: ["gov-proposal-count"],
            });
        }

        return tx;
    };

    return { createProposal };
};

export default useCreateProposal;
