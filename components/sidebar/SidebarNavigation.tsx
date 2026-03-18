"use client";

import { usePathname } from "@/i18n/navigation";
import NavigationItem from "@/components/sidebar/NavigationItem";
import { navItems } from "@/config/navigation";
import { normalizePath } from "@/utils/paths";

interface SidebarNavigationProps {
    onNavigate?: () => void;
    className?: string;
}

export default function SidebarNavigation({
    onNavigate,
    className = "",
}: SidebarNavigationProps) {
    const pathname = usePathname();

    const normalizedPath = normalizePath(pathname);

    return (
        <nav
            className={`flex flex-col gap-1 ${className}`}
            aria-label="Primary"
        >
            {navItems.map((item) => {
                const isActive = item.children
                    ? item.children.some(
                          (child) => normalizedPath === child.href
                      )
                    : normalizedPath === item.href;

                return (
                    <NavigationItem
                        key={item.key}
                        item={item}
                        isActive={isActive}
                        pathname={normalizedPath}
                        onNavigate={onNavigate}
                    />
                );
            })}
        </nav>
    );
}
