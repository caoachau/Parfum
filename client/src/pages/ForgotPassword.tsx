import { useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getPasswordError } from "../lib/password";
import { PasswordRequirements } from "../components/PasswordRequirements";

type Step = "email" | "otp" | "password" | "done";

function getApiError(error: any, fallback: string) {
  const data = error?.response?.data;
  const fieldErrors = data?.errors?.fieldErrors;
  const firstFieldError = fieldErrors && Object.values(fieldErrors).flat().find(Boolean);
  return data?.message || firstFieldError || fallback;
}

export default function ForgotPassword() {
  const language = "vi" as const;
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const text = {
    eyebrow: "Bảo mật tài khoản",
    title: "Khôi phục mật khẩu",
    emailDescription: "Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác minh gồm 6 chữ số.",
    otpDescription: `Nhập mã xác minh đã gửi đến ${email}. Mã có hiệu lực trong 5 phút.`,
    passwordDescription: "Tạo mật khẩu mới cho tài khoản của bạn.",
    email: "Email",
    otp: "Mã xác minh",
    password: "Mật khẩu mới",
    confirm: "Nhập lại mật khẩu",
    send: "Gửi mã xác minh",
    verify: "Xác minh mã",
    update: "Cập nhật mật khẩu",
    resend: "Gửi lại mã",
    sent: "Mã mới đã được gửi.",
    back: "Quay lại đăng nhập",
    doneTitle: "Mật khẩu đã được cập nhật",
    doneDescription: "Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.",
    signIn: "Đăng nhập",
    support: "Liên hệ hỗ trợ",
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function requestOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không hợp lệ.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setStep("otp");
      setResendIn(60);
    } catch (requestError) {
      setError(getApiError(requestError, "Không thể gửi mã lúc này."));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setError("Mã xác minh phải gồm 6 chữ số.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-password-reset-email-otp", {
        email: email.trim().toLowerCase(),
        otp,
      });
      setResetToken(data.resetToken);
      setStep("password");
    } catch (verifyError) {
      setError(getApiError(verifyError, "Mã không đúng hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword() {
    const passwordError = getPasswordError(password, language);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Hai mật khẩu không trùng khớp.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: resetToken, password });
      setStep("done");
    } catch (updateError) {
      setError(getApiError(updateError, "Không thể cập nhật mật khẩu."));
    } finally {
      setLoading(false);
    }
  }

  const description =
    step === "email"
      ? text.emailDescription
      : step === "otp"
        ? text.otpDescription
        : text.passwordDescription;

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#F8F3ED] px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-[520px] border border-[#DED3C6] bg-[#FCF9F5] px-6 py-10 shadow-[0_24px_70px_rgba(67,54,38,0.08)] sm:px-12 sm:py-14">
        {step === "done" ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#A58A4D] text-[#806B3D]">
              <Check size={24} />
            </span>
            <h1 className="mt-7 font-title text-4xl font-medium text-[#27231F]">
              {text.doneTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#716A62]">
              {text.doneDescription}
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-9 w-full bg-[#806B3D] px-5 py-4 text-[11px] uppercase tracking-[2px] text-white transition-colors hover:bg-[#66552F]"
            >
              {text.signIn}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[3px] text-[#907B4A]">
                {text.eyebrow}
              </span>
              <Link
                to="/contact"
                className="flex h-10 w-10 items-center justify-center border border-[#DED3C6] text-[#907B4A] transition-colors hover:border-[#907B4A] hover:bg-[#F2EAE0]"
                title={text.support}
                aria-label={text.support}
              >
                <Headphones size={17} />
              </Link>
            </div>
            <h1 className="mt-7 font-title text-4xl font-medium text-[#27231F] sm:text-5xl">
              {text.title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#716A62]">{description}</p>

            <div className="mt-9 flex gap-2" aria-label="Tiến trình">
              {["email", "otp", "password"].map((item, index) => {
                const currentIndex = ["email", "otp", "password"].indexOf(step);
                return (
                  <span
                    key={item}
                    className={`h-1 flex-1 ${index <= currentIndex ? "bg-[#907B4A]" : "bg-[#E5DCD2]"}`}
                  />
                );
              })}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-6 border-l-2 border-[#A84A42] bg-[#F8EBE8] px-4 py-3 text-sm text-[#8A3832]"
              >
                {error}
              </p>
            )}

            {step === "email" && (
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestOtp();
                }}
              >
                <label
                  className="block text-[10px] uppercase tracking-[2px] text-[#716A62]"
                  htmlFor="reset-email"
                >
                  {text.email}
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="mt-2 w-full border-0 border-b border-[#CFC2B2] bg-transparent px-0 py-3 text-base text-[#27231F] outline-none focus:border-[#907B4A]"
                />
                <button
                  disabled={loading}
                  className="mt-9 w-full bg-[#806B3D] px-5 py-4 text-[11px] uppercase tracking-[2px] text-white transition-colors hover:bg-[#66552F] disabled:cursor-wait disabled:opacity-50"
                >
                  {loading ? "..." : text.send}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  void verifyOtp();
                }}
              >
                <label
                  className="block text-[10px] uppercase tracking-[2px] text-[#716A62]"
                  htmlFor="reset-otp"
                >
                  {text.otp}
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="mt-3 w-full border border-[#CFC2B2] bg-white px-4 py-4 text-center text-2xl tracking-[10px] text-[#27231F] outline-none focus:border-[#907B4A]"
                />
                <button
                  disabled={loading}
                  className="mt-7 w-full bg-[#806B3D] px-5 py-4 text-[11px] uppercase tracking-[2px] text-white transition-colors hover:bg-[#66552F] disabled:cursor-wait disabled:opacity-50"
                >
                  {loading ? "..." : text.verify}
                </button>
                <button
                  type="button"
                  disabled={loading || resendIn > 0}
                  onClick={() => void requestOtp()}
                  className="mt-4 w-full py-2 text-[11px] uppercase tracking-[1.5px] text-[#806B3D] disabled:text-[#A9A19A]"
                >
                  {resendIn > 0 ? `${text.resend} (${resendIn}s)` : text.resend}
                </button>
              </form>
            )}

            {step === "password" && (
              <form
                className="mt-8 space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void updatePassword();
                }}
              >
                <label
                  className="block text-[10px] uppercase tracking-[2px] text-[#716A62]"
                  htmlFor="new-password"
                >
                  {text.password}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    className="w-full border-0 border-b border-[#CFC2B2] bg-transparent py-3 pr-12 text-base text-[#27231F] outline-none focus:border-[#907B4A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#806B3D]"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <PasswordRequirements password={password} language={language} />
                <label
                  className="block text-[10px] uppercase tracking-[2px] text-[#716A62]"
                  htmlFor="confirm-password"
                >
                  {text.confirm}
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full border-0 border-b border-[#CFC2B2] bg-transparent py-3 text-base text-[#27231F] outline-none focus:border-[#907B4A]"
                />
                <button
                  disabled={loading}
                  className="w-full bg-[#806B3D] px-5 py-4 text-[11px] uppercase tracking-[2px] text-white transition-colors hover:bg-[#66552F] disabled:cursor-wait disabled:opacity-50"
                >
                  {loading ? "..." : text.update}
                </button>
              </form>
            )}

            <Link
              to="/login"
              className="mt-8 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[1.5px] text-[#716A62] hover:text-[#806B3D]"
            >
              <ArrowLeft size={14} />
              {text.back}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
