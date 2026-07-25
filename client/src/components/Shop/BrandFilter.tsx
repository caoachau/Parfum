import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface BrandFilterProps {
  brands: string[];
  selected: string[];
  onToggle: (brand: string) => void;
  counts?: Record<string, number>;
}

const norm = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export default function BrandFilter({
  brands = [],
  selected = [],
  onToggle,
  counts = {},
}: BrandFilterProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedSet = new Set(selected.map(norm));

  const filtered = useMemo(() => {
    const q = norm(query);
    const list = q ? brands.filter((b) => norm(b).includes(q)) : [...brands];
    return list.sort((a, b) => {
      const selectedDiff = Number(selectedSet.has(norm(b))) - Number(selectedSet.has(norm(a)));
      return selectedDiff || (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b);
    });
  }, [brands, counts, query, selectedSet]);

  function handleToggle(brand: string) {
    onToggle(brand);
    window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between"
      >
        <span className="uppercase tracking-[2px] text-[11px] font-semibold text-[#735C00]">
          THƯƠNG HIỆU
        </span>
        <ChevronDown
          size={16}
          className={`text-[#8A8176] duration-300 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="mt-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm thương hiệu"
            className="w-full rounded-md border border-[#e8deca] bg-white px-3 py-2 text-sm text-[#4F4942] placeholder:text-[#B4AD9F] outline-none transition focus:border-[#735C00]"
          />

          <div className="relative mt-3">
            <div
              ref={listRef}
              className="brand-scroll max-h-[228px] overflow-y-auto pr-1 space-y-1"
            >
              {filtered.map((brand) => {
                const active = selectedSet.has(norm(brand));
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-3 cursor-pointer rounded px-1 py-[6px] hover:bg-[#F4EFE6]"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => handleToggle(brand)}
                      className="h-4 w-4 rounded-sm accent-[#735C00]"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        active ? "text-[#1C1C19] font-medium" : "text-[#4F4942]"
                      }`}
                    >
                      {brand}
                    </span>
                    {counts[brand] !== undefined && (
                      <span className="text-xs tabular-nums text-[#B4AD9F]">{counts[brand]}</span>
                    )}
                  </label>
                );
              })}

              {filtered.length === 0 && (
                <p className="px-1 py-2 text-xs text-[#A29D91]">Không tìm thấy thương hiệu.</p>
              )}
            </div>

            {/* Fade mo dan o cuoi danh sach khi cuon */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FDF9F4] to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}
