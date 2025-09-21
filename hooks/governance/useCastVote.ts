"use client";

import { useAccount, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/contracts";
import { useTransactionExecutor } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

export const useCastVote = () => {
    const { address, chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { executeTransaction } = useTransactionExecutor();
    const queryClient = useQueryClient();

    const castVote = async (
        proposalId: number | string,
        support: boolean,
        opts?: { onSuccess?: () => void }
    ) => {
        if (!address || chainId !== CONTRACTS.governorBravoDelegator.chainId) {
            throw new Error("Wrong network or wallet not connected");
        }
        const pid = BigInt(proposalId);
        const hashResult = await executeTransaction({
            action: async () =>
                await writeContractAsync({
                    address: CONTRACTS.governorBravoDelegator.address,
                    abi: CONTRACTS.governorBravoDelegator.abi as never,
                    functionName: "castVote",
                    args: [pid, support],
                }),
            successText: "Vote submitted",
        });
        if (hashResult) {
            queryClient.invalidateQueries({ queryKey: ["gov-proposals"] });
            queryClient.invalidateQueries({
                queryKey: ["gov-proposal", String(pid)],
            });
            queryClient.invalidateQueries({
                queryKey: ["gov-proposal-votes", String(pid)],
            });
            if (opts?.onSuccess) opts.onSuccess();
        }
        return hashResult;
    };

    return { castVote };
};

export default useCastVote;
