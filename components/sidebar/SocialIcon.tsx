"use client";

import Image from "next/image";
import { type SocialItem } from "@/config/social";
import Link from "next/link";

type SocialIconProps = {
    item: SocialItem;
    size?: number;
    className?: string;
    onClick?: () => void;
};

const SocialIcon = ({
    item,
    size = 20,
    className = "",
    onClick,
}: SocialIconProps) => {
    const baseClasses = [
        "cursor-pointer transition-all duration-200",
        "hover:scale-110",
        "hover:brightness-0 hover:invert",
        "active:scale-95",
        className,
    ].join(" ");

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={baseClasses}
                aria-label={item.ariaLabel}
                type="button"
            >
                <Image
                    src={item.icon}
                    alt={item.label}
                    width={size}
                    height={size}
                />
            </button>
        );
    }

    return (
        <Link
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={baseClasses}
            aria-label={item.ariaLabel}
        >
            <Image
                src={item.icon}
                alt={item.label}
                width={size}
                height={size}
            />
        </Link>
    );
};

export default SocialIcon;
