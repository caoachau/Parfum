import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Collection = {
  id: string;
  tab: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  columns: { label: string; value: string }[];
};

const COLLECTIONS: Collection[] = [
  {
    id: "collection-01",
    tab: "Khởi Nguyên",
    title: "Miền Đất Hứa",
    subtitle: "Nơi câu chuyện của hương bắt đầu",
    description:
      " Trước khi là một chai nước hoa, nó từng là một khoảnh khắc không tên — ánh sáng xuyên qua tán lá vào một buổi sớm không ai còn nhớ rõ ngày tháng. Người sáng lập L'Essence Noire không đi tìm một mùi hương, mà đi tìm lại cảm giác đứng lặng giữa một không gian đã biến mất. Mọi công thức đều bắt đầu từ một câu hỏi duy nhất: điều gì, nếu mất đi, sẽ khiến ta day dứt cả đời? Từ câu hỏi ấy, những nốt hương đầu tiên ra đời — không phải để làm đẹp, mà để giữ lại. Khởi Nguyên không phải một chương mở đầu, mà là lời thú nhận: mọi mùi hương chân thật đều bắt đầu từ một mất mát.",
    image:
      "https://lelabo.ips.photos/lelabo-java/images/cms/7_ONE_SIZE_IMAGE_01_7809_344429774.jpg",
    columns: [
      {
        label: "Khởi Nguồn",
        value:
          "Không một dòng lịch sử nào ghi lại ngày tháng chính xác, chỉ có một buổi sớm và một vệt sáng xuyên qua tán lá còn ở lại. Đó là điểm khởi đầu của mọi công thức sau này.",
      },
      {
        label: "Triết Lý",
        value:
          "Một chai nước hoa, với chúng tôi, chưa bao giờ là một vật trang sức. Mỗi công thức bắt đầu từ câu hỏi: điều gì, nếu mất đi, sẽ khiến ta day dứt cả đời?",
      },
      {
        label: "Bản Chất",
        value:
          "Khởi Nguyên là một lời thú nhận trần trụi, rằng chúng tôi đã mất một điều gì đó và không bao giờ tìm lại nguyên vẹn. Mọi mùi hương chân thật đều bắt nguồn từ một khoảng trống tương tự.",
      },
      {
        label: "Ký Ức Gợi Lên",
        value:
          "Một khu vườn không tên, ánh sáng loang trên nền đất ẩm, một sự tĩnh lặng chưa từng được đặt tên. Không gian ấy đã biến mất, nhưng cảm giác đứng giữa nó thì vẫn còn nguyên.",
      },
    ],
  },
  {
    id: "archive-notes",
    tab: " Hành Trình",
    title: "Lối Về Ký Ức",
    subtitle: "Từng nốt hương, một đoạn đường đã qua",
    description:
      "Có những nguyên liệu không thể mua, chỉ có thể tìm. Đoàn người của L'Essence Noire đã đi qua những cánh đồng hoa nhài còn ướt sương ở cao nguyên, những khu rừng trầm hương nơi thời gian được tính bằng thế kỷ chứ không phải bằng năm, những phiên chợ ven sông nơi mùi gỗ, mùi khói, mùi đất hòa vào nhau thành một thứ không tên. Mỗi chuyến đi là một sự mặc cả với thiên nhiên — xin một chút tinh túy, đổi lại một lời hứa gìn giữ. Hành Trình không đo bằng số cây số đã qua, mà đo bằng số lần con người phải học cách chờ đợi, học cách lắng nghe một điều gì đó lớn hơn mình.",
    image: "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784880925/1784880917241-14369.png",
    columns: [
      {
        label: "Hành Trình",
        value:
          "Từ cao nguyên còn ướt sương hoa nhài, qua những khu rừng trầm hương tính bằng thế kỷ, đến phiên chợ ven sông nơi gỗ, khói và đất hòa làm một. Mỗi chặng đường là một lớp hương được thêm vào.",
      },
      {
        label: "Nguyên Liệu",
        value:
          "Có những nguyên liệu không thể mua bằng tiền, chỉ có thể tìm bằng cách đi đến tận nơi và chờ đúng mùa. Mỗi lần thu thập là một cuộc mặc cả với thiên nhiên.",
      },
      {
        label: "Bài Học",
        value:
          "Không phải kỹ thuật, mà sự chờ đợi mới là bài học khó nhất trên hành trình này. Hành Trình được đo bằng số lần con người học cách nhường bước trước điều gì đó lớn hơn mình.",
      },
      {
        label: "Thước Đo",
        value:
          "Không đồng hồ nào đo được thời gian một cánh đồng hoa nhài cần để nở đúng độ. Thước đo duy nhất mà đoàn người tin tưởng là sự kiên nhẫn của chính họ.",
      },
    ],
  },
  {
    id: "process-film",
    tab: " Đôi Bàn Tay",
    title: "Người Giữ Lửa Nghề",
    subtitle: "Nơi thời gian được trân trọng",
    description:
      "Không có máy móc nào chưng cất được sự kiên nhẫn. Trong xưởng pha chế, đôi bàn tay của người nghệ nhân làm việc chậm rãi như đang viết một bức thư sẽ không bao giờ được gửi đi — từng giọt, từng lần lắc nhẹ, từng khoảng lặng chờ hương kết tinh. Có những công thức mất hàng năm để hoàn thiện, không phải vì thiếu kỹ thuật, mà vì thiếu đủ can đảm để gọi nó là xong. Đôi Bàn Tay là lời tri ân dành cho những người thợ vô danh — những người biến nguyên liệu thô thành ký ức có thể mang theo bên mình, một sự chuyển hóa mà không công nghệ nào thay thế được.",
    image: "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784881350/1784881344060-735445.png",
    columns: [
      {
        label: "Phương Pháp",
        value:
          "Không cỗ máy nào chưng cất được sự kiên nhẫn. Người nghệ nhân làm việc chậm rãi như đang viết một bức thư không định gửi đi.",
      },
      {
        label: "Thời Gian Ủ",
        value:
          "Có công thức mất vài tuần, có công thức cần cả năm trời để hoàn thiện. Thời gian, trong xưởng pha chế này, là nguyên liệu quý giá nhất.",
      },
      {
        label: "Điều Khó Nhất",
        value:
          "Kỹ thuật có thể học được, nhưng can đảm để gọi một công thức là hoàn chỉnh thì không. Đó là ranh giới giữa một sản phẩm và một tác phẩm.",
      },
      {
        label: "Người Tạo Tác",
        value:
          "Không ai biết tên những người thợ đã biến nguyên liệu thô thành ký ức có thể mang theo bên mình. Đôi Bàn Tay là lời tri ân dành riêng cho họ.",
      },
    ],
  },
  {
    id: "material-origin",
    tab: " Miền Nhớ",
    title: "Dấu Hương Ở Lại",
    subtitle: "Khi thiên nhiên trở thành lời hứa",
    description:
      "Một mùi hương thật sự không kết thúc trên da — nó kết thúc trong trí nhớ của người khác. Có người sẽ ngửi thấy nó nhiều năm sau, ở một nơi hoàn toàn xa lạ, và bỗng nhiên quay về một căn phòng, một mùa, một người đã không còn ở đó. Đó là tham vọng cuối cùng của L'Essence Noire: không phải để được nhớ đến, mà để trở thành nơi người ta cất giữ những gì không thể nói thành lời. Miền Nhớ không phải là chương kết — nó là nơi mọi mùi hương thật sự bắt đầu sống đời sống riêng của mình, vượt ra khỏi chai lọ, vượt ra khỏi cả người đã tạo ra nó.",
    image: "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784881351/1784881346484-523053.png",
    columns: [
      {
        label: "Nơi Kết Thúc",
        value:
          "Một mùi hương thật sự không kết thúc trên làn da, mà kết thúc trong trí nhớ của người khác. Nhiều năm sau, ai đó ngửi thấy nó và quay về một căn phòng đã không còn tồn tại.",
      },
      {
        label: "Tham Vọng",
        value:
          "Chúng tôi không muốn được ghi nhớ, mà muốn trở thành nơi con người cất giữ những điều không thể nói thành lời. Một mùi hương có thể làm được điều ngôn ngữ không làm được.",
      },
      {
        label: "Vòng Đời",
        value:
          "Mùi hương bên trong một chai nước hoa không có ngày kết thúc, nó tiếp tục sống vượt ra khỏi cả chai lọ và người tạo ra nó. Miền Nhớ là nơi mọi mùi hương bắt đầu đời sống riêng.",
      },
      {
        label: "Di Sản",
        value:
          "Di sản chúng tôi muốn để lại là hình ảnh một mùa, một người, được đánh thức bất chợt bởi một luồng hương thoảng qua. Đó là thành công lớn nhất mà một mùi hương có thể mang lại.",
      },
    ],
  },
];

