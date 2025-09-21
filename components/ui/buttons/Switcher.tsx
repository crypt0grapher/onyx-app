import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { type ImageLikeSrc, toSrc } from "@/utils/image";

interface SwitcherItem {
    id: string;
    label: string;
    icon?: ImageLikeSrc;
}

interface SwitcherProps {
    items: [SwitcherItem, SwitcherItem];
    activeId: string;
    onSwitch: (id: string) => void;
    backgroundColor?: string;
    borderColor?: string;
    activeBorderColor?: string;
    activeBackgroundColor?: string;
}

const Switcher: React.FC<SwitcherProps> = ({
    items,
    activeId,
    onSwitch,
    backgroundColor = "bg-[#1B1B1B]",
    borderColor = "border-[#292929]",
    activeBorderColor = "border-[#292929]",
    activeBackgroundColor = "bg-[#1b1b1b]",
}) => {
    const activeIndex = items.findIndex((item) => item.id === activeId);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [slidingBg, setSlidingBg] = useState({ width: 0, left: 0 });
    const [isInitialized, setIsInitialized] = useState(false);

    const updateSlidingBg = useCallback(() => {
        const activeButton = buttonRefs.current[activeIndex];
        if (activeButton) {
            const newState = {
                width: activeButton.offsetWidth + 2,
                left: activeButton.offsetLeft - 1,
            };
            setSlidingBg(newState);
            if (!isInitialized) {
                setIsInitialized(true);
            }
        }
    }, [activeIndex, isInitialized]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(updateSlidingBg);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [updateSlidingBg]);

    useEffect(() => {
        const handleResize = () => {
            if (isInitialized) {
                requestAnimationFrame(updateSlidingBg);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [isInitialized, updateSlidingBg]);

    return (
        <div
            className={`relative inline-flex w-full items-start rounded-full border ${borderColor} ${backgroundColor}`}
        >
            <div
                className={`absolute top-[-1px] left-0 h-[42px] right-0 bottom-0 rounded-full ${activeBackgroundColor} border ${activeBorderColor} shadow-lg transition-all duration-300 ease-out ${
                    isInitialized ? "opacity-100" : "opacity-0"
                }`}
                style={{
                    width: `${slidingBg.width}px`,
                    transform: `translateX(${slidingBg.left}px)`,
                }}
            />

            {items.map((item, index) => {
                const isActive = item.id === activeId;
                return (
                    <button
                        key={item.id}
                        ref={(el) => {
                            buttonRefs.current[index] = el;
                        }}
                        onClick={() => onSwitch(item.id)}
                        className={`relative z-10 flex px-4 py-[10px] flex-row justify-center items-center w-auto flex-grow gap-2 rounded-full text-[14px] leading-[20px] transition-all duration-300 ease-out cursor-pointer hover:scale-105 ${
                            isActive
                                ? "text-[#E6E6E6] font-medium"
                                : "text-[#808080] font-normal hover:text-[#B0B0B0]"
                        } [font-feature-settings:'ss11' on,'cv09' on,'liga' off,'calt' off]`}
                    >
                        {item.icon && (
                            <Image
                                src={toSrc(item.icon)}
                                alt=""
                                width={20}
                                height={20}
                                className={`transition-all duration-300 ease-out ${
                                    isActive
                                        ? "opacity-100 scale-110"
                                        : "opacity-60 scale-100 hover:opacity-80 hover:scale-105"
                                }`}
                            />
                        )}
                        <span className="transition-all duration-300 ease-out">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default Switcher;
