import React from "react";
import Skeleton from "@/components/ui/common/Skeleton";

const ProposalCardSkeleton: React.FC = () => {
    return (
        <div className="flex p-4 flex-col items-start gap-2 rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
            <div className="hidden md:flex justify-between items-start w-full">
                <div className="flex flex-col items-start gap-2 flex-1">
                    <div className="flex items-center gap-[8px]">
                        <Skeleton
                            className="h-[22px] w-[64px]"
                            rounded="rounded-[999px]"
                        />
                        <Skeleton
                            className="h-[22px] w-[94px]"
                            rounded="rounded-[999px]"
                        />
                        <Skeleton
                            className="h-[22px] w-[94px]"
                            rounded="rounded-[999px]"
                        />
                    </div>

                    <Skeleton
                        className="h-[28px] w-[60%]"
                        rounded="rounded-[6px]"
                    />
                    <Skeleton
                        className="h-[20px] w-[80%] mt-1"
                        rounded="rounded-[6px]"
                    />
                </div>

                <div className="flex-shrink-0 ml-4">
                    <Skeleton
                        className="h-[22px] w-[110px]"
                        rounded="rounded-[999px]"
                    />
                </div>
            </div>

            <div className="flex md:hidden flex-col items-start gap-2 w-full">
                <div className="flex items-center gap-[8px]">
                    <Skeleton
                        className="h-[22px] w-[64px]"
                        rounded="rounded-[999px]"
                    />
                    <Skeleton
                        className="h-[22px] w-[94px]"
                        rounded="rounded-[999px]"
                    />
                    <Skeleton
                        className="h-[22px] w-[94px]"
                        rounded="rounded-[999px]"
                    />
                </div>

                <Skeleton
                    className="h-[48px] w-[90%]"
                    rounded="rounded-[6px]"
                />
                <Skeleton
                    className="h-[20px] w-[70%]"
                    rounded="rounded-[6px]"
                />

                <div className="mt-3">
                    <Skeleton
                        className="h-[22px] w-[110px]"
                        rounded="rounded-[999px]"
                    />
                </div>
            </div>
        </div>
    );
};

export default ProposalCardSkeleton;
