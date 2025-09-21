import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import { type NavItem } from "@/config/navigation";
import { isInactiveItem } from "@/config/navigation";
import SidebarIcon from "@/components/sidebar/SidebarIcon";
import StatusBadge from "@/components/ui/pills/StatusBadge";

type NavigationItemProps = {
    item: NavItem;
    isActive: boolean;
    onNavigate?: () => void;
    className?: string;
};

const NavigationItem = ({
    item,
    isActive,
    onNavigate,
    className = "",
}: NavigationItemProps) => {
    const t = useTranslations("sidebar.navigation");
    const statusT = useTranslations("sidebar.status");
    const isInactive = isInactiveItem(item.key);
    const isExternal = item.href.startsWith("http");

    const translatedLabel = t(item.key);

    const baseClasses = [
        "group flex items-center justify-between w-full relative",
        "gap-3 rounded-full px-0 md:px-3 py-2",
        "cursor-pointer outline-none select-none",
        isInactive ? "opacity-50 cursor-default" : "",
        !isInactive && !isActive ? "hover:bg-transparent" : "",
        className,
    ].join(" ");

    const textClasses = [
        "text-[16px] leading-6 font-medium",
        isActive ? "text-primary" : "text-secondary",
        !isInactive ? "group-hover:text-primary" : "",
    ].join(" ");

    const activeIndicator = isActive && (
        <div
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-px h-5 bg-primary"
            aria-hidden="true"
        />
    );

    const statusBadge = (
        <div className="flex items-center gap-2">
            {item.key === "ai-agent" && (
                <StatusBadge
                    variant="success"
                    aria-label={statusT("aiAgentStatus")}
                >
                    {statusT("new")}
                </StatusBadge>
            )}
            {(item.key === "card" ||
                item.key === "payments" ||
                item.key === "enterprise") && (
                <StatusBadge
                    variant="normal"
                    aria-label={statusT("comingSoonStatus", {
                        item: translatedLabel,
                    })}
                >
                    {statusT("soon")}
                </StatusBadge>
            )}
        </div>
    );

    const content = (
        <>
            <div className="flex items-center gap-3">
                <SidebarIcon
                    src={item.icon}
                    isActive={isActive}
                    isInactive={isInactive}
                />
                <span className={textClasses}>{translatedLabel}</span>
            </div>
            {activeIndicator}
            {statusBadge}
        </>
    );

    if (isExternal) {
        return (
            <Link
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={baseClasses}
                aria-label={translatedLabel}
            >
                {content}
            </Link>
        );
    }

    return (
        <IntlLink
            href={item.href}
            className={[
                baseClasses,
                isInactive ? "pointer-events-none" : "",
            ].join(" ")}
            aria-label={item.label}
            onClick={onNavigate}
        >
            {content}
        </IntlLink>
    );
};

export default NavigationItem;
