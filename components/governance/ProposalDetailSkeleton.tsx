"use client";
import React from "react";
import Image from "next/image";
import governanceSmall from "@/assets/governance/onyx_governance_small.svg";

const Skel: React.FC<{
    className?: string;
}> = ({ className = "" }) => (
    <div className={`bg-[#1F1F1F] rounded-md animate-pulse ${className}`} />
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = "",
}) => (
    <div
        className={`rounded-[8px] border border-[#1F1F1F] bg-[#141414] p-4 flex flex-col gap-4 ${className}`}
    >
        {children}
    </div>
);

const ProposalDetailSkeleton: React.FC = () => {
    return (
        <div className="lg:min-h-screen mb-[32px] lg:mb-0 h-full">
            <main className="lg:ml-[304px] h-full mb-[16px] lg:p-6">
                <div className="px-4 lg:px-0 flex flex-col">
                    <div className="flex items-end justify-between mb-2">
                        <div className="flex flex-col">
                            <div className="mb-4">
                                <Skel className="h-10 w-[180px] rounded-full" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Skel className="h-[34px] w-full max-w-[760px]" />
                                <div className="flex gap-4">
                                    <Skel className="h-5 w-24 rounded-full" />
                                    <Skel className="h-5 w-28 rounded-full" />
                                    <Skel className="h-5 w-20 rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="hidden 2xl:block self-end ml-8">
                            <Image
                                src={governanceSmall}
                                alt="Onyx Governance"
                                width={290}
                                height={162}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-[#1F1F1F] my-[24px]" />

                    <div className="grid grid-cols-1 2xl:grid-cols-[0.5fr_0.5fr_27%] gap-4">
                        <div className="hidden 2xl:flex 2xl:order-3">
                            <Card className="h-[440px] w-full">
                                <Skel className="h-5 w-44" />
                                <div className="flex flex-col gap-3 mt-1 overflow-hidden">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3"
                                        >
                                            <Skel className="h-3 w-3 rounded-full" />
                                            <div className="flex-1 flex flex-col gap-1">
                                                <Skel className="h-4 w-48" />
                                                <Skel className="h-3 w-28" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto w-full">
                                    <div className="h-px w-full bg-[#1F1F1F] mb-4" />
                                    <Skel className="h-10 w-full" />
                                </div>
                            </Card>
                        </div>

                        <div className="hidden 2xl:flex">
                            <Card className="h-[440px] w-full">
                                <div className="flex items-center w-full">
                                    <Skel className="h-8 w-8 rounded-full" />
                                    <div className="flex flex-col ml-4 gap-1 flex-1">
                                        <Skel className="h-5 w-32" />
                                        <Skel className="h-4 w-20" />
                                    </div>
                                    <Skel className="h-6 w-20 ml-auto" />
                                </div>
                                <div className="h-px w-full bg-[#1F1F1F]" />
                                <div className="flex flex-col gap-2 flex-1 w-full overflow-hidden">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3"
                                        >
                                            <Skel className="h-6 w-6 rounded-full" />
                                            <Skel className="h-4 flex-1" />
                                            <Skel className="h-4 w-16" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto w-full">
                                    <div className="h-px w-full bg-[#1F1F1F] mb-4" />
                                    <Skel className="h-10 w-full" />
                                </div>
                            </Card>
                        </div>

                        <div className="hidden 2xl:flex">
                            <Card className="h-[440px] w-full">
                                <div className="flex items-center w-full">
                                    <Skel className="h-8 w-8 rounded-full" />
                                    <div className="flex flex-col ml-4 gap-1 flex-1">
                                        <Skel className="h-5 w-36" />
                                        <Skel className="h-4 w-24" />
                                    </div>
                                    <Skel className="h-6 w-20 ml-auto" />
                                </div>
                                <div className="h-px w-full bg-[#1F1F1F]" />
                                <div className="flex flex-col gap-2 flex-1 w-full overflow-hidden">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3"
                                        >
                                            <Skel className="h-6 w-6 rounded-full" />
                                            <Skel className="h-4 flex-1" />
                                            <Skel className="h-4 w-16" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto w-full">
                                    <div className="h-px w-full bg-[#1F1F1F] mb-4" />
                                    <Skel className="h-10 w-full" />
                                </div>
                            </Card>
                        </div>

                        <div className="block 2xl:hidden space-y-4">
                            <Card>
                                <Skel className="h-5 w-40" />
                                <Skel className="h-4 w-32" />
                                <div className="flex flex-col gap-3 mt-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3"
                                        >
                                            <Skel className="h-3 w-3 rounded-full" />
                                            <div className="flex-1 flex flex-col gap-1">
                                                <Skel className="h-4 w-48" />
                                                <Skel className="h-3 w-28" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i} className="min-h-[240px]">
                                    <div className="flex items-center w-full">
                                        <Skel className="h-8 w-8 rounded-full" />
                                        <div className="flex flex-col ml-4 gap-1 flex-1">
                                            <Skel className="h-5 w-32" />
                                            <Skel className="h-4 w-16" />
                                        </div>
                                        <Skel className="h-6 w-16 ml-auto" />
                                    </div>
                                    <div className="h-px w-full bg-[#1F1F1F]" />
                                    <div className="flex flex-col gap-2">
                                        {Array.from({ length: 3 }).map(
                                            (_, r) => (
                                                <div
                                                    key={r}
                                                    className="flex items-center gap-3"
                                                >
                                                    <Skel className="h-6 w-6 rounded-full" />
                                                    <Skel className="h-4 flex-1" />
                                                    <Skel className="h-4 w-16" />
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div className="mt-auto pt-2">
                                        <Skel className="h-10 w-full" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="h-px w-full bg-[#1F1F1F] my-[24px]" />

                    <Card className="mb-10">
                        <Skel className="h-6 w-64" />
                        <div className="flex flex-col gap-2 mt-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skel key={i} className="h-4 w-full" />
                            ))}
                            <Skel className="h-4 w-4/5" />
                            <Skel className="h-4 w-2/3" />
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default ProposalDetailSkeleton;
