import { useMemo, useState } from "react";
import FilterSection from "./FilterSection";

interface OccasionFilterProps {
  occasions: string[];
  selected: string[];
  onToggle: (item: string) => void;
}

export default function OccasionFilter({ occasions, selected, onToggle }: OccasionFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const initialVisible = 4;
  const orderedCompact = useMemo(() => {
    const chosen = occasions.filter((item) => selected.includes(item));
    const remaining = occasions.filter((item) => !selected.includes(item));
    return [...chosen, ...remaining.slice(0, Math.max(0, initialVisible - chosen.length))];
  }, [occasions, selected]);
  const visibleOccasions = showAll ? occasions : orderedCompact;

  const handleToggle = (item: string) => {
    onToggle(item);
    setShowAll(false);
  };

  return (
    <FilterSection title="Dịp sử dụng">
      <div className="flex flex-wrap gap-3">
        {visibleOccasions.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => handleToggle(item)}
              className={`px-4 py-2 border text-[11px] uppercase tracking-[2px] duration-300
                ${
                  active
                    ? "bg-[#735C00] text-white border-[#735C00]"
                    : "bg-white text-[#1C1C19] border-[#D0C5AF] hover:bg-[#735C00] hover:text-white"
                }`}
            >
              {item}
            </button>
          );
        })}
      </div>
      {occasions.length > initialVisible && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#735C00] transition hover:text-[#4D410F]"
        >
          {showAll ? "Thu gọn" : `Xem tất cả (${occasions.length})`}
        </button>
      )}
    </FilterSection>
  );
}
