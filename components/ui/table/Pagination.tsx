import React, { useRef, useEffect } from "react";
import { usePagination } from "@/hooks/common/usePagination";
import { LeftArrow, RightArrow } from "@/components/ui/common/Arrows";
import PaginationNavigationButton from "./PaginationNavigationButton";
import PaginationControls from "./PaginationControls";
import PaginationResults from "./PaginationResults";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  onPageChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);
  const userInitiatedRef = useRef(false);

  const handlePageClick = (page: number) => {
    if (
      onPageChange &&
      page !== currentPage &&
      page >= 1 &&
      page <= totalPages
    ) {
      userInitiatedRef.current = true;
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageClick(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageClick(currentPage + 1);
    }
  };

  const { getVisiblePages } = usePagination();
  const visiblePages = getVisiblePages(currentPage, totalPages);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (userInitiatedRef.current && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "nearest",
      });
      userInitiatedRef.current = false;
    }
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-row items-center ${className} pt-[8px]`}
    >
      <PaginationResults
        startItem={startItem}
        endItem={endItem}
        totalItems={totalItems}
      />

      <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 flex items-center gap-2 mx-auto md:mx-0 justify-center">
        <PaginationNavigationButton
          onClick={handlePrevious}
          disabled={currentPage === 1}
          ariaLabel="Previous page"
        >
          <LeftArrow />
        </PaginationNavigationButton>

        <PaginationControls
          visiblePages={visiblePages}
          currentPage={currentPage}
          onPageClick={handlePageClick}
        />

        <PaginationNavigationButton
          onClick={handleNext}
          disabled={currentPage === totalPages}
          ariaLabel="Next page"
        >
          <RightArrow />
        </PaginationNavigationButton>
      </div>
    </div>
  );
};

export default Pagination;
