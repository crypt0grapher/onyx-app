"use client";

import { useTranslations } from "next-intl";
import SearchBar from "@/components/ui/common/SearchBar";
import Switcher from "@/components/ui/buttons/Switcher";
import Dropdown, { type DropdownOption } from "@/components/ui/common/Dropdown";
import Divider from "@/components/ui/common/Divider";
import HistoryTable from "@/components/history/HistoryTable";
import stakeIcon from "@/assets/icons/stake.svg";
import userIcon from "@/assets/icons/user.svg";
import allTypesIcon from "@/assets/icons/all_types.svg";
import withdrawIcon from "@/assets/icons/withdraw.svg";
import claimIcon from "@/assets/icons/claim.svg";
import proposeIcon from "@/assets/icons/propose.svg";
import voteIcon from "@/assets/icons/vote.svg";
import bridgeIcon from "@/assets/icons/bridge.svg";
import swapIcon from "@/assets/icons/swap.svg";
import { useHistoryData } from "@/hooks";
import { useUnifiedHistory } from "@/hooks/history/useUnifiedHistory";
import type { HistoryNetwork } from "@/types/history";

export default function History() {
    const t = useTranslations("history");

    // Existing subgraph-based history (Ethereum)
    const subgraphHistory = useHistoryData();

    // Unified history for non-subgraph sources (bridge, swap, etc.)
    const unifiedHistory = useUnifiedHistory();

    // Network filter state -- managed separately so it can select which
    // data source feeds into the table.
    const networkFilter = unifiedHistory.networkFilter;

    // Determine which data set to render based on the active network filter.
    // "all" and "ethereum" use the existing subgraph-powered hook, which
    // handles server-side pagination/sorting.  "goliath" and "onyx" use
    // unified history from local adapters.
    const useSubgraph =
        networkFilter === "all" || networkFilter === "ethereum";

    const activeData = useSubgraph
        ? {
              items: subgraphHistory.items,
              totalItems: subgraphHistory.totalItems,
              totalPages: subgraphHistory.totalPages,
              startItem: subgraphHistory.startItem,
              endItem: subgraphHistory.endItem,
              isLoading: subgraphHistory.isLoading,
              currentPage: subgraphHistory.currentPage,
              sortField: subgraphHistory.sortField,
              sortDirection: subgraphHistory.sortDirection,
              searchValue: subgraphHistory.searchValue,
              activeFilter: subgraphHistory.activeFilter,
              selectedType: subgraphHistory.selectedType,
              handleSearchChange: subgraphHistory.handleSearchChange,
              handleFilterChange: subgraphHistory.handleFilterChange,
              handleTypeChange: subgraphHistory.handleTypeChange,
              handlePageChange: subgraphHistory.handlePageChange,
              handleSortChange: subgraphHistory.handleSortChange,
          }
        : {
              items: unifiedHistory.items,
              totalItems: unifiedHistory.totalItems,
              totalPages: unifiedHistory.totalPages,
              startItem: unifiedHistory.startItem,
              endItem: unifiedHistory.endItem,
              isLoading: unifiedHistory.isLoading,
              currentPage: unifiedHistory.currentPage,
              sortField: undefined,
              sortDirection: undefined as "asc" | "desc" | undefined,
              searchValue: unifiedHistory.searchQuery,
              activeFilter: unifiedHistory.userFilter,
              selectedType: unifiedHistory.typeFilter,
              handleSearchChange: unifiedHistory.handleSearchChange,
              handleFilterChange: unifiedHistory.handleUserFilterChange,
              handleTypeChange: (type: string) =>
                  unifiedHistory.handleTypeFilterChange(
                      type as Parameters<
                          typeof unifiedHistory.handleTypeFilterChange
                      >[0],
                  ),
              handlePageChange: unifiedHistory.handlePageChange,
              handleSortChange: undefined,
          };

    // -----------------------------------------------------------------------
    // Filter option lists
    // -----------------------------------------------------------------------

    const networkOptions: DropdownOption[] = [
        { id: "all", label: t("filters.allNetworks"), icon: allTypesIcon },
        { id: "ethereum", label: "Ethereum", icon: stakeIcon },
        { id: "goliath", label: "Goliath", icon: stakeIcon },
    ];

    const switcherItems = [
        { id: "all", label: t("allTransactions"), icon: stakeIcon },
        { id: "my", label: t("myTransactions"), icon: userIcon },
    ];

    const transactionFilterOptions: DropdownOption[] = [
        { id: "all", label: t("allTxns"), icon: stakeIcon },
        { id: "my", label: t("myTxns"), icon: userIcon },
    ];

    // Type options differ based on the active network. When showing
    // subgraph data (Ethereum) we keep the original set.  For Goliath/Onyx
    // we expose bridge, swap, stake, unstake.
    const subgraphTypeOptions: DropdownOption[] = [
        { id: "all", label: t("allTypes"), icon: allTypesIcon },
        { id: "withdraw", label: t("types.withdraw"), icon: withdrawIcon },
        { id: "stake", label: t("types.stake"), icon: stakeIcon },
        { id: "claim", label: t("types.claim"), icon: claimIcon },
        { id: "propose", label: t("types.propose"), icon: proposeIcon },
        { id: "vote", label: t("types.vote"), icon: voteIcon },
    ];

    const unifiedTypeOptions: DropdownOption[] = [
        { id: "all", label: t("allTypes"), icon: allTypesIcon },
        { id: "bridge", label: t("types.bridge"), icon: bridgeIcon },
        { id: "swap", label: t("types.swap"), icon: swapIcon },
        { id: "stake", label: t("types.stake"), icon: stakeIcon },
        { id: "unstake", label: t("types.unstake"), icon: withdrawIcon },
    ];

    const typeOptions = useSubgraph ? subgraphTypeOptions : unifiedTypeOptions;

    return (
        <div className="min-h-screen">
            <main className="lg:ml-[304px] lg:p-6">
                <div className="px-4 lg:px-0 md:pt-0">
                    <h2 className="text-primary text-[24px] font-medium leading-[32px] mb-[4px]">
                        {t("title")}
                    </h2>
                    <p className="text-secondary text-[14px] leading-[20px] mb-[24px]">
                        {t("description")}
                    </p>

                    {/* Network filter row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {networkOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() =>
                                    unifiedHistory.handleNetworkFilterChange(
                                        opt.id as HistoryNetwork | "all",
                                    )
                                }
                                className={`flex items-center gap-1.5 px-4 py-[8px] rounded-full border text-[13px] font-medium leading-[20px] transition-colors duration-200 cursor-pointer [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] ${
                                    networkFilter === opt.id
                                        ? "border-[#E6E6E6] bg-[#1B1B1B] text-primary"
                                        : "border-[#292929] bg-transparent text-secondary hover:text-primary hover:border-[#3A3A3A]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 md:mb-4">
                        <div className="flex-1 min-w-0">
                            <SearchBar
                                placeholder={t("search")}
                                value={activeData.searchValue}
                                onChange={activeData.handleSearchChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>

                        <div className="hidden md:block flex-shrink-0">
                            <Switcher
                                items={
                                    switcherItems as [
                                        (typeof switcherItems)[0],
                                        (typeof switcherItems)[1],
                                    ]
                                }
                                activeId={activeData.activeFilter}
                                onSwitch={(id) => {
                                    activeData.handleFilterChange(
                                        id as "all" | "my",
                                    );
                                }}
                                backgroundColor="bg-[#141414]"
                                activeBackgroundColor="bg-transparent"
                            />
                        </div>

                        <div className="hidden md:block flex-shrink-0 min-w-[180px]">
                            <Dropdown
                                options={typeOptions}
                                selectedId={activeData.selectedType}
                                onSelect={activeData.handleTypeChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="md:hidden flex gap-2 mb-4">
                        <div className="flex-1">
                            <Dropdown
                                options={transactionFilterOptions}
                                selectedId={activeData.activeFilter}
                                onSelect={(id) =>
                                    activeData.handleFilterChange(
                                        id as "all" | "my",
                                    )
                                }
                                backgroundColor="bg-[#141414]"
                            />
                        </div>

                        <div className="flex-1">
                            <Dropdown
                                options={typeOptions}
                                selectedId={activeData.selectedType}
                                onSelect={activeData.handleTypeChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="md:hidden">
                        <Divider className="mt-[16px] mb-[17px]" />
                    </div>

                    <div className="mt-4 pb-[30px]">
                        <HistoryTable
                            items={activeData.items}
                            currentPage={activeData.currentPage}
                            totalPages={activeData.totalPages}
                            startItem={activeData.startItem}
                            endItem={activeData.endItem}
                            totalItems={activeData.totalItems}
                            onPageChange={activeData.handlePageChange}
                            isLoading={activeData.isLoading}
                            sortField={activeData.sortField}
                            sortDirection={activeData.sortDirection}
                            onSortChange={activeData.handleSortChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
