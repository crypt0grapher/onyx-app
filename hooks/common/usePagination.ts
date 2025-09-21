import { useDeviceType } from "./useDeviceType";

export const usePagination = () => {
    const deviceType = useDeviceType();
    const isMobile = deviceType === "mobile";

    const getVisiblePages = (currentPage: number, totalPages: number) => {
        const pages = [];
        const maxVisible = isMobile ? 5 : 7;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (isMobile) {
                if (currentPage <= 2) {
                    pages.push(1, 2, "...", totalPages);
                } else if (currentPage >= totalPages - 1) {
                    pages.push(1, "...", totalPages - 1, totalPages);
                } else {
                    pages.push(1, "...", currentPage, "...", totalPages);
                }
            } else {
                if (currentPage <= 3) {
                    pages.push(1, 2, 3, 4, "...", totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(
                        1,
                        "...",
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages
                    );
                } else {
                    pages.push(
                        1,
                        "...",
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                        "...",
                        totalPages
                    );
                }
            }
        }

        return pages;
    };

    return { isMobile, getVisiblePages };
};
