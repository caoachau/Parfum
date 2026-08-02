import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../store/auth.store";

type VerificationState = "loading" | "success" | "error";

const verificationRequests = new Map<string, Promise<{ message?: string }>>();

function verifyOnce(token: string) {
  const existing = verificationRequests.get(token);
  if (existing) return existing;

  const request = api
    .post("/auth/verify-email", { token })
    .then(({ data }) => data as { message?: string });
  verificationRequests.set(token, request);
  return request;
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "Đang xác thực email của bạn..." : "Liên kết xác thực không hợp lệ.",
  );

  useEffect(() => {
    if (!token) return;
    let active = true;

    verifyOnce(token)
      .then(async (data) => {
        if (!active) return;
        setState("success");
        setMessage(data.message || "Email đã được xác thực thành công.");
        if (useAuth.getState().user) await useAuth.getState().bootstrap();
      })
      .catch((error) => {
        if (!active) return;
        setState("error");
        setMessage(
          error?.response?.data?.message ||
            "Liên kết xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#F8F3ED] px-4 py-16">
      <div className="w-full max-w-lg border border-[#DED3C6] bg-[#FCF9F5] px-7 py-12 text-center shadow-[0_24px_70px_rgba(67,54,38,0.08)] sm:px-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#CDBFAD] text-[#806B3D]">
          {state === "loading" ? (
            <LoaderCircle className="animate-spin" size={28} />
          ) : state === "success" ? (
            <CheckCircle2 size={29} />
          ) : (
            <XCircle size={29} />
          )}
        </span>

        <p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-[#806B3D]">
          Bảo mật tài khoản
        </p>
        <h1 className="mt-3 font-serif text-4xl">Xác thực email</h1>
        <p className="mt-5 text-sm leading-6 text-[#716A62]">{message}</p>

        {state !== "loading" && (
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/account/settings"
              className="bg-[#806B3D] px-6 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#66552F]"
            >
              Mở cài đặt tài khoản
            </Link>
            <Link
              to="/login"
              className="border border-[#806B3D] px-6 py-4 text-[10px] uppercase tracking-[0.16em] text-[#66552F]"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
