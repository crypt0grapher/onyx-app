"use client";

import { useQuery } from "@tanstack/react-query";
import { pointsSubsquidService } from "@/lib/api/services/points";

export const usePointsSettings = () => {
    return useQuery({
        queryKey: ["points-settings"],
        queryFn: () => pointsSubsquidService.getPointsSettings(),
        staleTime: 5 * 60 * 1000,
    });
};

export default usePointsSettings;
