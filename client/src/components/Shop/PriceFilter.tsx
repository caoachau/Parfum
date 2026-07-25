import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

interface PriceFilterProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  buckets?: number[];
  onChange: (min: number, max: number) => void;
}

const formatPrice = (value: number) => {
  if (!Number.isFinite(value)) return "";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
};

export default function PriceFilter({
  min,
  max,
  valueMin,
  valueMax,
  buckets = [],
  onChange,
}: PriceFilterProps) {
  const [open, setOpen] = useState(true);

  const safeMax = max > min ? max : min + 1;
  const lo = Math.min(Math.max(valueMin, min), safeMax);
  const hi = Math.min(valueMax === Number.MAX_SAFE_INTEGER ? safeMax : valueMax, safeMax);

  const pct = (value: number) => ((value - min) / (safeMax - min)) * 100;

  const maxBucket = useMemo(() => (buckets.length ? Math.max(...buckets, 1) : 1), [buckets]);

  const handleMin = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.min(Number(event.target.value), hi);
    onChange(next, hi >= safeMax ? Number.MAX_SAFE_INTEGER : hi);
  };
  const handleMax = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(Number(event.target.value), lo);
    onChange(lo, next >= safeMax ? Number.MAX_SAFE_INTEGER : next);
  };

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between"
      >
        <span className="uppercase tracking-[2px] text-[11px] font-semibold text-[#B5A47A]">
          KHOẢNG GIÁ
        </span>
        <ChevronDown
          size={16}
          className={`text-[#B5B0A8] duration-300 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="mt-5">
          {buckets.length > 0 && (
            <div className="flex items-end gap-[2px] h-14 mb-1">
              {buckets.map((count, index) => {
                const center = min + ((index + 0.5) / buckets.length) * (safeMax - min);
                const inRange = center >= lo && center <= hi;
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-sm transition-colors ${
                      inRange ? "bg-[#8A8176]" : "bg-[#E8E2D8]"
                    }`}
                    style={{ height: `${Math.max(6, (count / maxBucket) * 100)}%` }}
                  />
                );
              })}
            </div>
          )}

          <div className="relative h-6 mt-2">
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#EDE8DF]" />
            <div
              className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#8A8176]"
              style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
            />
            <input
              type="range"
              min={min}
              max={safeMax}
              value={lo}
              onChange={handleMin}
              className="price-range absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
            />
            <input
              type="range"
              min={min}
              max={safeMax}
              value={hi}
              onChange={handleMax}
              className="price-range absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-[#B5B0A8]">
            <span>{formatPrice(lo)}đ</span>
            <span>
              {formatPrice(hi)}
              {hi >= safeMax ? "+" : ""}đ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
