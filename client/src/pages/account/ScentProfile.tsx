import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Leaf,
  Loader2,
  Sparkles,
  Trees,
  Wind,
  Flame,
  Droplets,
  Sun,
  Moon,
  Coffee,
  Cherry,
  Citrus,
  Shell,
  Wheat,
  BookOpen,
  Save,
  RefreshCw,
  Heart,
  Star,
  Ban,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { toast } from "../../store/toast.store";

type ScentFamilyOption = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};

const fallbackScentFamilies: ScentFamilyOption[] = [
  {
    id: "woody",
    name: "Hương gỗ",
    description: "Gỗ đàn hương, tuyết tùng, trầm hương",
    icon: Trees,
    color: "#7C5C3E",
    bg: "#F5EFE8",
  },
  {
    id: "floral",
    name: "Hương hoa",
    description: "Hoa hồng, hoa nhài, dành dành",
    icon: Flower2,
    color: "#9A4D6B",
    bg: "#F9EEF3",
  },
  {
    id: "fresh",
    name: "Hương tươi mát",
    description: "Cam bergamot, chanh, hương biển",
    icon: Wind,
    color: "#2E7D7E",
    bg: "#EAF5F5",
  },
  {
    id: "oriental",
    name: "Hương phương Đông",
    description: "Hổ phách, vanilla, gia vị ấm",
    icon: Sparkles,
    color: "#8B6200",
    bg: "#F7F0DC",
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  wood: Trees,
  gỗ: Trees,
  leather: BookOpen,
  "da thuộc": BookOpen,
  floral: Flower2,
  flower: Flower2,
  hoa: Flower2,
  fresh: Wind,
  citrus: Citrus,
  aquatic: Shell,
  green: Leaf,
  tươi: Wind,
  "cam chanh": Citrus,
  biển: Shell,
  spicy: Flame,
  gia: Flame,
  ấm: Flame,
  sweet: Cherry,
  vanilla: Coffee,
  ngọt: Cherry,
  fruity: Cherry,
  trái: Cherry,
  musky: Moon,
  musk: Moon,
  powdery: Wheat,
  phấn: Wheat,
  sunny: Sun,
  solar: Sun,
  oriental: Sparkles,
  phương: Sparkles,
  aqua: Droplets,
  water: Droplets,
};

const getIcon = (name: string): React.ElementType => {
  const lower = name.trim().toLowerCase();
  for (const key of Object.keys(ICON_MAP)) {
    if (lower.includes(key)) return ICON_MAP[key];
  }
  return Sparkles;
};

const PALETTE = [
  { color: "#7C5C3E", bg: "#F5EFE8" },
  { color: "#9A4D6B", bg: "#F9EEF3" },
  { color: "#2E7D7E", bg: "#EAF5F5" },
  { color: "#8B6200", bg: "#F7F0DC" },
  { color: "#4A5E3A", bg: "#EDF3E8" },
  { color: "#5C4A8A", bg: "#F0ECF8" },
  { color: "#7E3E2F", bg: "#F8EEEB" },
  { color: "#2E5C7E", bg: "#E8F1F8" },
];

// Unified brand accents (replaces the ~7 slightly-different olive/gold hexes
// that were scattered through the page). One warm bronze for anything
// interactive/selected, one bright gold reserved for decorative sparkle, one
// rust for the "notes to avoid" signal.
const ACCENT = "#8B5F22";
const ACCENT_DARK = "#6E4A1B";
const ACCENT_SOFT_BG = "#F2EDDC";
const ACCENT_SOFT_TEXT = "#5C3D14";
const GOLD_SPARKLE = "#C9A84C";
const NEGATIVE = "#AE4A32";
const NEGATIVE_SOFT_BG = "#FBEAE5";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5F22]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCF9F4]";

const familyId = (value: string) => value.trim().toLowerCase();

