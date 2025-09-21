"use client";

import { useAccount, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/contracts";
import { useTransactionExecutor } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

export type CreateProposalParams = {
    title: string;
    description: string;
    actions: Array<{
        address: string;
        value?: string;
        signature?: string;
        callData?: string;
    }>;
};

const normalizeHex = (data?: string) => {
    if (!data) return "0x";
    return data.startsWith("0x") ? data : `0x${data}`;
};

export const useCreateProposal = () => {
    const { address, chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { executeTransaction } = useTransactionExecutor();
    const queryClient = useQueryClient();

    const createProposal = async ({
        title,
        description,
        actions,
    }: CreateProposalParams) => {
        if (!address || chainId !== CONTRACTS.governorBravoDelegator.chainId) {
            throw new Error("Wrong network or wallet not connected");
        }

        const targets = actions.map((a) => a.address);
        const values = actions.map((a) =>
            a.value && a.value !== "" ? a.value : "0"
        );
        const signatures = actions.map((a) => a.signature || "");
        const callDatas = actions.map((a) => normalizeHex(a.callData));

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
            successText: "Proposal created",
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
