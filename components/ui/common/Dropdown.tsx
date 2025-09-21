"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import arrowDown from "@/assets/icons/arrow-down.svg";
import { ImageLikeSrc, toSrc } from "@/utils/image";

export interface DropdownOption {
  id: string;
  label: string;
  icon?: ImageLikeSrc;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
  backgroundColor?: string;
  borderColor?: string;
  dropdownBackgroundColor?: string;
  dropdownBorderColor?: string;
  forcePrimaryColors?: boolean;
  gap?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedId,
  onSelect,
  className = "",
  backgroundColor = "bg-bg-boxes",
  borderColor = "border-stroke-lines",
  dropdownBackgroundColor = "bg-[#141414]",
  dropdownBorderColor = "border-stroke-lines",
  forcePrimaryColors = false,
  gap,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((option) => option.id === selectedId) || options[0];

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

  const handleOptionSelect = (option: DropdownOption) => {
    if (disabled) return;
    onSelect(option.id);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex p-[10px_16px] flex-col items-start gap-2 rounded-[1000px] border ${borderColor} ${backgroundColor} ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } group w-full`}
      >
        <div
          className={`flex items-center justify-between w-full ${gap || ""}`}
        >
          <div className="flex items-center gap-2">
            {selectedOption.icon && (
              <Image
                src={toSrc(selectedOption.icon)}
                alt={selectedOption.label}
                width={20}
                height={20}
                className={
                  forcePrimaryColors
                    ? "opacity-100"
                    : "opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                }
              />
            )}
            <span
              className={`text-[14px] font-medium leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] ${
                forcePrimaryColors
                  ? "text-primary"
                  : "text-secondary group-hover:text-primary transition-colors duration-200"
              }`}
            >
              {selectedOption.label}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="ml-2"
          >
            <Image
              src={arrowDown}
              alt="Toggle dropdown"
              width={20}
              height={20}
              className={
                forcePrimaryColors
                  ? "opacity-100"
                  : "opacity-60 group-hover:opacity-100 group-hover:brightness-150 transition-all duration-200"
              }
            />
          </motion.div>
        </div>
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
            className={`absolute top-full left-0 mt-1 w-full flex flex-col gap-0 rounded-lg border ${dropdownBorderColor} ${dropdownBackgroundColor} z-50 shadow-lg`}
          >
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={`flex items-center cursor-pointer gap-2 w-full text-left px-[16px] py-[12px] transition-all duration-200 group hover:bg-[#1B1B1B] ${
                  index !== options.length - 1
                    ? "border-b border-[#1F1F1F]"
                    : ""
                }`}
              >
                {option.icon && (
                  <Image
                    src={toSrc(option.icon)}
                    alt={option.label}
                    width={20}
                    height={20}
                    className={
                      forcePrimaryColors
                        ? "opacity-100"
                        : option.id === selectedId
                        ? "opacity-100"
                        : "opacity-60"
                    }
                  />
                )}
                <span
                  className={`text-[14px] font-medium leading-5 [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] ${
                    forcePrimaryColors
                      ? "text-primary"
                      : option.id === selectedId
                      ? "text-primary"
                      : "text-secondary"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
