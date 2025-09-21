"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";

interface AnimatedHamburgerProps extends ComponentProps<"svg"> {
    isOpen: boolean;
}

const AnimatedHamburger = ({
    isOpen,
    className,
    ...props
}: AnimatedHamburgerProps) => {
    const hasMountedRef = useRef(false);
    const [internalOpen, setInternalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            if (isOpen) {
                const id = requestAnimationFrame(() => setInternalOpen(true));
                return () => cancelAnimationFrame(id);
            }
            setInternalOpen(false);
            return;
        }
        setInternalOpen(isOpen);
    }, [isOpen]);

    return (
        <svg
            width={20}
            height={20}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            focusable={false}
            className={[
                "hamburger-icon",
                internalOpen ? "open" : "",
                className ?? "",
            ].join(" ")}
            {...props}
        >
            <line
                x1="2.2915"
                y1="4.791"
                x2="17.7085"
                y2="4.791"
                stroke="#808080"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="hamburger-line top"
            />
            <line
                x1="2.2915"
                y1="10"
                x2="17.7085"
                y2="10"
                stroke="#808080"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="hamburger-line middle"
            />
            <line
                x1="2.2915"
                y1="15.208"
                x2="17.7085"
                y2="15.208"
                stroke="#808080"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="hamburger-line bottom"
            />
            <style jsx>{`
                .hamburger-icon :global(.hamburger-line) {
                    transition: transform 200ms ease, opacity 200ms ease;
                    transform-box: fill-box;
                    transform-origin: center;
                }
                .hamburger-icon :global(.top) {
                    transform: translateY(0) rotate(0deg);
                }
                .hamburger-icon :global(.middle) {
                    opacity: 1;
                    transform: translateY(0) rotate(0deg);
                }
                .hamburger-icon :global(.bottom) {
                    transform: translateY(0) rotate(0deg);
                }
                .hamburger-icon.open :global(.top) {
                    transform: translateY(5px) rotate(45deg);
                }
                .hamburger-icon.open :global(.middle) {
                    opacity: 0;
                }
                .hamburger-icon.open :global(.bottom) {
                    transform: translateY(-5px) rotate(-45deg);
                }
            `}</style>
        </svg>
    );
};

export default AnimatedHamburger;
