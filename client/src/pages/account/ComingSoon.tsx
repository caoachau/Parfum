import { ArrowLeft, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface ComingSoonProps {
  title: string;
  description: string;
  type?: "orders" | "wishlist";
}

export default function ComingSoon({ title, description, type = "orders" }: ComingSoonProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#FCF9F4] px-6 py-12 text-[#2D2925]">
      <div className="w-full max-w-2xl border border-[#E2DBD2] bg-[#FFFDF9] px-8 py-14 text-center shadow-[0_15px_50px_rgba(60,50,40,0.04)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EBDD] text-[#836D00]">
          {type === "wishlist" ? (
            <Sparkles size={27} strokeWidth={1.3} />
          ) : (
            <Clock3 size={27} strokeWidth={1.3} />
          )}
        </div>

        <p className="mt-7 text-[9px] uppercase tracking-[0.35em] text-[#978E84]">
          Cổng thông tin cá nhân
        </p>

        <h1 className="mt-3 font-serif text-4xl lg:text-5xl">{title}</h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#786F67]">{description}</p>

        <div className="mx-auto mt-8 h-px w-20 bg-[#B7A45A]" />

        <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-[#8C8278]">
          Tính năng đang được hoàn thiện
        </p>

        <Link
          to="/account"
          className="mx-auto mt-8 flex w-fit items-center gap-3 bg-[#816A00] px-6 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#675500]"
        >
          <ArrowLeft size={14} />
          Quay lại tổng quan
        </Link>
      </div>
    </div>
  );
}
