interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm sản phẩm..."
        className="w-full h-11 border border-[#D0C5AF] px-4 pr-10 outline-none"
      />
    </div>
  );
}