const familyOptionFromName = (name: string, index = 0): ScentFamilyOption => {
  const id = familyId(name);
  const known = fallbackScentFamilies.find((item) => item.id === id);
  if (known) return known;
  const palette = PALETTE[index % PALETTE.length];
  return {
    id,
    name,
    description: `Khám phá những tầng hương đặc trưng của nhóm ${name}.`,
    icon: getIcon(name),
    ...palette,
  };
};

const normalizeList = (list: string[]) =>
  [...list]
    .map((item) => item.trim().toLowerCase())
    .sort()
    .join("|");

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

interface ProfileSnapshot {
  families: string[];
  preferredNotes: string[];
  dislikedNotes: string[];
}

export default function ScentProfile() {
  const [families, setFamilies] = useState<string[]>([]);
  const [preferredNotes, setPreferredNotes] = useState<string[]>([]);
  const [dislikedNotes, setDislikedNotes] = useState<string[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<ProfileSnapshot | null>(null);
  const [familyOptions, setFamilyOptions] = useState(fallbackScentFamilies);
  const [noteOptions, setNoteOptions] = useState<string[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [familiesOpen, setFamiliesOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [familyPage, setFamilyPage] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .get<ScentProfileData>("/account/scent-profile")
      .then(({ data }) => {
        if (!mounted) return;
        const nextFamilies = data.families || [];
        const nextPreferred = data.preferredNotes || [];
        const nextDisliked = data.dislikedNotes || [];
        setFamilies(nextFamilies);
        setPreferredNotes(nextPreferred);
        setDislikedNotes(nextDisliked);
        setSavedSnapshot({
          families: nextFamilies,
          preferredNotes: nextPreferred,
          dislikedNotes: nextDisliked,
        });
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
        ).map((name, index) => familyOptionFromName(name, index));
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
    () => familyOptions.filter((item) => families.some((s) => familyId(s) === item.id)),
    [families, familyOptions],
  );
  const selectedFamilyNames = selectedFamilyOptions.map((item) => item.name).join(" · ");
  const selectedFamilyDescription = selectedFamilyOptions.length
    ? `Hồ sơ của bạn kết hợp ${selectedFamilyOptions.map((item) => item.name).join(", ")}. ${selectedFamilyOptions.map((item) => item.description).join(" ")}`
    : "Chọn các nhóm hương yêu thích để chúng tôi xây dựng hồ sơ và đề xuất sản phẩm phù hợp hơn.";
  const selectedFamilyFilters = useMemo(
    () => selectedFamilyOptions.map((item) => item.name),
    [selectedFamilyOptions],
  );

  const FAMILY_PAGE_SIZE = 12;
  const familyTotalPages = Math.max(1, Math.ceil(familyOptions.length / FAMILY_PAGE_SIZE));
  const pagedFamilyOptions = familyOptions.slice(
    familyPage * FAMILY_PAGE_SIZE,
    familyPage * FAMILY_PAGE_SIZE + FAMILY_PAGE_SIZE,
  );
  useEffect(() => {
    setFamilyPage(0);
  }, [familyOptions]);

  const filteredNoteOptions = useMemo(() => {
    const query = noteSearch.trim().toLowerCase();
    if (!query) return noteOptions;
    return noteOptions.filter((note) => note.toLowerCase().includes(query));
  }, [noteOptions, noteSearch]);

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return (
      normalizeList(families) !== normalizeList(savedSnapshot.families) ||
      normalizeList(preferredNotes) !== normalizeList(savedSnapshot.preferredNotes) ||
      normalizeList(dislikedNotes) !== normalizeList(savedSnapshot.dislikedNotes)
    );
  }, [families, preferredNotes, dislikedNotes, savedSnapshot]);

  const discoverPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("match", "any");
    if (selectedFamilyFilters.length) params.set("scent", selectedFamilyFilters.join(","));
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
        const allProducts = [...firstPage.data, ...additionalPages.flatMap((r) => r.data.data)];
        setRecommendations(Array.from(new Map(allProducts.map((p) => [p.id, p])).values()));
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
    setPreferredNotes((cur) =>
      cur.some((item) => familyId(item) === familyId(note))
        ? cur.filter((item) => familyId(item) !== familyId(note))
        : [...cur, note],
    );
    setDislikedNotes((cur) => cur.filter((item) => familyId(item) !== familyId(note)));
  };
  const toggleDislikedNote = (note: string) => {
    setDislikedNotes((cur) =>
      cur.some((item) => familyId(item) === familyId(note))
        ? cur.filter((item) => familyId(item) !== familyId(note))
        : [...cur, note],
    );
    setPreferredNotes((cur) => cur.filter((item) => familyId(item) !== familyId(note)));
  };

  const clearFamilies = () => setFamilies([]);
  const clearNotes = () => {
    setPreferredNotes([]);
    setDislikedNotes([]);
  };
  const discardChanges = () => {
    if (!savedSnapshot) return;
    setFamilies(savedSnapshot.families);
    setPreferredNotes(savedSnapshot.preferredNotes);
    setDislikedNotes(savedSnapshot.dislikedNotes);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<
        ScentProfileData & {
          newMemberVoucherIssued?: boolean;
          profileCompletionVoucherCode?: string;
        }
      >("/account/scent-profile", { families, preferredNotes, dislikedNotes });
      const nextFamilies = data.families || [];
      const nextPreferred = data.preferredNotes || [];
      const nextDisliked = data.dislikedNotes || [];
      setFamilies(nextFamilies);
      setPreferredNotes(nextPreferred);
      setDislikedNotes(nextDisliked);
      setSavedSnapshot({
        families: nextFamilies,
        preferredNotes: nextPreferred,
        dislikedNotes: nextDisliked,
      });
      toast.success(
        data.newMemberVoucherIssued
          ? `Đã lưu hồ sơ. Voucher ${data.profileCompletionVoucherCode} đã sẵn sàng.`
          : "Đã lưu hồ sơ mùi hương",
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu hồ sơ mùi hương");
    } finally {
      setSaving(false);
    }
  };

  const currentProduct = recommendations[activeRecommendation];

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2D2925]">
      {/* Header */}
      <section className="border-b border-[#E7E0D7] px-6 pb-8 pt-12 lg:px-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#9B9288]" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#9B9288]">
                Cổng thông tin cá nhân
              </p>
            </div>
            <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Hồ sơ mùi hương</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#7C746C]">
              Cá nhân hoá trải nghiệm mua sắm — chọn nhóm hương và note yêu thích để nhận gợi ý sản
              phẩm phù hợp nhất với bạn.
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 rounded border border-[#E2DBD2] bg-[#FFFDF9] px-4 py-2.5 text-xs text-[#7C746C]">
              <Loader2 size={13} className="animate-spin" />
              Đang tải...
            </div>
          )}
        </div>
      </section>

      <main className="space-y-12 px-6 py-10 pb-28 lg:px-12">
        {/* ── SECTION 1: Profile summary + Recommendations ── */}
        <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          {/* Profile card */}
          <div className="relative overflow-hidden border border-[#E2DBD2] bg-[#FFFDF9]">
            {/* Decorative radial — kept faint, just enough to echo the brand's gold */}
            <div
              className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${GOLD_SPARKLE} 0%, transparent 70%)` }}
            />
            {/* Second glow, bottom-left, smaller and fainter so it reads as an echo, not a twin */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 -translate-x-1/4 translate-y-1/4 rounded-full opacity-15"
              style={{ background: `radial-gradient(circle, ${GOLD_SPARKLE} 0%, transparent 70%)` }}
            />
            <div className="relative z-10 p-7 lg:p-9">
              <div className="flex items-center gap-2" style={{ color: ACCENT }}>
                <Star size={13} strokeWidth={1.5} />
                <p className="text-[9px] uppercase tracking-[0.28em]">Dấu ấn mùi hương của bạn</p>
              </div>

              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#2D2925]">
                {selectedFamilyNames || (
                  <span className="text-[#B0A89D] italic">Chưa chọn nhóm hương</span>
                )}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#7C746C]">
                {selectedFamilyDescription}
              </p>

              {/* Selected family chips */}
              {selectedFamilyOptions.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedFamilyOptions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <span
                        key={item.id}
                        className="flex items-center gap-2 border border-[#E0D9D0] bg-[#F6F2ED] px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] text-[#5C4A32]"
                      >
                        <Icon size={12} strokeWidth={1.5} />
                        {item.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Stats row */}
              <div className="mt-7 flex flex-wrap items-center gap-6 border-t border-[#E7E0D7] pt-6 text-[11px] text-[#7C746C]">
                <div className="flex items-center gap-2">
                  <Flower2 size={13} strokeWidth={1.5} style={{ color: ACCENT }} />
                  <span>{families.length} nhóm hương</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={13} strokeWidth={1.5} style={{ color: ACCENT }} />
                  <span>{preferredNotes.length} note yêu thích</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban size={13} strokeWidth={1.5} style={{ color: NEGATIVE }} />
                  <span>{dislikedNotes.length} note cần tránh</span>
                </div>
              </div>

              <Link
                to={discoverPath}
                className={`mt-7 inline-flex items-center gap-3 border px-6 py-3 text-[10px] uppercase tracking-[0.16em] transition ${FOCUS_RING}`}
                style={{ borderColor: ACCENT, backgroundColor: `${ACCENT}14`, color: ACCENT }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ACCENT;
                  e.currentTarget.style.color = "#FFFDF9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${ACCENT}14`;
                  e.currentTarget.style.color = ACCENT;
                }}
              >
                <Sparkles size={13} strokeWidth={1.5} />
                Khám phá sản phẩm phù hợp
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Recommendations panel */}
          <div className="relative flex min-h-[340px] flex-col overflow-hidden border border-[#E2DBD2] bg-[#FFFDF9]">
            <div className="flex items-center justify-between border-b border-[#E2DBD2] px-5 py-3.5">
              <div className="flex items-center gap-2" style={{ color: ACCENT }}>
                <Star size={13} strokeWidth={1.5} />
                <p className="text-[9px] uppercase tracking-[0.22em]">Gợi ý cho bạn</p>
              </div>
              {recommendations.length > 0 && (
                <p className="text-[10px] text-[#9B9288]">
                  {activeRecommendation + 1} / {recommendations.length}
                </p>
              )}
            </div>

            {recommendationsLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[#756D64]">
                <RefreshCw
                  size={20}
                  className="animate-spin"
                  style={{ color: GOLD_SPARKLE }}
                  strokeWidth={1.5}
                />
                <p className="text-[11px] uppercase tracking-[0.14em]">
                  Đang tìm sản phẩm phù hợp...
                </p>
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <Link
                  to={`/products/${currentProduct?.slug || currentProduct?.id}`}
                  className="group relative min-h-0 flex-1 overflow-hidden"
                  aria-label={`Xem ${currentProduct?.name}`}
                >
                  {currentProduct?.image || currentProduct?.images?.[0] ? (
                    <img
                      loading="lazy"
                      src={currentProduct?.image || currentProduct?.images?.[0]}
                      alt={currentProduct?.name}
                      className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sparkles size={28} strokeWidth={1} className="text-[#C9B77A]" />
                    </div>
                  )}

                  {/* Prev/next overlay buttons */}
                  {recommendations.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveRecommendation(
                            (c) => (c - 1 + recommendations.length) % recommendations.length,
                          );
                        }}
                        className={`absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-[#D3CAC0] bg-white/90 text-[#554E47] shadow-sm transition hover:bg-white ${FOCUS_RING}`}
                        aria-label="Sản phẩm trước"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveRecommendation((c) => (c + 1) % recommendations.length);
                        }}
                        className={`absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-[#D3CAC0] bg-white/90 text-[#554E47] shadow-sm transition hover:bg-white ${FOCUS_RING}`}
                        aria-label="Sản phẩm tiếp theo"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}

                  {/* Info bar */}
                  <div className="absolute inset-x-0 bottom-0 border-t border-[#E2DBD2] bg-[#FFFDF9]/95 px-5 py-3.5 backdrop-blur-sm">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B8177]">
                      {currentProduct?.brand || "L'Essence Noire"}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <h3 className="font-serif text-base leading-tight">{currentProduct?.name}</h3>
                      <span className="shrink-0 text-xs font-medium" style={{ color: ACCENT }}>
                        {currentProduct?.priceText}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Thumbnail strip */}
                <div className="flex gap-1.5 overflow-x-auto border-t border-[#E2DBD2] bg-[#F6F2ED] p-3">
                  {recommendations.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setActiveRecommendation(index)}
                      aria-label={`Xem ${product.name}`}
                      aria-current={index === activeRecommendation}
                      className={`h-14 w-14 shrink-0 overflow-hidden border transition ${FOCUS_RING} ${
                        index === activeRecommendation
                          ? "border-[#8B5F22] bg-white ring-1 ring-[#C9A84C]/50"
                          : "border-[#DED7CF] bg-white hover:border-[#A69A8E]"
                      }`}
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
                        <Sparkles size={14} className="m-auto text-[#A39A91]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E2DBD2] bg-[#F6F2ED]">
                  <Flower2 size={22} strokeWidth={1.2} style={{ color: GOLD_SPARKLE }} />
                </div>
                <div>
                  <p className="font-serif text-lg text-[#2D2925]">Chưa có gợi ý</p>
                  <p className="mt-1.5 max-w-[220px] text-xs leading-5 text-[#756D64]">
                    Chọn nhóm hương bên dưới để nhận gợi ý sản phẩm phù hợp.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Family picker ── */}
        <section className="border border-[#E7E0D7] bg-[#FFFDF9]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E0D7] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2EDDC]">
                <Trees size={15} strokeWidth={1.5} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#2D2925]">Nhóm hương yêu thích</h2>
                <p className="text-[10px] text-[#9B9288]">
                  {families.length > 0 ? `Đã chọn ${families.length} nhóm` : "Chưa chọn nhóm nào"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {families.length > 0 && (
                <button
                  type="button"
                  onClick={clearFamilies}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#9B9288] transition hover:text-[#AE4A32] ${FOCUS_RING}`}
                >
                  <X size={12} />
                  Xóa hết
                </button>
              )}
              <button
                type="button"
                onClick={() => setFamiliesOpen((v) => !v)}
                aria-expanded={familiesOpen}
                className={`flex items-center gap-1.5 border border-[#DBD3C8] bg-[#F6F2ED] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#6F675E] transition hover:border-[#B7AA9A] ${FOCUS_RING}`}
              >
                {familiesOpen ? "Thu gọn" : "Mở rộng"}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${familiesOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {familiesOpen && (
            <div className="p-6">
              <p className="mb-5 text-xs leading-6 text-[#81786F]">
                Chọn những nhóm mùi hương phù hợp với sở thích — gợi ý sản phẩm sẽ dựa trên lựa chọn
                này.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {pagedFamilyOptions.map((item) => {
                  const selected = families.some((f) => familyId(f) === item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleFamily(item.id)}
                      aria-pressed={selected}
                      className={`group relative flex flex-col items-start gap-2.5 rounded border p-4 text-left transition ${FOCUS_RING} ${
                        selected
                          ? "border-[#8B5F22] bg-[#F7F2E0] shadow-sm"
                          : "border-[#E0D9D0] bg-white hover:border-[#C9B77A] hover:bg-[#FDFAF4]"
                      }`}
                    >
                      {/* Check badge */}
                      {selected && (
                        <span
                          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <Check size={11} strokeWidth={2.5} />
                        </span>
                      )}

                      {/* Icon circle */}
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full transition"
                        style={{
                          background: selected ? item.bg : "#F2EEE8",
                          color: selected ? item.color : "#8A8178",
                        }}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                      </span>

                      <div className="min-w-0">
                        <p
                          className="text-[12px] font-semibold leading-snug"
                          style={{ color: selected ? ACCENT_SOFT_TEXT : "#2D2925" }}
                        >
                          {item.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[#9B9288]">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {familyTotalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFamilyPage((p) => Math.max(0, p - 1))}
                    disabled={familyPage === 0}
                    aria-label="Trang trước"
                    className={`flex h-8 w-8 items-center justify-center border border-[#D3CAC0] bg-white text-[#554E47] transition hover:bg-[#F6F2ED] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[#8A8178]">
                    {familyPage + 1} / {familyTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFamilyPage((p) => Math.min(familyTotalPages - 1, p + 1))}
                    disabled={familyPage >= familyTotalPages - 1}
                    aria-label="Trang sau"
                    className={`flex h-8 w-8 items-center justify-center border border-[#D3CAC0] bg-white text-[#554E47] transition hover:bg-[#F6F2ED] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 3: Notes picker ── */}
        <section className="border border-[#E7E0D7] bg-[#FFFDF9]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E0D7] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2EDDC]">
                <Leaf size={15} strokeWidth={1.5} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#2D2925]">Note hương</h2>
                <p className="text-[10px] text-[#9B9288]">
                  {preferredNotes.length > 0 || dislikedNotes.length > 0
                    ? `${preferredNotes.length} yêu thích · ${dislikedNotes.length} cần tránh`
                    : "Chưa thiết lập note hương"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(preferredNotes.length > 0 || dislikedNotes.length > 0) && (
                <button
                  type="button"
                  onClick={clearNotes}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#9B9288] transition hover:text-[#AE4A32] ${FOCUS_RING}`}
                >
                  <X size={12} />
                  Xóa hết
                </button>
              )}
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                aria-expanded={notesOpen}
                className={`flex items-center gap-1.5 border border-[#DBD3C8] bg-[#F6F2ED] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#6F675E] transition hover:border-[#B7AA9A] ${FOCUS_RING}`}
              >
                {notesOpen ? "Thu gọn" : "Mở rộng"}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {notesOpen && (
            <>
              {/* Search box — helps once the note list gets long */}
              <div className="border-b border-[#E7E0D7] px-6 py-4">
                <div className="relative max-w-sm">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9288]"
                  />
                  <input
                    type="text"
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Tìm note hương (vd. hoa nhài, vani...)"
                    className={`w-full border border-[#DED7CF] bg-white py-2.5 pl-9 pr-8 text-xs text-[#2D2925] placeholder:text-[#B0A89D] transition ${FOCUS_RING}`}
                  />
                  {noteSearch && (
                    <button
                      type="button"
                      onClick={() => setNoteSearch("")}
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#9B9288] hover:text-[#554E47]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {noteSearch && (
                  <p className="mt-2 text-[10px] text-[#9B9288]">
                    {filteredNoteOptions.length > 0
                      ? `Tìm thấy ${filteredNoteOptions.length} note phù hợp`
                      : "Không tìm thấy note nào phù hợp"}
                  </p>
                )}
              </div>

              <div className="grid gap-px bg-[#E7E0D7] xl:grid-cols-2">
                {/* Preferred */}
                <div className="bg-[#FFFDF9] p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Heart size={14} strokeWidth={1.5} style={{ color: ACCENT }} />
                    <p
                      className="text-[9px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: ACCENT }}
                    >
                      Note yêu thích
                    </p>
                    {preferredNotes.length > 0 && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: ACCENT_SOFT_BG, color: ACCENT }}
                      >
                        {preferredNotes.length}
                      </span>
                    )}
                  </div>
                  <div className="flex max-h-56 flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
                    {filteredNoteOptions.length === 0 ? (
                      <p className="text-xs text-[#B0A89D]">Không có note nào để hiển thị.</p>
                    ) : (
                      filteredNoteOptions.map((note) => {
                        const selected = preferredNotes.some(
                          (item) => familyId(item) === familyId(note),
                        );
                        return (
                          <button
                            key={note}
                            type="button"
                            onClick={() => togglePreferredNote(note)}
                            aria-pressed={selected}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition ${FOCUS_RING} ${
                              selected
                                ? "border-[#8B5F22] bg-[#F2EDDC] text-[#5C3D14]"
                                : "border-[#DED7CF] bg-white text-[#625A52] hover:border-[#C9B77A] hover:bg-[#FDFAF4]"
                            }`}
                          >
                            {selected && <Check size={10} strokeWidth={2.5} />}
                            {note}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Disliked */}
                <div className="bg-[#FFFDF9] p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Ban size={14} strokeWidth={1.5} style={{ color: NEGATIVE }} />
                    <p
                      className="text-[9px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: NEGATIVE }}
                    >
                      Note cần tránh
                    </p>
                    {dislikedNotes.length > 0 && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: NEGATIVE_SOFT_BG, color: NEGATIVE }}
                      >
                        {dislikedNotes.length}
                      </span>
                    )}
                  </div>
                  <div className="flex max-h-56 flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
                    {filteredNoteOptions.length === 0 ? (
                      <p className="text-xs text-[#B0A89D]">Không có note nào để hiển thị.</p>
                    ) : (
                      filteredNoteOptions.map((note) => {
                        const selected = dislikedNotes.some(
                          (item) => familyId(item) === familyId(note),
                        );
                        return (
                          <button
                            key={note}
                            type="button"
                            onClick={() => toggleDislikedNote(note)}
                            aria-pressed={selected}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition ${FOCUS_RING} ${
                              selected
                                ? "border-[#AE4A32] bg-[#FBEAE5] text-[#7A3020]"
                                : "border-[#DED7CF] bg-white text-[#625A52] hover:border-[#E0A08E] hover:bg-[#FDF3F1]"
                            }`}
                          >
                            {selected && <Check size={10} strokeWidth={2.5} />}
                            {note}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── SECTION 4: Save ── */}
        <section className="flex flex-col items-start justify-between gap-5 border border-[#E7E0D7] bg-[#FFFDF9] p-7 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2EDDC]">
              <Save size={16} strokeWidth={1.5} style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="font-serif text-xl">Lưu thay đổi</h2>
              <p className="mt-1 text-sm text-[#776F67]">
                {isDirty
                  ? "Bạn có thay đổi chưa lưu. Cập nhật để nhận gợi ý sản phẩm chính xác hơn."
                  : "Cập nhật hồ sơ để nhận gợi ý sản phẩm chính xác hơn."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isDirty && !saving && (
              <button
                type="button"
                onClick={discardChanges}
                className={`flex items-center gap-2 border border-[#DBD3C8] px-4 py-3.5 text-[10px] uppercase tracking-[0.18em] text-[#6F675E] transition hover:border-[#B7AA9A] ${FOCUS_RING}`}
              >
                <RotateCcw size={13} />
                Hủy thay đổi
              </button>
            )}
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving || !isDirty}
              className={`flex items-center justify-center gap-2.5 px-8 py-3.5 text-[10px] uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => {
                if (!saving && isDirty) e.currentTarget.style.backgroundColor = ACCENT_DARK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ACCENT;
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={13} />
                  {isDirty ? "Lưu hồ sơ" : "Đã lưu"}
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Sticky mobile save bar — keeps the primary action reachable without
          scrolling back down on small screens once something has changed. */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E7E0D7] bg-[#FFFDF9]/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#6F675E]">Có thay đổi chưa lưu</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discardChanges}
                aria-label="Hủy thay đổi"
                className={`flex h-9 w-9 items-center justify-center border border-[#DBD3C8] text-[#6F675E] ${FOCUS_RING}`}
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-white disabled:opacity-60 ${FOCUS_RING}`}
                style={{ backgroundColor: ACCENT }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
