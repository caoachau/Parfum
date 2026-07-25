import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Email không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/blog/subscribe", { email: normalizedEmail });
      toast.success("Đã đăng ký nhận journal");
      setEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể đăng ký nhận journal lúc này");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-[#EEEAE2] bg-[#F8F5F0] px-5 py-20 md:px-10 lg:py-24">
      <div className="mx-auto max-w-[760px] text-center">
        <p className="text-[9px] uppercase tracking-[0.38em] text-[#77736C]">Bản tin</p>

        <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-[#1D1C19] md:text-5xl">
          Hương mới,
          <br />
          ưu đãi riêng và sự kiện
        </h2>

        <form onSubmit={handleSubmit} className="mx-auto mt-9 max-w-[580px] text-left">
          <label
            htmlFor="newsletter-email"
            className="text-[10px] uppercase tracking-[0.18em] text-[#5F5A53]"
          >
            Email
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập địa chỉ email của bạn"
              className="h-[52px] min-w-0 flex-1 border border-[#D8D2C8] bg-transparent px-4 text-sm outline-none placeholder:text-[#A19C94] focus:border-[#817000]"
            />

            <button
              type="submit"
              disabled={submitting}
              className="h-[52px] bg-[#817000] px-10 text-[10px] uppercase tracking-[0.08em] text-white transition hover:bg-[#665800]"
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </div>
        </form>

        <p className="mx-auto mt-5 max-w-[580px] text-left text-[10px] leading-5 text-[#8A857D]">
          Việc thu thập địa chỉ email giúp chúng tôi gửi tin tức, ưu đãi và quyền lợi dành cho bạn.
          Để biết thêm cách L&apos;Essence Noire xử lý dữ liệu cá nhân và quyền của bạn, vui lòng
          xem{" "}
          <Link
            to="/privacy-policy"
            className="underline underline-offset-2 transition-colors hover:text-[#665800]"
          >
            Chính sách bảo mật
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
