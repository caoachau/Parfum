import { useEffect, useRef, useState } from "react";
import { Clock3, LogOut } from "lucide-react";
import { api } from "../lib/api";
import {
  beginCustomerSessionWarning,
  clearCustomerSession,
  CUSTOMER_SESSION_STORAGE_KEY,
  readCustomerSession,
  renewCustomerSession,
  type CustomerSessionTimeout,
} from "../lib/customerSession";
import { useAuth } from "../store/auth.store";

export default function CustomerSessionGuard() {
  const user = useAuth((state) => state.user);
  const [session, setSession] = useState<CustomerSessionTimeout | null>(null);
  const [now, setNow] = useState(Date.now());
  const [extending, setExtending] = useState(false);
  const loggingOut = useRef(false);
  const lastActivityWrite = useRef(0);
  const isCustomer = user?.role === "customer";

  function logoutForTimeout() {
    if (loggingOut.current) return;
    loggingOut.current = true;
    clearCustomerSession();
    useAuth.getState().logout();
    window.location.replace("/login?reason=session-expired");
  }

  useEffect(() => {
    if (!isCustomer) {
      clearCustomerSession();
      setSession(null);
      loggingOut.current = false;
      return;
    }

    const existing = readCustomerSession() || renewCustomerSession();
    setSession(existing);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CUSTOMER_SESSION_STORAGE_KEY) return;
      if (event.newValue === null) {
        logoutForTimeout();
        return;
      }
      const next = readCustomerSession();
      if (next) setSession(next);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
    // logoutForTimeout deliberately reads the latest Zustand state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  useEffect(() => {
    if (!isCustomer || session?.warningExpiresAt) return;

    const recordActivity = () => {
      const currentTime = Date.now();
      // Tránh ghi localStorage liên tục khi người dùng cuộn hoặc gõ nhanh.
      if (currentTime - lastActivityWrite.current < 5_000) return;

      const latest = readCustomerSession();
      // Khi đã hết 15 phút, thao tác thông thường không được tự gia hạn nữa;
      // khách phải xác nhận rõ ràng trong popup cảnh báo.
      if (!latest || latest.warningExpiresAt || latest.expiresAt <= currentTime) return;

      lastActivityWrite.current = currentTime;
      setSession(renewCustomerSession(currentTime));
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    );
    return () =>
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
  }, [isCustomer, session?.warningExpiresAt]);

  useEffect(() => {
    if (!isCustomer || !session) return;

    const tick = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      const latest = readCustomerSession() || session;
      if (latest.expiresAt > currentTime) {
        if (
          latest.expiresAt !== session.expiresAt ||
          latest.warningExpiresAt !== session.warningExpiresAt
        ) {
          setSession(latest);
        }
        return;
      }

      if (!latest.warningExpiresAt) {
        setSession(beginCustomerSessionWarning(latest, currentTime));
        return;
      }

      if (latest.warningExpiresAt <= currentTime) logoutForTimeout();
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
    // Session changes intentionally restart the interval with fresh deadlines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer, session?.expiresAt, session?.warningExpiresAt]);

  async function keepSignedIn() {
    try {
      setExtending(true);
      const { data } = await api.post("/auth/refresh", {});
      useAuth.getState().setTokens(data.accessToken);
      setSession(renewCustomerSession());
      setNow(Date.now());
    } catch {
      logoutForTimeout();
    } finally {
      setExtending(false);
    }
  }

  if (!isCustomer || !session?.warningExpiresAt || session.expiresAt > now) return null;

  const remainingSeconds = Math.max(0, Math.ceil((session.warningExpiresAt - now) / 1000));

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md border border-[#D8CCBC] bg-[#FCF9F4] p-7 text-center shadow-2xl sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#927600] text-[#806900]">
          <Clock3 size={25} />
        </span>
        <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-[#927600]">
          Phiên đăng nhập
        </p>
        <h2 id="session-warning-title" className="mt-2 font-serif text-3xl text-[#27231F]">
          Bạn có muốn duy trì đăng nhập?
        </h2>
        <p className="mt-4 text-sm leading-6 text-[#746C63]">
          Phiên làm việc đã đủ 15 phút. Hệ thống sẽ tự đăng xuất sau
          <strong className="mx-1 text-[#8B1E1E]">{remainingSeconds} giây</strong>
          nếu bạn không tiếp tục.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={extending}
            onClick={keepSignedIn}
            className="bg-[#806900] px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#665400] disabled:cursor-wait disabled:opacity-60"
          >
            {extending ? "Đang gia hạn..." : "Duy trì đăng nhập"}
          </button>
          <button
            type="button"
            disabled={extending}
            onClick={logoutForTimeout}
            className="flex items-center justify-center gap-2 border border-[#8B1E1E] px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-[#8B1E1E] transition hover:bg-[#FBF0EE]"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
