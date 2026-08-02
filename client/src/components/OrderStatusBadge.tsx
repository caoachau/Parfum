import { STATUS_MAP } from "../lib/orderPresentation";

export function StatusBadge({ status }: { status: string }) {
  const value = STATUS_MAP[status] || {
    label: status,
    cls: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={
        "inline-block border rounded-full px-3 py-1 text-[11px] font-sans font-semibold uppercase tracking-[0.5px] " +
        value.cls
      }
    >
      {value.label}
    </span>
  );
}