const AUTOPLAY_MS = 7000;

export default function BannerSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);

  const changeCollection = useCallback((next: number) => {
    const total = COLLECTIONS.length;
    const normalizedIndex = ((next % total) + total) % total;

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (normalizedIndex === activeIndexRef.current) {
      setContentVisible(true);
      return;
    }
    setContentVisible(false);
    transitionTimerRef.current = window.setTimeout(() => {
      activeIndexRef.current = normalizedIndex;
      setActiveIndex(normalizedIndex);
      setContentVisible(true);
      transitionTimerRef.current = null;
    }, 260);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = window.setTimeout(() => {
      changeCollection(activeIndex + 1);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [activeIndex, paused, changeCollection]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  const active = COLLECTIONS[activeIndex];

  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden bg-[#111]">
      <style>{`
        @keyframes bannerDust {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: translateY(-40px) translateX(12px); opacity: 0; }
        }
      `}</style>

      {COLLECTIONS.map((item, index) => (
        <div
          key={item.id}
          aria-hidden={index !== activeIndex}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: index === activeIndex ? 1 : 0 }}
        >
          <img
            loading="lazy"
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#e9dcae]/60"
            style={{
              left: `${12 + i * 15}%`,
              bottom: `${10 + (i % 3) * 12}%`,
              animation: `bannerDust ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-[1680px] flex-col justify-center px-6 py-24 md:px-12 lg:px-20">
        <div
          className="max-w-[980px] transition-all duration-500 ease-out"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[4px] text-[#d8c990]">
            {active.subtitle}
          </p>
          <h1 className="font-title mt-5 max-w-[940px] whitespace-nowrap text-[52px] leading-[1.02] text-white md:text-[78px]">
            {active.title}
          </h1>
          <p className="mt-7 max-w-[680px] text-[16px] leading-[1.9] text-white/75 md:text-[18px]">
            {active.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-6">
            <Link
              to="/shop"
              className="bg-[#d8c990] px-10 py-5 text-[12px] font-semibold uppercase tracking-[2px] text-[#1a1a1a] transition hover:bg-white"
            >
              Khám phá bộ sưu tập
            </Link>
            <Link
              to="/about"
              className="border border-white/40 px-10 py-5 text-[12px] font-semibold uppercase tracking-[2px] text-white transition hover:border-white hover:bg-white/10"
            >
              Câu chuyện thương hiệu
            </Link>
          </div>

          <div className="mt-16 grid max-w-[960px] grid-cols-2 gap-x-10 gap-y-8 border-t border-white/15 pt-9 sm:grid-cols-4">
            {active.columns.map((col) => (
              <div key={col.label}>
                <p className="text-[11px] uppercase tracking-[1.5px] text-white/45">{col.label}</p>
                <p className="mt-2.5 text-[14px] leading-[1.6] text-white/90 md:text-[15px]">
                  {col.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-12 flex flex-wrap gap-x-9 gap-y-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          {COLLECTIONS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeCollection(index)}
              onMouseEnter={() => changeCollection(index)}
              onFocus={() => changeCollection(index)}
              aria-pressed={index === activeIndex}
              className={`relative pb-2 text-[12px] font-medium uppercase tracking-[2px] transition-colors duration-300 ${
                index === activeIndex ? "text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              {item.tab}
              <span
                className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[#d8c990] transition-transform duration-500 ${
                  index === activeIndex ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {COLLECTIONS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.tab}
            onClick={() => changeCollection(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === activeIndex ? "w-8 bg-[#d8c990]" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
