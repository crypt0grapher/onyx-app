import React from "react";

/**
 * Props for the SimpleLink component
 */
interface SimpleLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Simple link component without external icon or underline, with hover effects
 */
const SimpleLink: React.FC<SimpleLinkProps> = ({
    href,
    children,
    className = "",
}) => (
    <a
        href={href}
        className={`text-secondary hover:text-neutral-200 transition-colors text-[14px] leading-5 font-normal cursor-pointer ${className}`}
    >
        {children}
    </a>
);

export default SimpleLink;
