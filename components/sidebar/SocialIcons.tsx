"use client";

import { socialItems } from "@/config/social";
import SocialIcon from "@/components/sidebar/SocialIcon";

type SocialIconsProps = {
    size?: number;
    className?: string;
    gap?: number;
    onClick?: (platform: string) => void;
};

const SocialIcons = ({
    size = 20,
    className = "",
    gap = 3,
    onClick,
}: SocialIconsProps) => {
    const containerClasses = [
        "flex items-center",
        `gap-${gap}`,
        className,
    ].join(" ");

    return (
        <div className={containerClasses}>
            {socialItems.map((item) => (
                <SocialIcon
                    key={item.platform}
                    item={item}
                    size={size}
                    onClick={onClick ? () => onClick(item.platform) : undefined}
                />
            ))}
        </div>
    );
};

export default SocialIcons;
