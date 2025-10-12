import aiAgent from "@/assets/icons/ai-agent.svg";
import bridge from "@/assets/icons/bridge.svg";
import card from "@/assets/icons/card.svg";
import enterprise from "@/assets/icons/enterprise.svg";
import farm from "@/assets/icons/farm.svg";
import governance from "@/assets/icons/governance.svg";
import history from "@/assets/icons/history.svg";
import payments from "@/assets/icons/payments.svg";
import points from "@/assets/icons/points.svg";
import stake from "@/assets/icons/stake.svg";
import swap from "@/assets/icons/swap.svg";
import { type ImageLikeSrc } from "@/utils/image";

export type NavItem = {
    key: string;
    label: string;
    icon: ImageLikeSrc;
    href: string;
};

export const navItems: NavItem[] = [
    { key: "stake", label: "Stake", icon: stake, href: "/" },
    { key: "history", label: "History", icon: history, href: "/history" },
    { key: "swap", label: "Swap", icon: swap, href: "/swap" },
    {
        key: "bridge",
        label: "Bridge",
        icon: bridge,
        href: "https://bridge.onyx.org/",
    },
    { key: "farm", label: "Farm", icon: farm, href: "/farm" },
    {
        key: "governance",
        label: "Governance",
        icon: governance,
        href: "/governance",
    },
    {
        key: "ai-agent",
        label: "AI Agent",
        icon: aiAgent,
        href: "https://ai.onyx.org/",
    },
    { key: "points", label: "Points", icon: points, href: "/points" },
    { key: "card", label: "Card", icon: card, href: "/card" },
    { key: "payments", label: "Payments", icon: payments, href: "/payments" },
    {
        key: "enterprise",
        label: "Enterprise",
        icon: enterprise,
        href: "/enterprise",
    },
];

export const isInactiveItem = (key: string): boolean => {
    return key === "card" || key === "payments" || key === "enterprise";
};

export type FooterLink = {
    key: string;
    label: string;
    href: string;
};

export const footerLinks: FooterLink[] = [
    {
        key: "terms",
        label: "Terms",
        href: "https://docs.onyx.org/terms-of-service/terms",
    },
    {
        key: "disclosures",
        label: "Disclosures",
        href: "https://docs.onyx.org/token-distribution",
    },
    { key: "docs", label: "Docs", href: "https://docs.onyx.org" },
];
