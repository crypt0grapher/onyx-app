import React from "react";
import CloseIcon from "../common/CloseIcon";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  iconOnly?: boolean;
}

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className = "",
  iconOnly = false,
}) => {
  if (iconOnly) {
    return (
      <button
        onClick={onClick}
        className={`group cursor-pointer ${className}`}
        aria-label="Close"
      >
        <CloseIcon groupHover={true} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group flex cursor-pointer items-center justify-center p-2.5 rounded-full border border-[#1F1F1F] bg-[#141414] hover:bg-[#292929] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
      aria-label="Close"
    >
      <CloseIcon groupHover={true} />
    </button>
  );
};

export default CloseButton;
