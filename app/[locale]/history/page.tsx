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
import { useHistoryData } from "@/hooks";

export default function History() {
    const t = useTranslations("history");

    const {
        items,
        totalItems,
        totalPages,
        startItem,
        endItem,
        isLoading,

        searchValue,
        activeFilter,
        selectedType,
        currentPage,
        sortField,
        sortDirection,

        handleSearchChange,
        handleFilterChange,
        handleTypeChange,
        handlePageChange,
        handleSortChange,
    } = useHistoryData();

    const switcherItems = [
        { id: "all", label: t("allTransactions"), icon: stakeIcon },
        { id: "my", label: t("myTransactions"), icon: userIcon },
    ];

    const transactionFilterOptions: DropdownOption[] = [
        { id: "all", label: t("allTxns"), icon: stakeIcon },
        { id: "my", label: t("myTxns"), icon: userIcon },
    ];

    const typeOptions: DropdownOption[] = [
        { id: "all", label: t("allTypes"), icon: allTypesIcon },
        { id: "withdraw", label: t("types.withdraw"), icon: withdrawIcon },
        { id: "stake", label: t("types.stake"), icon: stakeIcon },
        { id: "claim", label: t("types.claim"), icon: claimIcon },
        { id: "propose", label: t("types.propose"), icon: proposeIcon },
        { id: "vote", label: t("types.vote"), icon: voteIcon },
    ];

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

                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 md:mb-4">
                        <div className="flex-1 min-w-0">
                            <SearchBar
                                placeholder={t("search")}
                                value={searchValue}
                                onChange={handleSearchChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>

                        <div className="hidden md:block flex-shrink-0">
                            <Switcher
                                items={
                                    switcherItems as [
                                        (typeof switcherItems)[0],
                                        (typeof switcherItems)[1]
                                    ]
                                }
                                activeId={activeFilter}
                                onSwitch={(id) => {
                                    handleFilterChange(id as "all" | "my");
                                }}
                                backgroundColor="bg-[#141414]"
                                activeBackgroundColor="bg-transparent"
                            />
                        </div>

                        <div className="hidden md:block flex-shrink-0 min-w-[180px]">
                            <Dropdown
                                options={typeOptions}
                                selectedId={selectedType}
                                onSelect={handleTypeChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="md:hidden flex gap-2 mb-4">
                        <div className="flex-1">
                            <Dropdown
                                options={transactionFilterOptions}
                                selectedId={activeFilter}
                                onSelect={(id) =>
                                    handleFilterChange(id as "all" | "my")
                                }
                                backgroundColor="bg-[#141414]"
                            />
                        </div>

                        <div className="flex-1">
                            <Dropdown
                                options={typeOptions}
                                selectedId={selectedType}
                                onSelect={handleTypeChange}
                                backgroundColor="bg-[#141414]"
                            />
                        </div>
                    </div>

                    <div className="md:hidden">
                        <Divider className="mt-[16px] mb-[17px]" />
                    </div>

                    <div className="mt-4 pb-[30px]">
                        <HistoryTable
                            items={items}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startItem={startItem}
                            endItem={endItem}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                            isLoading={isLoading}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSortChange={handleSortChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
