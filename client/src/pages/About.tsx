import { ArrowRight, BadgeCheck, HeartHandshake, Sparkles } from "lucide-react";
import { useSeo } from "../hooks/useSeo";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import AboutStoreMap from "../components/AboutStoreMap";
import { toast } from "../store/toast.store";

const policySections = [
  {
    id: "info",
    title: "Thông tin cửa hàng",
    label: "Thông tin cửa hàng",
    text: "L'Essence Noire tuyển chọn nước hoa chính hãng từ nhiều thương hiệu uy tín, ưu tiên nguồn gốc minh bạch, tư vấn phù hợp và dịch vụ sau bán hàng chỉn chu.",
  },
  {
    id: "returns",
    title: "Chính sách đổi trả",
    label: "Đổi trả",
    text: "Sản phẩm được hỗ trợ đổi trả khi còn nguyên seal, chưa qua sử dụng và có lỗi phát sinh từ vận chuyển hoặc nhà bán hàng. Khách vui lòng liên hệ trong vòng 7 ngày kể từ khi nhận hàng.",
  },
  {
    id: "shipping",
    title: "Vận chuyển",
    label: "Vận chuyển",
    text: "Đơn hàng được đóng gói chống sốc và bàn giao cho đơn vị vận chuyển trong thời gian sớm nhất. Phí vận chuyển và thời gian nhận hàng phụ thuộc khu vực giao hàng.",
  },
  {
    id: "warranty",
    title: "Bảo hành",
    label: "Bảo hành",
    text: "L'Essence Noire hỗ trợ xác minh sản phẩm, kiểm tra tình trạng vòi xịt, nắp chai và các lỗi kỹ thuật liên quan đến bao bì trong quá trình sử dụng ban đầu.",
  },
  {
    id: "contact",
    title: "Liên hệ",
    label: "Liên hệ",
    text: "Cần tư vấn mùi hương, hỗ trợ đơn hàng hoặc chính sách sau mua? Liên hệ qua hotline 0328 779 845 hoặc email tranvungochuynh136@gmail.com.",
  },
];

