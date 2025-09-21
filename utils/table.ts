/**
 * Generates skeleton cell data for table loading states
 * @param headers - Array of table headers with className properties
 * @returns Array of skeleton cell configuration objects
 */
export const createSkeletonCells = (headers: { className?: string }[]) =>
    headers.map((header) => ({
        content: "skeleton",
        className: header.className,
        skeletonWidth: header.className?.includes("w-[156px]")
            ? "w-32"
            : header.className?.includes("w-[120px]")
            ? "w-24"
            : "w-20",
    }));
