import { AlertTriangle, Home, Search } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";

type RouteErrorPageProps = {
  notFound?: boolean;
};

type RouteErrorWithStatus = {
  status: number;
};

function hasStatus(error: unknown): error is RouteErrorWithStatus {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as RouteErrorWithStatus).status === "number"
  );
}

export default function RouteErrorPage({ notFound: forcedNotFound = false }: RouteErrorPageProps) {
  const error = useRouteError();

  const notFound = forcedNotFound || (hasStatus(error) && error.status === 404);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-5 py-16 text-center">
      <section className="w-full max-w-xl rounded-2xl border border-[#DED6CA] bg-white px-6 py-12 shadow-sm sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EEE7] text-[#735C00]">
          {notFound ? <Search size={28} /> : <AlertTriangle size={28} />}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[3px] text-[#8B7100]">
          {notFound ? "Lỗi 404" : "Đã xảy ra lỗi"}
        </p>

        <h1 className="mt-3 font-serif text-3xl font-semibold text-[#1C1C19] sm:text-4xl">
          {notFound ? "Không tìm thấy trang" : "Không thể hiển thị trang này"}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#615E57]">
          {notFound
            ? "Đường dẫn không tồn tại hoặc đã được thay đổi. Bạn có thể quay về trang chủ hoặc tiếp tục khám phá sản phẩm."
            : "Vui lòng thử tải lại trang. Nếu lỗi vẫn tiếp diễn, hãy quay về trang chủ."}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#1C1C19] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#735C00] focus:outline-none focus:ring-2 focus:ring-[#735C00]"
          >
            <Home size={17} />
            Về trang chủ
          </Link>

          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center border border-[#735C00] px-6 py-3 text-sm font-semibold text-[#735C00] transition hover:bg-[#F7F3EE] focus:outline-none focus:ring-2 focus:ring-[#735C00]"
          >
            Xem sản phẩm
          </Link>
        </div>
      </section>
    </main>
  );
}
