import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Leaf,
  Loader2,
  Sparkles,
  Trees,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { toast } from "../../store/toast.store";

const fallbackScentFamilies = [
  {
    id: "woody",
    name: "Hương gỗ",
    description: "Gỗ đàn hương, tuyết tùng, trầm hương",
    icon: Trees,
  },
  {
    id: "floral",
    name: "Hương hoa",
    description: "Hoa hồng, hoa nhài, dành dành",
    icon: Flower2,
  },
  {
    id: "fresh",
    name: "Hương tươi mát",
    description: "Cam bergamot, chanh, hương biển",
    icon: Leaf,
  },
  {
    id: "oriental",
    name: "Hương phương Đông",
    description: "Hổ phách, vanilla, gia vị ấm",
    icon: Sparkles,
  },
];

const familyId = (value: string) => value.trim().toLowerCase();

const familyOptionFromName = (name: string) => {
  const id = familyId(name);
  const known = fallbackScentFamilies.find((item) => item.id === id);
  if (known) return known;

  const icon = /wood|gỗ|leather|da thuộc/.test(id)
    ? Trees
    : /floral|flower|hoa/.test(id)
      ? Flower2
      : /fresh|citrus|aquatic|green|tươi|cam chanh|biển/.test(id)
        ? Leaf
        : Sparkles;

  return {
    id,
    name,
    description: `Khám phá những tầng hương đặc trưng của nhóm ${name}.`,
    icon,
  };
};

interface ScentProfileData {
  families: string[];
  preferredNotes?: string[];
  dislikedNotes?: string[];
}

interface ProductFacetResponse {
  fragranceFamilies: string[];
  notes: string[];
}

interface RecommendedProduct {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  image?: string | null;
  images?: string[];
  priceText?: string;
  stock?: number;
}

interface ProductListResponse {
  data: RecommendedProduct[];
  totalPages: number;
}

