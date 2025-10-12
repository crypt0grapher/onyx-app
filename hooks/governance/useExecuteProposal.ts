"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useTranslations } from "next-intl";
import { CONTRACTS } from "@/contracts";
import { useTransactionExecutor, useToast } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";

export const useExecuteProposal = () => {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { executeTransaction } = useTransactionExecutor();
  const queryClient = useQueryClient();
  const { showDangerToast } = useToast();
  const tToastNetwork = useTranslations("toast.network");
  const tToastWallet = useTranslations("toast.wallet");
  const tToastGovernance = useTranslations("toast.governance");
  const [isLoading, setIsLoading] = useState(false);

  const executeProposal = async (
    proposalId: number | string,
    opts?: { onSuccess?: () => void }
  ) => {
    if (!address) {
      showDangerToast(
        tToastWallet("needsConnection", {
          default: "Wallet Not Connected",
        }),
        tToastWallet("needsConnectionSubtext", {
          default: "Please connect your wallet to continue",
        })
      );
      return null;
    }

    if (chainId !== CONTRACTS.governorBravoDelegator.chainId) {
      showDangerToast(
        tToastNetwork("wrongNetwork"),
        tToastNetwork("wrongNetworkGovernanceSubtext", {
          default: "Please switch to the Ethereum network",
        })
      );
      return null;
    }

    const pid = BigInt(proposalId);
    setIsLoading(true);

    try {
      const hashResult = await executeTransaction({
        action: async () =>
          await writeContractAsync({
            address: CONTRACTS.governorBravoDelegator.address,
            abi: CONTRACTS.governorBravoDelegator.abi as never,
            functionName: "execute",
            args: [pid],
            value: BigInt(0),
          }),
        successText: tToastGovernance("executeSuccess") || "Proposal Executed",
        successSubtext:
          tToastGovernance("executeSuccessSubtext") ||
          "The proposal has been executed successfully",
        errorText: tToastGovernance("executeFailed") || "Execution Failed",
      });

      if (hashResult) {
        queryClient.invalidateQueries({ queryKey: ["gov-proposals"] });
        queryClient.invalidateQueries({
          queryKey: ["gov-proposal", String(pid)],
        });
        queryClient.invalidateQueries({
          queryKey: ["gov-proposal-state", String(pid)],
        });
        queryClient.invalidateQueries({
          queryKey: ["gov-proposal-votes", String(pid)],
        });
        if (opts?.onSuccess) opts.onSuccess();
      }

      return hashResult;
    } finally {
      setIsLoading(false);
    }
  };

  return { executeProposal, isLoading };
};

export default useExecuteProposal;
