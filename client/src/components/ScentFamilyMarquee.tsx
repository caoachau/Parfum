import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

type ScentFamily = {
  name: string;
  image: string;
  description: string;
  productCount?: number;
};

type ProductFilterResponse = {
  fragranceFamilies?: string[];
  fragranceFamilyCards?: { name: string; image?: string; productCount?: number }[];
};

type ManagedScentFamilyCard = {
  id: string;
  name: string;
  image: string;
  description?: string;
  displayOrder?: number;
};

type ManagedScentFamilyResponse =
  { success?: boolean; data?: ManagedScentFamilyCard[] } | ManagedScentFamilyCard[];

function displayFamilyDescription(family: ScentFamily) {
  const genericCount = family.description.match(
    /qua\s+(\d+)\s+sáng tạo nước hoa trong bộ sưu tập/i,
  );

  if (genericCount) {
    return `${genericCount[1]} sáng tạo nước hoa được tuyển chọn, đại diện cho sắc thái riêng của nhóm hương này.`;
  }

  if (
    family.description
      .trim()
      .toLocaleLowerCase("vi")
      .startsWith(`khám phá dấu ấn ${family.name}`.toLocaleLowerCase("vi"))
  ) {
    return "Một lát cắt khứu giác đặc trưng trong bộ sưu tập nước hoa của chúng tôi.";
  }

  return family.description;
}

// Nhom mui huong + anh dai dien + mo ta ngan (1-2 cau).
const FALLBACK_SCENT_FAMILIES: ScentFamily[] = [
  {
    name: "Floral",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcUyeP2qsr7K8Kgg9ndO326Ks5hRCbG-8kowKssfbUKg&s=10?w=900&q=80",
    description:
      "Những cánh hoa hồng, nhài và dành dành hé nở lúc bình minh — thanh lịch, nữ tính và đầy lãng mạn.",
  },
  {
    name: "Woody",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYxsQg2lzuPyKUOFk6C58zYBQENvX-8qwMXkpOIVeGEA&s=10?w=900&q=80",
    description:
      "Cốt gỗ đàn hương, tuyết tùng và trầm hương sâu lắng, kiến tạo chiều sâu ấm và vững chãi.",
  },
  {
    name: "Oriental",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1SdGabYja-p6Q6_FrgmOk5hNrgd1uD80iCYQo-QRGWg&s=10?w=900&q=80",
    description:
      "Hổ phách, vanilla và gia vị ấm dệt nên tầng hương huyền bí, quyến rũ và sang trọng.",
  },
  {
    name: "Citrus",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmDCFd7Zn7yuqEgc5CI_eBhhvJmK7mg0VTJaOFwr2bog&s=10?w=900&q=80",
    description:
      "Bergamot, chanh và cam tươi bật tỏa năng lượng rạng rỡ, sảng khoái ngay từ nhịp đầu tiên.",
  },
  {
    name: "Fresh",
    image:
      "https://apaniche.vn/wp-content/webp-express/webp-images/uploads/2025/09/mui-huong-tuoi-moi.png.webp?w=900&q=80",
    description:
      "Hương biển, lá xanh và không khí núi cao mang lại cảm giác sạch, thoáng và tràn đầy sức sống.",
  },
  {
    name: "Aromatic",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_zquUzhIzdUYO-j8PWlDrbSPjWBmZod1wdei_lV3Bzw&s=10?w=900&q=80",
    description: "Oải hương, hương thảo và xô thơm gợi nên nét phong trần, lịch lãm và cân bằng.",
  },
  {
    name: "Leather",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCe5JzyIg_5Z5eV1_Vmw0OQe2HWA-pS5pJznj4AdMmIQ&s=10?w=900&q=80",
    description:
      "Da thuộc và khói gợi cảm giác cổ điển, mạnh mẽ — dấu ấn cá tính không thể nhầm lẫn.",
  },
  {
    name: "Gourmand",
    image:
      "https://nuochoamc.com/upload/images/bai-viet/421/nuoc-hoa-mui-huong-banh-keo-gourmand-la-gi.webp?w=900&q=80",
    description:
      "Vanilla, caramel và cacao ngọt ngào như một món tráng miệng — ấm áp và đầy mời gọi.",
  },
];

