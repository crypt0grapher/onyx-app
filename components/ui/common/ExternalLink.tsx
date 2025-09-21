import React from "react";

/**
 * External link icon component used for transaction hash links
 */
export const ExternalLinkIcon: React.FC<{
    className?: string;
    style?: React.CSSProperties;
}> = ({ className = "transition-colors", style }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className={className}
        style={style}
    >
        <path
            d="M15.2083 11.6667V16.875H3.125V4.79167H7.70833M11.4583 3.125H16.875M16.875 3.125V8.54167M16.875 3.125L9.16667 10.8333"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
        />
    </svg>
);

/**
 * Props for the ExternalLink component
 */
interface ExternalLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    underline?: boolean;
    allowWrap?: boolean; // New prop to enable text wrapping with icon on first line
}

/**
 * External link component with consistent styling
 */
const ExternalLink: React.FC<ExternalLinkProps> = ({
    href,
    children,
    className = "",
    underline = true,
    allowWrap = false,
}) => {
    const underlineClass = underline ? "underline" : "no-underline";

    if (allowWrap) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group text-secondary ${underlineClass} hover:text-neutral-200 transition-colors font-sans text-sm font-medium leading-5 underline-offset-auto ${className}`}
            >
                <div
                    className="flex items-start"
                    style={{
                        gap: "8px",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                    }}
                >
                    <span style={{ flex: 1 }}>{children}</span>
                    <ExternalLinkIcon
                        className="flex-shrink-0 transition-colors"
                        style={{
                            marginTop: "0",
                        }}
                    />
                </div>
            </a>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-2 text-secondary ${underlineClass} hover:text-neutral-200 transition-colors font-sans text-sm font-medium leading-5 underline-offset-auto ${className}`}
        >
            {children}
            <ExternalLinkIcon />
        </a>
    );
};

export default ExternalLink;