export default function ScentProfile() {
  const [families, setFamilies] = useState<string[]>([]);
  const [preferredNotes, setPreferredNotes] = useState<string[]>([]);
  const [dislikedNotes, setDislikedNotes] = useState<string[]>([]);
  const [familyOptions, setFamilyOptions] = useState(fallbackScentFamilies);
  const [noteOptions, setNoteOptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .get<ScentProfileData>("/account/scent-profile")
      .then(({ data }) => {
        if (!mounted) return;
        setFamilies(data.families || []);
        setPreferredNotes(data.preferredNotes || []);
        setDislikedNotes(data.dislikedNotes || []);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Không thể tải hồ sơ mùi hương");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    api
      .get<ProductFacetResponse>("/products/filters")
      .then(({ data }) => {
        if (!mounted) return;
        const nextFamilies = Array.from(
          new Set((data.fragranceFamilies || []).map((item) => item.trim()).filter(Boolean)),
        ).map(familyOptionFromName);
        setFamilyOptions(nextFamilies.length ? nextFamilies : fallbackScentFamilies);
        setNoteOptions(
          Array.from(new Set((data.notes || []).map((item) => item.trim()).filter(Boolean))).sort(
            (left, right) => left.localeCompare(right, "vi"),
          ),
        );
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const selectedFamilyOptions = useMemo(
    () =>
      familyOptions.filter((item) => families.some((selected) => familyId(selected) === item.id)),
    [families, familyOptions],
  );
  const selectedFamilyNames = selectedFamilyOptions.map((item) => item.name).join(" · ");
  const selectedFamilyDescription = selectedFamilyOptions.length
    ? `Hồ sơ của bạn kết hợp ${selectedFamilyOptions
        .map((item) => item.name)
        .join(", ")}. ${selectedFamilyOptions.map((item) => item.description).join(" ")}`
    : "Chọn các nhóm hương yêu thích để chúng tôi xây dựng hồ sơ và đề xuất sản phẩm phù hợp hơn.";
  const selectedFamilyFilters = useMemo(
    () => selectedFamilyOptions.map((item) => item.name),
    [selectedFamilyOptions],
  );
  const discoverPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("match", "any");
    if (selectedFamilyFilters.length) {
      params.set("scent", selectedFamilyFilters.join(","));
    }
    if (preferredNotes.length) params.set("note", preferredNotes.join(","));
    if (dislikedNotes.length) params.set("excludeNote", dislikedNotes.join(","));
    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  }, [dislikedNotes, preferredNotes, selectedFamilyFilters]);

  useEffect(() => {
    let active = true;
    const scent = selectedFamilyFilters.join(",");
    const note = preferredNotes.join(",");
    const excludeNote = dislikedNotes.join(",");

    if (!scent && !note) {
      setRecommendations([]);
      setActiveRecommendation(0);
      return () => {
        active = false;
      };
    }

    setRecommendationsLoading(true);
    api
      .get<ProductListResponse>("/products", {
        params: {
          page: 1,
          limit: 100,
          scent: scent || undefined,
          note: note || undefined,
          excludeNote: excludeNote || undefined,
          match: "any",
          sort: "best_selling",
        },
      })
      .then(async ({ data: firstPage }) => {
        const additionalPages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
            api.get<ProductListResponse>("/products", {
              params: {
                page: index + 2,
                limit: 100,
                scent: scent || undefined,
                note: note || undefined,
                excludeNote: excludeNote || undefined,
                match: "any",
                sort: "best_selling",
              },
            }),
          ),
        );
        if (!active) return;

        const allProducts = [
          ...firstPage.data,
          ...additionalPages.flatMap((response) => response.data.data),
        ];
        setRecommendations(
          Array.from(new Map(allProducts.map((product) => [product.id, product])).values()),
        );
        setActiveRecommendation(0);
      })
      .catch(() => {
        if (active) setRecommendations([]);
      })
      .finally(() => {
        if (active) setRecommendationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dislikedNotes, preferredNotes, selectedFamilyFilters]);

  const toggleFamily = (id: string) => {
    const normalizedId = familyId(id);
    setFamilies((prev) =>
      prev.some((item) => familyId(item) === normalizedId)
        ? prev.filter((item) => familyId(item) !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const togglePreferredNote = (note: string) => {
    setPreferredNotes((current) =>
      current.some((item) => familyId(item) === familyId(note))
        ? current.filter((item) => familyId(item) !== familyId(note))
        : [...current, note],
    );
    setDislikedNotes((current) => current.filter((item) => familyId(item) !== familyId(note)));
  };

  const toggleDislikedNote = (note: string) => {
    setDislikedNotes((current) =>
      current.some((item) => familyId(item) === familyId(note))
        ? current.filter((item) => familyId(item) !== familyId(note))
        : [...current, note],
    );
    setPreferredNotes((current) => current.filter((item) => familyId(item) !== familyId(note)));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<
        ScentProfileData & {
          newMemberVoucherIssued?: boolean;
          profileCompletionVoucherCode?: string;
        }
      >("/account/scent-profile", {
        families,
        preferredNotes,
        dislikedNotes,
      });
      setFamilies(data.families || []);
      setPreferredNotes(data.preferredNotes || []);
      setDislikedNotes(data.dislikedNotes || []);
      toast.success(
        data.newMemberVoucherIssued
          ? `Đã lưu hồ sơ mùi hương. Voucher chào mừng ${data.profileCompletionVoucherCode} đã sẵn sàng.`
          : "Đã lưu hồ sơ mùi hương",
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu hồ sơ mùi hương");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2D2925]">
      <section className="border-b border-[#E7E0D7] px-6 pb-7 pt-12 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9B9288]">
          Cổng thông tin cá nhân
        </p>

        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Hồ sơ mùi hương</h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7C746C]">
          Hồ sơ mùi hương dựa trên các nhóm hương bạn yêu thích, giúp chúng tôi đề xuất những sản
          phẩm phù hợp với sở thích và phong cách của bạn.
        </p>
      </section>

      <main className="space-y-10 px-6 py-10 lg:px-12">
        {loading && (
          <div className="flex items-center gap-3 border border-[#E2DBD2] bg-[#FFFDF9] p-5 text-sm text-[#7C746C]">
            <Loader2 size={16} className="animate-spin" />
            Đang tải hồ sơ mùi hương...
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="bg-[#F2EEE9] p-7 lg:p-9">
            <p className="text-[9px] uppercase tracking-[0.24em] text-[#978D82]">
              Dấu ấn mùi hương của bạn
            </p>

            <h2 className="mt-3 font-serif text-3xl">
              {selectedFamilyNames || "Chưa chọn nhóm hương"}
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#70685F]">
              {selectedFamilyDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedFamilyOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.id}
                    className="flex items-center gap-2 border border-[#D4CCC2] bg-[#FCF9F4] px-4 py-2 text-[9px] uppercase tracking-[0.14em]"
                  >
                    <Icon size={13} strokeWidth={1.4} />
                    {item.name}
                  </span>
                );
              })}
            </div>

            <Link
              to={discoverPath}
              className="mt-7 flex items-center gap-3 bg-[#816A00] px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-[#675500]"
            >
              Khám phá sản phẩm phù hợp
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative flex min-h-[420px] min-w-0 flex-col overflow-hidden bg-[#E9E4DD]">
            {recommendationsLoading ? (
              <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[#756D64]">
                <Loader2 size={18} className="animate-spin" />
                Đang tìm sản phẩm phù hợp...
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <Link
                  to={`/products/${recommendations[activeRecommendation]?.slug || recommendations[activeRecommendation]?.id}`}
                  className="group relative min-h-0 flex-1 overflow-hidden"
                  aria-label={`Xem ${recommendations[activeRecommendation]?.name}`}
                >
                  {recommendations[activeRecommendation]?.image ||
                  recommendations[activeRecommendation]?.images?.[0] ? (
                    <img
                      loading="lazy"
                      src={
                        recommendations[activeRecommendation]?.image ||
                        recommendations[activeRecommendation]?.images?.[0]
                      }
                      alt={recommendations[activeRecommendation]?.name}
                      className="h-full w-full object-contain p-8 transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#8A8178]">
                      Sản phẩm chưa có ảnh
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-[#FCF9F4]/95 px-5 py-4 backdrop-blur-sm">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#8B8177]">
                      {recommendations[activeRecommendation]?.brand || "L'Essence Noire"}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-4">
                      <h3 className="font-serif text-lg leading-tight">
                        {recommendations[activeRecommendation]?.name}
                      </h3>
                      <span className="shrink-0 text-xs text-[#816A00]">
                        {recommendations[activeRecommendation]?.priceText}
                      </span>
                    </div>
                  </div>
                </Link>

                {recommendations.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRecommendation(
                          (current) =>
                            (current - 1 + recommendations.length) % recommendations.length,
                        )
                      }
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#D3CAC0] bg-[#FCF9F4]/90 text-[#554E47] transition hover:bg-white"
                      aria-label="Sản phẩm trước"
                      title="Sản phẩm trước"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRecommendation((current) => (current + 1) % recommendations.length)
                      }
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#D3CAC0] bg-[#FCF9F4]/90 text-[#554E47] transition hover:bg-white"
                      aria-label="Sản phẩm tiếp theo"
                      title="Sản phẩm tiếp theo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <div className="flex gap-2 overflow-x-auto border-t border-[#D8D0C7] bg-[#F6F2ED] p-3">
                  {recommendations.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setActiveRecommendation(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden border bg-white transition ${
                        index === activeRecommendation
                          ? "border-[#8A7000]"
                          : "border-[#DED7CF] hover:border-[#A69A8E]"
                      }`}
                      aria-label={`Chọn ${product.name}`}
                      title={product.name}
                    >
                      {product.image || product.images?.[0] ? (
                        <img
                          loading="lazy"
                          src={product.image || product.images?.[0]}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Sparkles size={15} className="m-auto text-[#A39A91]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-[#756D64]">
                <Sparkles size={24} strokeWidth={1.2} />
                <p className="mt-4 font-serif text-xl">Chưa có sản phẩm phù hợp</p>
                <p className="mt-2 max-w-xs text-xs leading-5">
                  Hãy chọn thêm nhóm hương để nhận gợi ý từ bộ sưu tập.
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl">Nhóm hương yêu thích</h2>

            <p className="mt-2 text-sm text-[#81786F]">
              Chọn những nhóm mùi hương phù hợp với sở thích của bạn. Đề xuất sản phẩm sẽ dựa trên
              các nhóm hương này.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {familyOptions.map((item) => {
              const Icon = item.icon;
              const selected = families.some((family) => familyId(family) === item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleFamily(item.id)}
                  className={`relative min-h-[180px] border p-6 text-left transition ${
                    selected
                      ? "border-[#9A7D00] bg-[#F2EDDC]"
                      : "border-[#E0D9D0] bg-[#FFFDF9] hover:border-[#B7AA9A]"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#927600] text-white">
                      <Check size={13} />
                    </span>
                  )}

                  <Icon size={25} strokeWidth={1.3} />

                  <h3 className="mt-7 font-serif text-xl">{item.name}</h3>

                  <p className="mt-2 text-xs leading-5 text-[#81786F]">{item.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="border border-[#E0D9D0] bg-[#FFFDF9] p-7">
            <div className="mb-5">
              <p className="text-[9px] uppercase tracking-[0.22em] text-[#8A7000]">
                Note yêu thích
              </p>
              <h2 className="mt-2 font-serif text-2xl">Note hương yêu thích</h2>
              <p className="mt-2 text-sm leading-6 text-[#81786F]">
                Sản phẩm gợi ý và bộ lọc khám phá sẽ ưu tiên các note bạn chọn.
              </p>
            </div>
            <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-y-auto pr-2">
              {noteOptions.map((note) => {
                const selected = preferredNotes.some((item) => familyId(item) === familyId(note));
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => togglePreferredNote(note)}
                    className={`inline-flex items-center gap-2 border px-3 py-2 text-xs transition ${
                      selected
                        ? "border-[#8A7000] bg-[#F2EDDC] text-[#5E4D00]"
                        : "border-[#DED7CF] bg-white text-[#625A52] hover:border-[#A99D90]"
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {note}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-[#E0D9D0] bg-[#FFFDF9] p-7">
            <div className="mb-5">
              <p className="text-[9px] uppercase tracking-[0.22em] text-[#9A665C]">
                Note muốn tránh
              </p>
              <h2 className="mt-2 font-serif text-2xl">Note hương không thích</h2>
              <p className="mt-2 text-sm leading-6 text-[#81786F]">
                Sản phẩm chứa các note này sẽ được loại khỏi danh sách đề xuất.
              </p>
            </div>
            <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-y-auto pr-2">
              {noteOptions.map((note) => {
                const selected = dislikedNotes.some((item) => familyId(item) === familyId(note));
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => toggleDislikedNote(note)}
                    className={`inline-flex items-center gap-2 border px-3 py-2 text-xs transition ${
                      selected
                        ? "border-[#9A665C] bg-[#F6EAE7] text-[#74483F]"
                        : "border-[#DED7CF] bg-white text-[#625A52] hover:border-[#A99D90]"
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {note}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-5 bg-[#EDE8E1] p-7 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-2xl">Cập nhật hồ sơ mùi hương</h2>

            <p className="mt-2 text-sm text-[#776F67]">
              Lưu thay đổi để nhận đề xuất sản phẩm chính xác hơn.
            </p>
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center justify-center gap-3 bg-[#816A00] px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white hover:bg-[#675500] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </section>
      </main>
    </div>
  );
}
