"use client";

import { useState } from "react";
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
    pathname: string;
    onNavigate?: () => void;
    className?: string;
};

const NavigationItem = ({
    item,
    isActive,
    pathname,
    onNavigate,
    className = "",
}: NavigationItemProps) => {
    const t = useTranslations("sidebar.navigation");
    const statusT = useTranslations("sidebar.status");
    const isInactive = isInactiveItem(item.key);
    const isExternal = item.href.startsWith("http");
    const hasChildren = item.children && item.children.length > 0;

    const [isExpanded, setIsExpanded] = useState(false);

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

    const activeIndicator = isActive && !hasChildren && (
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

    const chevron = hasChildren && (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={[
                "transition-transform duration-200 shrink-0",
                isExpanded ? "rotate-90" : "rotate-0",
            ].join(" ")}
            aria-hidden="true"
        >
            <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
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
            {chevron}
            {statusBadge}
        </>
    );

    // Items with children: render as expandable parent
    if (hasChildren) {
        return (
            <div>
                <button
                    type="button"
                    className={baseClasses}
                    aria-label={translatedLabel}
                    aria-expanded={isExpanded}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {content}
                </button>
                {isExpanded && item.children && (
                    <div className="ml-10 flex flex-col gap-1">
                        {item.children.map((child) => {
                            const isChildActive =
                                pathname === child.href;
                            const childLabel = t(child.key);

                            const childTextClasses = [
                                "text-[14px] leading-5 font-medium",
                                "rounded-full px-3 py-1.5",
                                "transition-colors duration-150",
                                isChildActive
                                    ? "text-primary"
                                    : "text-secondary hover:text-primary",
                            ].join(" ");

                            if (child.isExternal) {
                                return (
                                    <Link
                                        key={child.key}
                                        href={child.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={[
                                            childTextClasses,
                                            "relative flex items-center gap-1",
                                        ].join(" ")}
                                        aria-label={childLabel}
                                    >
                                        {childLabel}
                                        {isChildActive && (
                                            <div
                                                className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-px h-4 bg-primary"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </Link>
                                );
                            }

                            return (
                                <IntlLink
                                    key={child.key}
                                    href={child.href}
                                    className={[
                                        childTextClasses,
                                        "relative block",
                                    ].join(" ")}
                                    aria-label={childLabel}
                                    onClick={onNavigate}
                                >
                                    {childLabel}
                                    {isChildActive && (
                                        <div
                                            className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-px h-4 bg-primary"
                                            aria-hidden="true"
                                        />
                                    )}
                                </IntlLink>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // External link items (no children)
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

    // Standard internal link items (no children)
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
