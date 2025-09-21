"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { pointsSubsquidService } from "@/lib/api/services/points";

export const useUserPoints = () => {
    const { address } = useAccount();

    return useQuery({
        queryKey: ["user-points", address?.toLowerCase() || ""],
        queryFn: async () => {
            if (!address) return { id: "", address: "", points: 0 };
            return await pointsSubsquidService.getUserPoints(address);
        },
        enabled: !!address,
        refetchInterval: 30000,
        staleTime: 30000,
    });
};

export default useUserPoints;
