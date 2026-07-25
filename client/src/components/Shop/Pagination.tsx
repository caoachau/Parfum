import { getSlidingPages } from "../../lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getSlidingPages(currentPage, totalPages, 5);

  return (
    <div className="mt-14 flex items-center justify-center gap-5 text-[9px] uppercase tracking-[0.15em] text-[#77736C]">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="transition-colors hover:text-[#817000] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={
            currentPage === page
              ? "border-b border-[#817000] pb-1 text-[#817000]"
              : "transition-colors hover:text-[#817000]"
          }
        >
          {String(page).padStart(2, "0")}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="transition-colors hover:text-[#817000] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
