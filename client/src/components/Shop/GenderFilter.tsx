interface GenderFilterProps {
  genders: string[];
  selected: string[];
  onToggle: (gender: string) => void;
  onClear?: () => void;
}

const genderLabels: Record<string, string> = {
  female: "Nữ",
  male: "Nam",
  unisex: "Unisex",
  Women: "Nữ",
  Men: "Nam",
  Nữ: "Nữ",
  Nam: "Nam",
};

export default function GenderFilter({
  genders = ["Women", "Men", "Unisex"],
  selected = [],
  onToggle,
}: GenderFilterProps) {
  return (
    <div className="mt-8">
      <h3 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[2px] text-[#735C00]">
        GIỚI TÍNH
      </h3>

      <div className="space-y-3">
        {genders.map((gender) => (
          <label key={gender} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="shop-gender"
              checked={selected.includes(gender)}
              onClick={() => onToggle(gender)}
              onChange={() => undefined}
              className="accent-[#735C00]"
            />

            <span className="text-sm">{genderLabels[gender] ?? gender}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
