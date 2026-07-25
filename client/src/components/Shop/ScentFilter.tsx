import { useState } from "react";
import FilterSection from "./FilterSection";

interface ScentFilterProps {
  scents: string[];
  selected: string[];
  onToggle: (value: string) => void;
  initialVisible?: number;
  title?: string;
  emptyMessage?: string;
}

const norm = (value: string) => value.trim().toLowerCase();

export default function ScentFilter({
  scents,
  selected,
  onToggle,
  initialVisible = 8,
  title = "Hồ sơ mùi hương",
  emptyMessage = "Chưa có nhóm mùi hương.",
}: ScentFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const selectedSet = new Set(selected.map(norm));

  const base = showAll ? scents : scents.slice(0, initialVisible);
  const extraSelected = showAll
    ? []
    : scents.filter((s) => selectedSet.has(norm(s)) && !base.includes(s));
  const visible = [...base, ...extraSelected];

  const canToggle = scents.length > initialVisible;

  return (
    <FilterSection title={title}>
      <div className="space-y-3">
        {visible.map((item) => (
          <label
            key={item}
            className="flex items-center gap-3 cursor-pointer text-sm text-[#1C1C19]"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(norm(item))}
              onChange={() => onToggle(item)}
              className="accent-[#735C00] w-4 h-4"
            />

            {item}
          </label>
        ))}

        {visible.length === 0 && <p className="text-xs text-[#A29D91]">{emptyMessage}</p>}
      </div>

      {canToggle && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#735C00] transition hover:text-[#4D410F]"
        >
          {showAll ? "Thu gọn" : `Xem tất cả (${scents.length})`}
        </button>
      )}
    </FilterSection>
  );
}