const FAMILY_ALIASES: Record<string, string> = {
  aromaatic: "Aromatic",
};

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  aldehydes:
    "Những phân tử aldehyde sáng, sạch và lấp lánh tạo hiệu ứng thanh lịch, cổ điển nhưng đầy hiện đại.",
  amber: "Hổ phách ấm, nhựa thơm và vanilla tạo nên chiều sâu bao bọc, gợi cảm và sang trọng.",
  aquatic:
    "Hơi nước, khoáng chất và không khí biển mở ra cảm giác trong trẻo, mát lành và rộng thoáng.",
  chypre: "Cam chanh, rêu sồi và patchouli cân bằng nét tươi sáng với chiều sâu khô, thanh lịch.",
  fougere:
    "Oải hương, coumarin và gỗ tạo nên cấu trúc xanh mát, lịch lãm đặc trưng của nhóm Fougère.",
  fruity: "Trái cây chín mọng mang đến sắc thái tươi vui, mềm mại và ngọt ngào vừa đủ.",
  green: "Lá non, cỏ cắt và nhựa cây tái hiện hơi thở xanh, sắc nét và tự nhiên.",
  musky: "Xạ hương mềm như làn da, sạch sẽ và ấm áp, giúp tổng thể hương lưu lại đầy tinh tế.",
  powdery: "Phấn mịn, iris và violet tạo cảm giác mềm mại, thanh tao và hoài cổ.",
  spicy: "Tiêu, quế và các gia vị nóng tạo nhịp hương sống động, ấm áp và giàu cá tính.",
  "đa dạng":
    "Tập hợp những sáng tạo giao thoa nhiều nhóm hương, khó giới hạn trong một cấu trúc duy nhất.",
};

const normalizeFamilyKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const fallbackByFamily = new Map(
  FALLBACK_SCENT_FAMILIES.map((family) => [normalizeFamilyKey(family.name), family]),
);

function hydrateFamilies(filters: ProductFilterResponse): ScentFamily[] {
  const source: { name: string; image?: string; productCount?: number }[] = filters
    .fragranceFamilyCards?.length
    ? filters.fragranceFamilyCards
    : (filters.fragranceFamilies || []).map((name) => ({ name }));
  const merged = new Map<string, { name: string; image: string; productCount: number }>();

  source.forEach((item) => {
    const rawName = item.name?.trim();
    if (!rawName) return;
    const rawKey = normalizeFamilyKey(rawName);
    const name = FAMILY_ALIASES[rawKey] || rawName;
    const key = normalizeFamilyKey(name);
    const current = merged.get(key) || { name, image: "", productCount: 0 };
    current.productCount += Number(item.productCount || 0);
    if (!current.image && item.image) current.image = item.image;
    merged.set(key, current);
  });

  return Array.from(merged.values())
    .sort((left, right) => left.name.localeCompare(right.name, "vi"))
    .map((item) => {
      const key = normalizeFamilyKey(item.name);
      const fallback = fallbackByFamily.get(key);
      return {
        name: item.name,
        image: item.image || fallback?.image || FALLBACK_SCENT_FAMILIES[0].image,
        description:
          fallback?.description ||
          FAMILY_DESCRIPTIONS[key] ||
          `Khám phá sắc thái ${item.name} qua ${item.productCount || "những"} sáng tạo nước hoa trong bộ sưu tập.`,
        productCount: item.productCount,
      };
    });
}

/**
 * Dai card nhom mui huong:
 * - Khi de yen: tu dong luot sang trai (marquee lien tuc, lap vo tan).
 * - Khi con tro trong vung card + lan chuot len/xuong: cuon sang phai/trai theo huong lan.
 */
