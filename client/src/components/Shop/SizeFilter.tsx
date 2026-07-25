import { useMemo, useState } from "react";
import FilterSection from "./FilterSection";

interface SizeFilterProps {
  sizes: string[];
  selected: string[];
  onToggle: (size: string) => void;
}

export default function SizeFilter({ sizes, selected, onToggle }: SizeFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const initialVisible = 4;
  const orderedCompact = useMemo(() => {
    const chosen = sizes.filter((size) => selected.includes(size));
    const remaining = sizes.filter((size) => !selected.includes(size));
    return [...chosen, ...remaining.slice(0, Math.max(0, initialVisible - chosen.length))];
  }, [selected, sizes]);
  const visibleSizes = showAll ? sizes : orderedCompact;

  const handleToggle = (size: string) => {
    onToggle(size);
    setShowAll(false);
  };

  return (
    <FilterSection title="Dung tích">
      <div className="flex flex-wrap gap-3">
        {visibleSizes.map((size) => {
          const active = selected.includes(size);

          return (
            <button
              key={size}
              type="button"
              onClick={() => handleToggle(size)}
              className={`px-4 py-2 border text-[11px] uppercase tracking-[2px] duration-300
                ${
                  active
                    ? "bg-[#735C00] text-white border-[#735C00]"
                    : "bg-white text-[#1C1C19] border-[#D0C5AF] hover:bg-[#735C00] hover:text-white"
                }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      {sizes.length > initialVisible && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#735C00] transition hover:text-[#4D410F]"
        >
          {showAll ? "Thu gọn" : `Xem tất cả (${sizes.length})`}
        </button>
      )}
    </FilterSection>
  );
}
