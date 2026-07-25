import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface NoteFilterProps {
  notes: string[];
  selected: string[];
  onToggle: (note: string) => void;
  counts?: Record<string, number>;
}

const norm = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export default function NoteFilter({
  notes = [],
  selected = [],
  onToggle,
  counts = {},
}: NoteFilterProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedSet = useMemo(() => new Set(selected.map(norm)), [selected]);

  const filtered = useMemo(() => {
    const q = norm(query);
    const list = q ? notes.filter((note) => norm(note).includes(q)) : [...notes];
    return list.sort((left, right) => {
      const selectedDiff =
        Number(selectedSet.has(norm(right))) - Number(selectedSet.has(norm(left)));
      return (
        selectedDiff ||
        (counts[right] ?? 0) - (counts[left] ?? 0) ||
        left.localeCompare(right, "vi")
      );
    });
  }, [counts, notes, query, selectedSet]);

  const handleToggle = (note: string) => {
    onToggle(note);
    window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[2px] text-[#735C00]">
          Note hương
        </span>
        <ChevronDown
          size={16}
          className={`text-[#8A8176] duration-300 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm note hương"
            className="w-full rounded-md border border-[#e8deca] bg-white px-3 py-2 text-sm text-[#4F4942] placeholder:text-[#B4AD9F] outline-none transition focus:border-[#735C00]"
          />

          <div className="relative mt-3">
            <div
              ref={listRef}
              className="brand-scroll max-h-[228px] space-y-1 overflow-y-auto pr-1"
            >
              {filtered.map((note) => {
                const active = selectedSet.has(norm(note));
                return (
                  <label
                    key={note}
                    className="flex cursor-pointer items-center gap-3 rounded px-1 py-[6px] hover:bg-[#F4EFE6]"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => handleToggle(note)}
                      className="h-4 w-4 rounded-sm accent-[#735C00]"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        active
                          ? "font-medium text-[#1C1C19]"
                          : "text-[#4F4942]"
                      }`}
                    >
                      {note}
                    </span>
                    {counts[note] !== undefined && (
                      <span className="text-xs tabular-nums text-[#B4AD9F]">
                        {counts[note]}
                      </span>
                    )}
                  </label>
                );
              })}

              {filtered.length === 0 && (
                <p className="px-1 py-2 text-xs text-[#A29D91]">
                  Không tìm thấy note hương.
                </p>
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FDF9F4] to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}
