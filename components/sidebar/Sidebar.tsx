"use client";

import SidebarHeader from "@/components/sidebar/SidebarHeader";
import SidebarNavigation from "@/components/sidebar/SidebarNavigation";
import SidebarFooter from "@/components/sidebar/SidebarFooter";
import WalletCapsule from "@/components/sidebar/WalletCapsule";

export default function Sidebar() {
    return (
        <aside
            aria-label="Sidebar navigation"
            className="hidden lg:block fixed left-0 top-0 w-[304px] shrink-0 border-r bg-[#141414] border-border-primary h-screen overflow-y-auto"
        >
            <div className="pt-6 px-3 flex min-h-screen flex-col">
                <SidebarHeader showPricePill={true} />

                <div className="mt-5" />
                <WalletCapsule />

                <SidebarNavigation className="mt-5" />

                <SidebarFooter className="mt-auto -ml-3 pl-6 pr-3 mb-4" />
            </div>
        </aside>
    );
}
