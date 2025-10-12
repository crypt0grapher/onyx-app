"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/contracts";

export const useProposalEta = (proposalId?: string | number | bigint) => {
  const publicClient = usePublicClient();
  const idKey = proposalId ? String(proposalId) : "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["gov-proposal-eta", idKey],
    enabled: Boolean(publicClient && proposalId !== undefined),
    queryFn: async () => {
      const id =
        typeof proposalId === "bigint"
          ? proposalId
          : BigInt(String(proposalId));

      const proposal = (await publicClient!.readContract({
        address: CONTRACTS.governorBravoDelegator.address,
        abi: CONTRACTS.governorBravoDelegator.abi as never,
        functionName: "proposals",
        args: [id],
      })) as readonly [unknown, unknown, bigint, ...unknown[]];

      const etaSeconds = proposal[2];

      if (etaSeconds === BigInt(0)) {
        return null;
      }

      const eta = new Date(Number(etaSeconds) * 1000);
      return eta;
    },
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  return {
    eta: (data ?? null) as Date | null,
    isLoading,
    isError,
    refetch,
  };
};

export default useProposalEta;
