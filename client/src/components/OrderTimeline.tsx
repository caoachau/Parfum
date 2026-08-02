import { Check, PackageCheck, RotateCcw, Truck, X } from "lucide-react";

export type OrderStatusEvent = { status: string; at?: string | Date | null };

const FLOW = [
  { status: "pending", label: "Đã ghi nhận", icon: Check },
  { status: "paid", label: "Đã xác nhận", icon: PackageCheck },
  { status: "shipping", label: "Đang giao", icon: Truck },
  { status: "done", label: "Hoàn tất", icon: Check },
];

const formatDate = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function OrderTimeline({
  status,
  history = [],
  compact = false,
}: {
  status: string;
  history?: OrderStatusEvent[];
  compact?: boolean;
}) {
  const terminal = status === "cancelled" || status === "returned";
  const currentIndex = FLOW.findIndex((step) => step.status === status);
  const historyMap = new Map(history.map((event) => [event.status, event.at]));

  if (terminal) {
    const Icon = status === "cancelled" ? X : RotateCcw;
    return (
      <div className="flex items-center gap-3 border border-[#D9C4BF] bg-[#F8EEEB] px-4 py-3 text-[#7D443C]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current">
          <Icon size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold">
            {status === "cancelled" ? "Đơn hàng đã hủy" : "Đơn hàng đã hoàn trả"}
          </p>
          {!!historyMap.get(status) && (
            <p className="mt-0.5 text-xs opacity-75">{formatDate(historyMap.get(status))}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ol
      className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-2"}`}
      aria-label="Tiến trình đơn hàng"
    >
      {FLOW.map((step, index) => {
        const reached = historyMap.has(step.status) || currentIndex >= index;
        const active = step.status === status;
        const Icon = step.icon;
        return (
          <li key={step.status} className="relative min-w-0 text-center">
            {index > 0 && (
              <span
                className={`absolute right-1/2 top-4 h-px w-full ${reached ? "bg-[#8B7200]" : "bg-[#D9D1C7]"}`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border ${
                reached
                  ? "border-[#8B7200] bg-[#8B7200] text-white"
                  : "border-[#D9D1C7] bg-[#FCF9F4] text-[#A49C92]"
              } ${active ? "ring-4 ring-[#8B7200]/10" : ""}`}
            >
              <Icon size={14} />
            </span>
            <p
              className={`mt-2 text-[10px] leading-4 ${reached ? "text-[#554812]" : "text-[#938C83]"}`}
            >
              {step.label}
            </p>
            {!compact && historyMap.get(step.status) && (
              <p className="mt-0.5 text-[9px] text-[#9A938A]">
                {formatDate(historyMap.get(step.status))}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
