import mediumIcon from "@/assets/icons/Medium.svg";
import telegramIcon from "@/assets/icons/Telegram.svg";
import twitterIcon from "@/assets/icons/Twitter.svg";
import githubIcon from "@/assets/icons/Github.svg";

export type SocialPlatform = "medium" | "telegram" | "twitter" | "github";

export type SocialItem = {
    platform: SocialPlatform;
    label: string;
    icon: string;
    url: string;
    ariaLabel: string;
};

export const socialItems: SocialItem[] = [
    {
        platform: "medium",
        label: "Medium",
        icon: mediumIcon,
        url: "https://blog.onyx.org/",
        ariaLabel: "Follow us on Medium",
    },
    {
        platform: "telegram",
        label: "Telegram",
        icon: telegramIcon,
        url: "https://t.me/Onyx",
        ariaLabel: "Join our Telegram channel",
    },
    {
        platform: "twitter",
        label: "Twitter",
        icon: twitterIcon,
        url: "https://x.com/intent/follow?screen_name=Onyx",
        ariaLabel: "Follow us on Twitter",
    },
    {
        platform: "github",
        label: "GitHub",
        icon: githubIcon,
        url: "https://github.com/Onyx-Protocol",
        ariaLabel: "View our GitHub repositories",
    },
];
