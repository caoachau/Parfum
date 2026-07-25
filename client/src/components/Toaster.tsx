import { Check, Info, X } from "lucide-react";
import { useToast, ToastType } from "../store/toast.store";

const STYLE: Record<ToastType, { accent: string; icon: string; label: string }> = {
  success: {
    accent: "bg-[#6F7651]",
    icon: "bg-[#EEF0E7] text-[#59613D]",
    label: "Thành công",
  },
  error: {
    accent: "bg-[#A45149]",
    icon: "bg-[#F7EAE8] text-[#93433C]",
    label: "Có lỗi xảy ra",
  },
  info: {
    accent: "bg-[#A5842E]",
    icon: "bg-[#F4EEDC] text-[#806616]",
    label: "Thông báo",
  },
};

function ToastIcon({ type }: { type: ToastType }) {
  const style = STYLE[type];
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.icon}`}
    >
      {type === "success" ? (
        <Check size={18} />
      ) : type === "error" ? (
        <X size={18} />
      ) : (
        <Info size={18} />
      )}
    </span>
  );
}

export default function Toaster() {
  const { toasts, remove } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-[9999] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 sm:right-6"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className="toast-item pointer-events-auto relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-md border border-[#DED7CD] bg-[#FFFDF9] px-4 py-3 pr-11 shadow-[0_12px_32px_rgba(42,36,29,0.16)]"
        >
          <ToastIcon type={t.type} />
          <div className="min-w-0 flex-1 font-sans">
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#8A8178]">
              {STYLE[t.type].label}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-5 text-[#2D2925]">{t.message}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(t.id)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-[#9A9188] transition-colors hover:text-[#2D2925]"
            aria-label="Đóng"
          >
            <X size={15} />
          </button>
          <span
            className={`toast-progress absolute inset-x-0 bottom-0 h-[3px] origin-left ${STYLE[t.type].accent}`}
          />
        </div>
      ))}
    </div>
  );
}
