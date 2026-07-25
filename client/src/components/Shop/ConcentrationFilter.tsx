import { useMemo, useState } from "react";
import FilterSection from "./FilterSection";

interface Props {
  concentrations: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export default function ConcentrationFilter({ concentrations, selected, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false);
  const initialVisible = 5;
  const orderedCompact = useMemo(() => {
    const chosen = concentrations.filter((item) => selected.includes(item));
    const remaining = concentrations.filter((item) => !selected.includes(item));
    return [...chosen, ...remaining.slice(0, Math.max(0, initialVisible - chosen.length))];
  }, [concentrations, selected]);
  const visibleConcentrations = showAll ? concentrations : orderedCompact;

  const handleToggle = (item: string) => {
    onToggle(item);
    setShowAll(false);
  };

  return (
    <FilterSection title="Nồng độ">
      <div className="space-y-3">
        {visibleConcentrations.map((item) => (
          <label key={item} className="flex items-center gap-3 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => handleToggle(item)}
              className="accent-[#735C00]"
            />

            {item}
          </label>
        ))}
      </div>
      {concentrations.length > initialVisible && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#735C00] transition hover:text-[#4D410F]"
        >
          {showAll ? "Thu gọn" : `Xem tất cả (${concentrations.length})`}
        </button>
      )}
    </FilterSection>
  );
}
