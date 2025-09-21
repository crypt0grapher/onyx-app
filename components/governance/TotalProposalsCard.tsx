import { useTranslations } from "next-intl";
import Image from "next/image";
import dashboardIcon from "@/assets/icons/dsahboard.svg";
import { useProposalCount } from "@/hooks/governance/useProposalCount";
import LoadingDots from "@/components/ui/common/LoadingDots";

const TotalProposalsCard = () => {
    const t = useTranslations("governance");
    const { total, isLoading } = useProposalCount();

    return (
        <div className="h-[128px] p-4 flex flex-col justify-end items-start rounded-[8px] border border-[#1F1F1F] bg-[#141414]">
            <div className="flex items-center mb-2">
                <Image
                    src={dashboardIcon}
                    alt="Total Proposals"
                    width={20}
                    height={20}
                    className="opacity-80"
                />
            </div>
            <div className="text-primary text-[20px] font-medium leading-[28px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                {isLoading ? <LoadingDots size="md" variant="inline" /> : total}
            </div>
            <div className="text-secondary text-[14px] font-normal leading-[20px] font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                {t("cards.totalProposals.title")}
            </div>
        </div>
    );
};

export default TotalProposalsCard;
