import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    title: "Thông tin chúng tôi thu thập",
    body: "Khi bạn mua hàng, tạo tài khoản, lưu địa chỉ, gửi yêu cầu hỗ trợ hoặc đăng ký newsletter, L'Essence Noire có thể ghi nhận họ tên, email, số điện thoại, địa chỉ giao hàng, lịch sử đơn hàng và nội dung trao đổi cần thiết để phục vụ bạn.",
  },
  {
    title: "Cách chúng tôi sử dụng dữ liệu",
    body: "Dữ liệu được dùng để xử lý đơn hàng, giao hàng, xác minh thanh toán, chăm sóc khách hàng, đồng bộ đơn mua khi bạn đăng ký tài khoản và gửi tin tức hoặc ưu đãi nếu bạn đồng ý nhận.",
  },
  {
    title: "Thanh toán và bảo mật",
    body: "Thông tin thanh toán được xử lý theo phương thức bạn chọn. Với chuyển khoản QR, hệ thống chỉ lưu trạng thái giao dịch và dữ liệu đối soát cần thiết, không lưu thông tin đăng nhập ngân hàng của khách hàng.",
  },
  {
    title: "Chia sẻ thông tin",
    body: "Chúng tôi chỉ chia sẻ thông tin cần thiết với các bên hỗ trợ vận hành như đơn vị giao hàng, cổng thanh toán, dịch vụ email hoặc SMS. L'Essence Noire không bán dữ liệu cá nhân của khách hàng.",
  },
  {
    title: "Quyền của khách hàng",
    body: "Bạn có thể yêu cầu xem, cập nhật hoặc xóa thông tin cá nhân trong phạm vi pháp luật cho phép. Bạn cũng có thể hủy đăng ký nhận newsletter bất cứ lúc nào thông qua kênh hỗ trợ.",
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <main className="bg-[#F8F5F0] px-5 py-16 text-[#1D1C19] sm:px-8 lg:px-10">
        <section className="mx-auto max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#75621E]">
            L&apos;Essence Noire
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Chính sách bảo mật</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#665F57]">
            Chính sách này mô tả cách L&apos;Essence Noire thu thập, sử dụng và bảo vệ thông tin cá
            nhân khi bạn truy cập website, mua hàng hoặc sử dụng các dịch vụ của chúng tôi.
          </p>

          <div className="mt-10 space-y-7 border-t border-[#DED6CA] pt-8">
            {SECTIONS.map((section) => (
              <article key={section.title}>
                <h2 className="font-serif text-2xl">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#665F57]">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 border-t border-[#DED6CA] pt-7">
            <p className="text-sm leading-7 text-[#665F57]">
              Nếu cần hỗ trợ về dữ liệu cá nhân hoặc quyền riêng tư, vui lòng liên hệ với chúng tôi
              qua trang hỗ trợ.
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex border border-[#75621E] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#75621E] transition hover:bg-[#75621E] hover:text-white"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
