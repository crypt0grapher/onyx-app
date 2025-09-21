import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { SubgraphService } from "@/lib/api";
import {
    formatToUiProposal,
    RawProposal,
    UiProposal,
} from "@/lib/governance/format";

export const useProposal = (id?: string) => {
    const publicClient = usePublicClient();

    const query = useQuery({
        queryKey: ["gov-proposal", id],
        enabled: Boolean(id && publicClient),
        queryFn: async () => {
            const service = new SubgraphService();
            const { proposal } = await service.getProposalById(String(id));
            if (!proposal)
                return {
                    ui: null as UiProposal | null,
                    raw: null as RawProposal | null,
                };
            const ui = await formatToUiProposal(
                proposal as unknown as RawProposal,
                publicClient!
            );
            return { ui, raw: proposal as unknown as RawProposal };
        },
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });

    return query;
};

export default useProposal;
