import { type ImageLikeSrc } from "@/utils/image";
import { toSrc } from "@/utils/image";

type SidebarIconProps = {
    src: ImageLikeSrc;
    isActive: boolean;
    isInactive?: boolean;
};

const SidebarIcon = ({
    src,
    isActive,
    isInactive = false,
}: SidebarIconProps) => {
    const iconUrl = toSrc(src);
    return (
        <span
            aria-hidden="true"
            className={[
                "inline-block w-5 h-5 shrink-0",
                isActive ? "bg-primary" : "bg-secondary",
                !isInactive ? "group-hover:bg-primary" : "",
            ].join(" ")}
            style={{
                WebkitMaskImage: `url(${iconUrl})`,
                maskImage: `url(${iconUrl})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "center",
                maskPosition: "center",
            }}
        />
    );
};

export default SidebarIcon;
