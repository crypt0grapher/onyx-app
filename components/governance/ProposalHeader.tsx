import React from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import ExternalLink from "@/components/ui/common/ExternalLink";
import { buildEtherscanUrl } from "@/utils/explorer";
import arrowBackIcon from "@/assets/icons/arrow_back.svg";
import governanceSmall from "@/assets/governance/onyx_governance_small.svg";

interface ProposalHeaderProps {
    title: string;
    txHash: string;
}

const ProposalHeader: React.FC<ProposalHeaderProps> = ({ title, txHash }) => {
    const router = useRouter();
    const t = useTranslations("governance.proposal");
    const goBack = () => router.push(`/governance`);

    return (
        <div className="flex items-end justify-between">
            <div className="flex flex-col items-start">
                <SecondaryButton
                    label={t("backToOverview")}
                    icon={arrowBackIcon}
                    onClick={goBack}
                    backgroundColor="#141414"
                />
                <h1 className="mt-4 text-primary max-w-[475px] font-sans text-2xl font-medium leading-8 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                    {title}
                </h1>
                <div className="mt-1">
                    <ExternalLink
                        href={txHash ? buildEtherscanUrl(txHash, "tx") : "#"}
                        className="text-secondary"
                        allowWrap
                    >
                        {txHash || "No transaction hash"}
                    </ExternalLink>
                </div>
            </div>

            <div className="hidden 2xl:block self-end">
                <Image
                    src={governanceSmall}
                    alt="Onyx Governance"
                    width={290}
                    height={162}
                    className="object-contain"
                />
            </div>
        </div>
    );
};

export default ProposalHeader;
