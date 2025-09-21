"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import GovernanceHeader from "@/components/governance/GovernanceHeader";
import GovernanceCards from "@/components/governance/GovernanceCards";
import ProposalsList from "@/components/governance/ProposalsList";
import Divider from "@/components/ui/common/Divider";
import SearchBar from "@/components/ui/common/SearchBar";
import Dropdown from "@/components/ui/common/Dropdown";
import { statusFilterOptions } from "@/config/governance";
import allTypesIcon from "@/assets/icons/all_types.svg";

export default function Governance() {
    const t = useTranslations();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all-statuses");

    const dropdownOptions = statusFilterOptions.map((option) => ({
        ...option,
        label: t(option.labelKey),
        icon: allTypesIcon,
    }));

    return (
        <div className="lg:min-h-screen mb-[32px] lg:mb-0 h-full">
            <main className="lg:ml-[304px] h-full mb-[16px] lg:p-6">
                <div className="px-4 lg:px-0">
                    <GovernanceHeader />
                    <GovernanceCards />

                    <Divider className="mt-6 mb-[25px]" />

                    <div className="flex flex-col md:flex-row gap-2 mb-4 w-full">
                        <div className="flex-1">
                            <SearchBar
                                placeholder={t(
                                    "governance.proposal.searchPlaceholder"
                                )}
                                backgroundColor="bg-[#141414]"
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <Dropdown
                                options={dropdownOptions}
                                selectedId={selectedStatus}
                                onSelect={setSelectedStatus}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>
                    </div>

                    <ProposalsList
                        searchQuery={searchQuery}
                        statusFilter={selectedStatus}
                    />
                </div>
            </main>
        </div>
    );
}
