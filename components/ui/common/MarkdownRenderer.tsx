import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const allowedElements = [
    "p",
    "a",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
];

const featureSettings =
    "[font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]";

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className,
}) => {
    const highlightVotePhrases = (children: React.ReactNode) => {
        const regex = /(Vote\s*["“”]For["“”]|Vote\s*["“”]Against["“”])/g;
        const baseClass = `text-primary font-sans text-sm font-medium leading-5 ${featureSettings}`;
        const transformString = (text: string) => {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(text.slice(lastIndex, match.index));
                }
                const value = match[0];
                parts.push(
                    <span key={`${match.index}-${value}`} className={baseClass}>
                        {value}
                    </span>
                );
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < text.length) {
                parts.push(text.slice(lastIndex));
            }
            return parts.length ? parts : text;
        };
        return React.Children.map(children, (child) => {
            if (typeof child === "string") return transformString(child);
            return child;
        });
    };
    return (
        <div className={className}>
            <ReactMarkdown
                skipHtml
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeSanitize]}
                allowedElements={allowedElements}
                unwrapDisallowed
                components={{
                    p: ({ children }) => (
                        <p
                            className={`mb-6 text-secondary font-sans text-sm font-normal leading-5 ${featureSettings}`}
                        >
                            {highlightVotePhrases(children)}
                        </p>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-primary font-sans text-sm font-medium leading-5 underline underline-offset-2 overflow-wrap-anywhere break-words ${featureSettings}`}
                        >
                            {children}
                        </a>
                    ),
                    ul: ({ children }) => (
                        <ul
                            className={`mb-6 list-disc pl-5 space-y-1 text-secondary font-sans text-sm leading-5 ${featureSettings}`}
                        >
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol
                            className={`mb-6 list-decimal pl-5 space-y-1 text-secondary font-sans text-sm leading-5 ${featureSettings}`}
                        >
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="marker:text-secondary">
                            {highlightVotePhrases(children)}
                        </li>
                    ),
                    strong: ({ children }) => (
                        <strong
                            className={`text-primary font-medium ${featureSettings}`}
                        >
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote
                            className={`mb-6 border-l-2 border-[#1F1F1F] pl-4 text-secondary font-sans text-sm leading-5 overflow-wrap-anywhere break-words ${featureSettings}`}
                        >
                            {highlightVotePhrases(children)}
                        </blockquote>
                    ),
                    code: (props) => {
                        const { inline, children } = props as unknown as {
                            inline?: boolean;
                            children: React.ReactNode;
                        };
                        return inline ? (
                            <code className="rounded bg-[#1B1B1B] px-1 py-0.5 text-primary text-[12px] overflow-wrap-anywhere break-words">
                                {children}
                            </code>
                        ) : (
                            <code className="block rounded bg-[#1B1B1B] p-3 text-primary text-[12px] whitespace-pre overflow-x-auto overflow-wrap-anywhere break-words">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="my-3 overflow-x-auto">{children}</pre>
                    ),
                    h1: ({ children }) => (
                        <h1
                            className={`mb-2 text-primary font-sans text-lg font-medium leading-7 ${featureSettings}`}
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            className={`mb-2 text-primary font-sans text-base font-medium leading-6 ${featureSettings}`}
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3
                            className={`mb-2 text-primary font-sans text-base font-medium leading-6 ${featureSettings}`}
                        >
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4
                            className={`mb-2 text-primary font-sans text-sm font-medium leading-5 ${featureSettings}`}
                        >
                            {children}
                        </h4>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