export default function About() {
  useSeo({
    title: "Về chúng tôi",
    description: "Câu chuyện thương hiệu, triết lý và cam kết chính hãng của L'Essence Noire.",
  });
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Email không hợp lệ");
      return;
    }

    try {
      setSubscribing(true);
      await api.post("/blog/subscribe", { email: normalizedEmail });
      toast.success("Đã đăng ký nhận bản tin");
      setEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể đăng ký nhận bản tin lúc này");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <main className="overflow-hidden bg-[#FCF9F4] text-[#201F1B]">
        {/* Giới thiệu đầu trang */}
        <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
            <div className="relative z-10">
              <h1
                className="max-w-[500px] text-[50px] leading-[0.94] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Hành trình
                <br />
                của mùi hương
              </h1>

              <p className="mt-7 max-w-[455px] text-sm leading-6 text-[#69665F]">
                L&apos;Essence Noire là không gian tuyển chọn nước hoa chính hãng từ nhiều nhà hương
                trên thế giới. Chúng tôi giúp bạn khám phá những sáng tạo phù hợp với cá tính, phong
                cách sống và dấu ấn riêng của mình.
              </p>
            </div>

            <div className="h-[420px] overflow-hidden bg-[#363636] sm:h-[520px] lg:h-[600px]">
              <img
                loading="lazy"
                src="https://res.cloudinary.com/dwj2trmn0/image/upload/v1784434420/perfume-bottle-green-plant-and-open-book-royalty-free-image-1760057187_x0ps86.avif"
                alt="Chai nước hoa cao cấp"
                className="h-full w-full object-cover grayscale"
              />
            </div>
          </div>
        </section>

        {/* Triết lý tuyển chọn */}
        <section className="bg-[#F2EFEA] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-[1260px] items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="max-w-[440px]">
              <h2
                className="text-4xl tracking-[-0.025em] lg:text-[48px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Triết lý tuyển chọn
              </h2>

              <div className="mt-7 space-y-5 text-sm leading-6 text-[#67645D]">
                <p>
                  Chúng tôi tin rằng một chai nước hoa không chỉ được lựa chọn bởi tên tuổi của
                  thương hiệu, mà còn bởi cảm xúc, cá tính và trải nghiệm mà nó mang lại cho người
                  dùng.
                </p>

                <p>
                  Vì vậy, mỗi sản phẩm tại L&apos;Essence Noire đều được cân nhắc dựa trên chất
                  lượng, uy tín của nhà hương, tính độc đáo trong cấu trúc mùi và khả năng đồng hành
                  lâu dài cùng người sử dụng.
                </p>
              </div>

              <Link
                to="/blog"
                className="mt-8 inline-flex border border-[#CFC6AC] px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#856F20] transition hover:bg-[#856F20] hover:text-white"
              >
                Khám phá Journal
              </Link>
            </div>

            <div className="relative mx-auto min-h-[470px] w-full max-w-[650px]">
              <div className="absolute right-0 top-0 h-[420px] w-[72%] overflow-hidden shadow-[0_22px_45px_rgba(0,0,0,0.13)]">
                <img
                  loading="lazy"
                  src="https://res.cloudinary.com/dwj2trmn0/image/upload/v1784433419/Screenshot_2026-07-19_105646_sbbhq0.png"
                  alt="Không gian tuyển chọn nước hoa"
                  className="h-full w-full object-cover grayscale"
                />
              </div>

              <div className="absolute bottom-0 left-0 z-10 w-[48%] border-[10px] border-[#F7F4EF] bg-[#F7F4EF] shadow-sm">
                <img
                  loading="lazy"
                  src="https://res.cloudinary.com/dwj2trmn0/image/upload/t_j/images_3_ypjabi.jpg"
                  alt="Chi tiết nghệ thuật và mùi hương"
                  className="aspect-[4/5] w-full object-cover grayscale"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tư vấn mùi hương */}
        <section className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-[1260px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative">
              <img
                loading="lazy"
                src="https://res.cloudinary.com/dwj2trmn0/image/upload/v1784433506/Senza_titolo-14_1024x1024_gkqyw6.webp"
                alt="Tư vấn lựa chọn nước hoa"
                className="aspect-[1.05/1] w-full object-cover grayscale"
              />
            </div>

            <div>
              <h2
                className="text-[48px] leading-[1.05] tracking-[-0.03em] lg:text-[58px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Đồng hành
                <br />
                cùng lựa chọn của bạn
              </h2>

              <blockquote className="mt-7 max-w-[570px] text-lg leading-7 text-[#55524D]">
                “Một mùi hương phù hợp không nhất thiết là mùi hương đắt nhất, mà là mùi hương khiến
                bạn cảm thấy gần với chính mình nhất.”
              </blockquote>

              <div className="mt-7 max-w-[570px] space-y-5 text-sm leading-6 text-[#706D66]">
                <p>
                  Đội ngũ L&apos;Essence Noire đồng hành cùng khách hàng trong quá trình lựa chọn,
                  từ việc tìm hiểu nhóm hương, độ lưu hương đến hoàn cảnh sử dụng và phong cách cá
                  nhân.
                </p>

                <p>
                  Chúng tôi không tạo ra nước hoa, nhưng mong muốn giúp mỗi khách hàng tìm được mùi
                  hương thực sự phù hợp — dễ sử dụng, có cá tính và đủ sức trở thành một dấu ấn
                  riêng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Triết lý tuyển chọn */}
        <section className="bg-[#F5F2ED] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid gap-14 border-b border-[#D9D2C8] pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <h2
                  className="mt-5 max-w-[640px] text-[42px] leading-[1.15] tracking-[-0.03em] sm:text-[50px] lg:text-[58px]"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Tuyển chọn bằng cảm nhận, gìn giữ bằng sự chân thành
                </h2>
              </div>

              <p className="max-w-[680px] text-sm leading-7 text-[#69665F] lg:justify-self-end">
                Với L&apos;Essence Noire, một mùi hương xứng đáng không chỉ bởi tên tuổi hay thiết
                kế. Chúng tôi quan tâm đến chất lượng, trải nghiệm thực tế và khả năng thể hiện cá
                tính — những yếu tố giúp mỗi lựa chọn trở nên phù hợp và đáng nhớ hơn.
              </p>
            </div>

            <div className="grid gap-px border-x border-t border-[#D9D2C8] bg-[#D9D2C8] md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Chính hãng minh bạch",
                  text: "Mỗi sản phẩm được tuyển chọn từ thương hiệu và nguồn phân phối đáng tin cậy, với thông tin rõ ràng về xuất xứ và tình trạng sản phẩm.",
                },
                {
                  number: "02",
                  title: "Tuyển chọn có chủ đích",
                  text: "Danh mục được xây dựng để cân bằng giữa những lựa chọn dễ tiếp cận, những sáng tạo có cá tính và các nhà hương uy tín.",
                },
                {
                  number: "03",
                  title: "Dịch vụ đồng hành",
                  text: "Từ tư vấn trước khi mua đến hỗ trợ sau bán hàng, mọi chi tiết đều hướng đến trải nghiệm rõ ràng, gần gũi và đáng tin cậy.",
                },
              ].map((value) => (
                <article
                  key={value.number}
                  className="bg-[#F5F2ED] px-7 py-10 sm:px-9 lg:min-h-[260px]"
                >
                  <p className="text-[9px] font-semibold tracking-[0.24em] text-[#A18A3A]">
                    {value.number}
                  </p>

                  <h3
                    className="mt-8 text-[28px] leading-tight tracking-[-0.02em]"
                    style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                  >
                    {value.title}
                  </h3>

                  <p className="mt-5 text-xs leading-6 text-[#6B6861]">{value.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cam kết của chúng tôi */}
        <section className="px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="mb-12 max-w-[680px]">
              <h2
                className="text-4xl tracking-[-0.025em] lg:text-[52px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Cam kết của chúng tôi
              </h2>

              <p className="mt-5 max-w-[620px] text-sm leading-7 text-[#66635C]">
                Giá trị của L&apos;Essence Noire không nằm ở việc tạo ra nước hoa, mà ở sự minh bạch
                trong tuyển chọn, tư vấn và trải nghiệm dành cho khách hàng.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <article className="border border-[#D8D0C2] bg-[#F3EFE9] p-8">
                <BadgeCheck size={22} strokeWidth={1.4} className="text-[#8A731A]" />
                <h3
                  className="mt-7 text-[28px] leading-tight"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Chính hãng
                </h3>
                <p className="mt-4 text-xs leading-6 text-[#6A675F]">
                  Sản phẩm được tuyển chọn từ các thương hiệu uy tín và nguồn phân phối đáng tin
                  cậy, đảm bảo thông tin rõ ràng về xuất xứ và tình trạng sản phẩm.
                </p>
              </article>

              <article className="border border-[#D8D0C2] bg-[#F3EFE9] p-8">
                <HeartHandshake size={22} strokeWidth={1.4} className="text-[#8A731A]" />
                <h3
                  className="mt-7 text-[28px] leading-tight"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Tư vấn tận tâm
                </h3>
                <p className="mt-4 text-xs leading-6 text-[#6A675F]">
                  Chúng tôi giúp khách hàng lựa chọn dựa trên phong cách, sở thích và nhu cầu sử
                  dụng, thay vì chỉ chạy theo xu hướng hoặc tên tuổi thương hiệu.
                </p>
              </article>

              <article className="border border-[#D8D0C2] bg-[#F3EFE9] p-8">
                <Sparkles size={22} strokeWidth={1.4} className="text-[#8A731A]" />
                <h3
                  className="mt-7 whitespace-nowrap text-[24px] leading-tight lg:text-[26px]"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Trải nghiệm chỉnh chu
                </h3>
                <p className="mt-4 text-xs leading-6 text-[#6A675F]">
                  Từ đóng gói, giao hàng đến hỗ trợ sau mua, mọi chi tiết đều được chăm chút nhằm
                  mang lại trải nghiệm mua sắm tinh tế và đáng tin cậy.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Bản đồ cửa hàng */}
        <AboutStoreMap />

        {/* Chính sách */}
        <section className="bg-[#F2EFEA] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-12 max-w-[620px]">
              <h2
                className="text-4xl tracking-[-0.025em] lg:text-[52px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Thông tin & Chính sách
              </h2>

              <p className="mt-5 text-sm leading-6 text-[#69665F]">
                Những thông tin cần thiết trước và sau khi mua hàng, được trình bày ngắn gọn để
                khách hàng dễ tra cứu.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {policySections.map((item) => (
                <article
                  key={item.id}
                  id={item.id}
                  className="scroll-mt-28 border border-[#DED5C7] bg-[#FCF9F4] p-7"
                >
                  <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#927A20]">
                    {item.label}
                  </p>

                  <h3
                    className="mt-4 text-[26px] leading-tight"
                    style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                  >
                    {item.title}
                  </h3>

                  <p className="mt-4 text-xs leading-6 text-[#6B6861]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bản tin */}
        <section className="px-6 pb-28 pt-10 text-center sm:px-10 lg:pb-36">
          <h2
            className="text-4xl tracking-[-0.025em]"
            style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
          >
            Tham gia nhận bản tin của chúng tôi
          </h2>

          <p className="mt-4 text-sm text-[#77736C]">
            Nhận những bài viết tuyển chọn về mùi hương, thương hiệu và cách lựa chọn nước hoa phù
            hợp.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="mx-auto mt-9 flex max-w-[390px] items-center border-b border-[#D4CBB5]"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ĐỊA CHỈ EMAIL CỦA BẠN"
              className="min-w-0 flex-1 bg-transparent py-4 text-[9px] uppercase tracking-[0.16em] outline-none placeholder:text-[#AAA69D]"
            />

            <button
              type="submit"
              disabled={subscribing}
              aria-label="Đăng ký"
              className="px-2 text-[#927A20] transition hover:translate-x-1 disabled:cursor-wait disabled:opacity-50"
            >
              <ArrowRight size={18} strokeWidth={1.3} />
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
