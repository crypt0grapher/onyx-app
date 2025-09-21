"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import usFlag from "@/assets/icons/US.svg";
import trFlag from "@/assets/icons/TR.svg";
import arrowDown from "@/assets/icons/arrow-down.svg";

interface Language {
    code: "en" | "tr";
    label: string;
    flag: string;
}

const languages: Language[] = [
    { code: "en", label: "ENG", flag: usFlag },
    { code: "tr", label: "TUR", flag: trFlag },
];

interface LanguageSelectorProps {
    className?: string;
}

export default function LanguageSelector({
    className = "",
}: LanguageSelectorProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedLanguage =
        languages.find((lang) => lang.code === locale) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLanguageSelect = (language: Language) => {
        router.replace(pathname, { locale: language.code });
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center cursor-pointer group"
            >
                <Image
                    src={selectedLanguage.flag}
                    alt={selectedLanguage.label}
                    width={14}
                    height={14}
                />
                <span className="text-secondary group-hover:text-primary text-[14px] leading-5 font-normal ml-2 transition-colors duration-200">
                    {selectedLanguage.label}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="ml-1"
                >
                    <Image
                        src={arrowDown}
                        alt="Select language"
                        width={20}
                        height={20}
                        className="opacity-60 group-hover:opacity-100 group-hover:brightness-150 transition-all duration-200"
                    />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="absolute top-full right-0 mt-2 w-[180px] flex flex-col rounded-lg border border-stroke-lines bg-bg-boxes z-50 shadow-lg"
                    >
                        {languages.map((language, index) => (
                            <motion.button
                                key={language.code}
                                onClick={() => handleLanguageSelect(language)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.1 }}
                                className={`flex items-center py-2 px-4 rounded transition-colors duration-200 ${
                                    index < languages.length - 1
                                        ? "border-b border-stroke-lines"
                                        : ""
                                } ${
                                    selectedLanguage.code === language.code
                                        ? "text-primary hover:bg-bg-boxes-stroke"
                                        : "text-secondary hover:bg-bg-boxes-stroke"
                                }`}
                            >
                                <Image
                                    src={language.flag}
                                    alt={language.label}
                                    width={14}
                                    height={14}
                                    className={`${
                                        selectedLanguage.code === language.code
                                            ? "opacity-100"
                                            : "opacity-60"
                                    }`}
                                />
                                <span className="text-[14px] leading-5 font-normal ml-2">
                                    {language.label}
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
