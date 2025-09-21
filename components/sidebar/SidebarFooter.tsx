"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import dotSeparator from "@/assets/icons/dot-separator.svg";
import SocialIcons from "@/components/sidebar/SocialIcons";
import LanguageSelector from "@/components/sidebar/LanguageSelector";
import ExternalLink from "@/components/ui/common/ExternalLink";
import SimpleLink from "@/components/ui/common/SimpleLink";
import { footerLinks } from "@/config/navigation";
import Divider from "../ui/common/Divider";
import AddXcnNetworkCard from "./AddXcnNetworkCard";
import { useLatestBlockNumber } from "@/hooks";
import { buildExplorerUrl } from "@/utils/explorer";

interface SidebarFooterProps {
    className?: string;
}

export default function SidebarFooter({ className = "" }: SidebarFooterProps) {
    const t = useTranslations("sidebar.footer");
    const { chainId, blockNumber } = useLatestBlockNumber();

    return (
        <div className={className}>
            <AddXcnNetworkCard />

            <div className="flex items-center justify-between">
                <SocialIcons />
                <LanguageSelector />
            </div>

            <div className="mt-3 flex items-center justify-between">
                <span
                    className={[
                        "text-secondary",
                        "text-[14px] leading-5 font-normal",
                    ].join(" ")}
                >
                    {t("lastBlock")}
                </span>
                {blockNumber ? (
                    <ExternalLink
                        href={buildExplorerUrl(blockNumber, "block", chainId)}
                        underline={false}
                    >
                        <span>{String(blockNumber)}</span>
                    </ExternalLink>
                ) : (
                    <span className="inline-block h-[20px] w-24 bg-[#1F1F1F] rounded animate-pulse" />
                )}
            </div>

            <Divider className="mb-4 mt-4" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SimpleLink href={footerLinks[0].href}>
                        <span className="text-secondary hover:text-neutral-200 transition-colors text-[14px] leading-5 font-normal">
                            {t(footerLinks[0].key)}
                        </span>
                    </SimpleLink>
                    <Image
                        src={dotSeparator}
                        alt=""
                        width={2}
                        height={2}
                        className="text-secondary"
                        aria-hidden="true"
                    />
                    <SimpleLink href={footerLinks[1].href}>
                        {t(footerLinks[1].key)}
                    </SimpleLink>
                </div>
                <ExternalLink href={footerLinks[2].href} underline={false}>
                    <span>{t(footerLinks[2].key)}</span>
                </ExternalLink>
            </div>
        </div>
    );
}
