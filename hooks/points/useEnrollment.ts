"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { pointsApiService } from "@/lib/api/services/points";

type EnrollmentStatus = {
    enrolled: boolean;
};

export const useEnrollmentStatus = () => {
    const { address } = useAccount();
    return useQuery<EnrollmentStatus>({
        queryKey: ["points-enrollment", address?.toLowerCase() || ""],
        enabled: !!address,
        queryFn: async () => {
            if (!address) return { enrolled: false };
            const info = await pointsApiService.getUserInfo(address);
            return { enrolled: !!info };
        },
        staleTime: 30000,
        refetchInterval: 30000,
    });
};

export const useEnroll = () => {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["points-enroll", address?.toLowerCase() || ""],
        mutationFn: async () => {
            if (!address) throw new Error("Wallet not connected");
            const { signedMessage } = await pointsApiService.getSignedMessage(
                address
            );
            const signature = await signMessageAsync({
                message: signedMessage,
            });
            await pointsApiService.verifySignature({
                signedMessage,
                signature,
                address,
            });
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["points-enrollment"] });
            queryClient.invalidateQueries({ queryKey: ["user-points"] });
        },
    });
};

export default useEnrollmentStatus;
