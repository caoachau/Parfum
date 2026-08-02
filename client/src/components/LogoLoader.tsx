const LOGO_URL =
  "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784798994/1784798990705-226061.png";

export default function LogoLoader({ label = "Đang tải" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[42vh] flex-col items-center justify-center bg-[#FCF9F4] px-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border border-[#D8CDBD] border-t-[#8B7200]" />
        <span className="absolute inset-2 rounded-full border border-[#E9E1D6]" />
        <img src={LOGO_URL} alt="" className="relative w-20 object-contain" />
      </div>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#80745F]">
        {label}
      </p>
    </div>
  );
}
