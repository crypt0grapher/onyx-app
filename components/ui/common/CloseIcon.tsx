import React from "react";

interface CloseIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  groupHover?: boolean;
}

const CloseIcon: React.FC<CloseIconProps> = ({
  className = "",
  size = "md",
  groupHover = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",  
    lg: "w-6 h-6",
  };

  const iconSizes = {
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
  };

  const iconSize = iconSizes[size];

  const hoverClass = groupHover ? "group-hover:stroke-white" : "hover:stroke-white";

  return (
    <svg
      width={iconSize.width}
      height={iconSize.height}
      viewBox="0 0 20 20"
      fill="none"
      className={`transition-colors duration-200 stroke-[#808080] ${hoverClass} ${sizeClasses[size]} ${className}`}
    >
      <path
        d="M5 5L15 15M15 5L5 15"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
};

export default CloseIcon;