export default function ScentFamilyMarquee() {
  const [families, setFamilies] = useState<ScentFamily[]>(FALLBACK_SCENT_FAMILIES);
  const trackRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerXRef = useRef(0);

  useEffect(() => {
    let active = true;
    async function loadFamilies() {
      try {
        const { data: response } = await api.get<ManagedScentFamilyResponse>("/scent-family-cards");
        const managedRows = Array.isArray(response) ? response : response.data || [];
        if (managedRows.length) {
          if (active) {
            setFamilies(
              managedRows.map((item) => ({
                name: item.name,
                image: item.image,
                description:
                  item.description?.trim() ||
                  `Khám phá dấu ấn ${item.name} trong bộ sưu tập nước hoa của chúng tôi.`,
              })),
            );
          }
          return;
        }
      } catch {
        // Backend cu chua co endpoint CRUD: thu facet san pham ben duoi.
      }

      try {
        const { data } = await api.get<ProductFilterResponse>("/products/filters");
        const nextFamilies = hydrateFamilies(data);
        if (active && nextFamilies.length) setFamilies(nextFamilies);
      } catch {
        // Giu danh sach du phong neu API tam thoi khong san sang.
      }
    }
    loadFamilies();
    return () => {
      active = false;
    };
  }, []);

  const paintOffset = (nextOffset: number) => {
    const motion = motionRef.current;
    const loopWidth = groupRef.current?.offsetWidth || 0;
    if (!motion || loopWidth <= 0) return;
    offsetRef.current = ((nextOffset % loopWidth) + loopWidth) % loopWidth;
    motion.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };

  // Chay theo thoi gian va transform GPU de khong phu thuoc scrollLeft cua trinh duyet.
  useEffect(() => {
    const motion = motionRef.current;
    const group = groupRef.current;
    if (!motion || !group) return;

    let raf = 0;
    let previousTime = performance.now();
    const SPEED = 30; // px moi giay

    const step = (currentTime: number) => {
      const elapsed = Math.min(50, currentTime - previousTime);
      previousTime = currentTime;
      if (!draggingRef.current) {
        paintOffset(offsetRef.current + (SPEED * elapsed) / 1000);
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    const resizeObserver = new ResizeObserver(() => paintOffset(offsetRef.current));
    resizeObserver.observe(group);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  // Lan chuot doc -> cuon ngang theo huong lan.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      paintOffset(offsetRef.current + event.deltaY * 1.5);
    };

    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section className="border-t border-[#E6E1D9] bg-[#F4F1EB] pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#9B8125]">
          Bản đồ khứu giác
        </div>
        <h2
          className="max-w-[620px] text-[38px] leading-[1.05] tracking-[-0.03em] sm:text-[48px]"
          style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
        >
          Khám phá các nhóm hương
        </h2>
        <p className="mt-4 max-w-[560px] text-sm leading-7 text-[#69665F]">
          Mỗi nhóm hương mở ra một sắc thái riêng — từ thanh mát, trong trẻo đến ấm áp, sâu lắng.
          Kéo hoặc lăn chuột trên dải thẻ để tìm dấu hương phù hợp với bạn.
        </p>
      </div>

      <div
        ref={trackRef}
        className="mt-6 w-full cursor-grab overflow-hidden pb-0 pt-8 active:cursor-grabbing"
        onPointerDown={(event) => {
          draggingRef.current = true;
          pointerXRef.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          const delta = pointerXRef.current - event.clientX;
          pointerXRef.current = event.clientX;
          paintOffset(offsetRef.current + delta);
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
      >
        <div ref={motionRef} className="flex w-max will-change-transform">
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              ref={copyIndex === 0 ? groupRef : undefined}
              aria-hidden={copyIndex === 1}
              className="flex shrink-0 gap-6 pr-6"
            >
              {families.map((family, index) => (
                <article
                  key={`${copyIndex}-${family.name}-${index}`}
                  className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden bg-[#EAE5DD] sm:w-[320px]"
                >
                  <div className="relative overflow-hidden bg-[#26221D] shadow-[0_14px_30px_rgba(20,16,11,0.3)]">
                    <img
                      src={family.image}
                      alt=""
                      loading="lazy"
                      className="aspect-[0.82/1] w-full object-cover brightness-[0.88] transition duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 bg-black/10"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 px-5 pb-6 pt-5">
                    <h3
                      className="text-[24px] leading-tight tracking-[-0.01em]"
                      style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                    >
                      {family.name}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[#5E5A53]">
                      {displayFamilyDescription(family)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
