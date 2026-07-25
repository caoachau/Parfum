import { useEffect, useMemo, useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  Star,
  MapPin,
  Lock,
  ShoppingBag,
  LogOut,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../store/auth.store";
import { useCart } from "../store/cart.store";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";

const c = {
  pageBg: "#FDF9F4",
  gold: "#735C00",
  ink: "#1C1C19",
  body: "#5F5E5E",
  cardBg: "#F7F3EE",
  border: "#E3D9C6",
};

type SectionKey =
  "profile" | "orders" | "wishlist" | "reviews" | "scent" | "addresses" | "password";

type MenuItem = {
  key: SectionKey;
  label: string;
  icon: JSX.Element;
  ready: boolean;
};

const menu: MenuItem[] = [
  {
    key: "profile",
    label: "Thông tin tài khoản",
    icon: <User size={17} />,
    ready: true,
  },
  {
    key: "orders",
    label: "Đơn hàng của tôi",
    icon: <Package size={17} />,
    ready: true,
  },
  {
    key: "wishlist",
    label: "Danh sách yêu thích",
    icon: <Heart size={17} />,
    ready: false,
  },
  {
    key: "reviews",
    label: "Đánh giá của tôi",
    icon: <Star size={17} />,
    ready: false,
  },
  {
    key: "scent",
    label: "Hồ sơ mùi hương",
    icon: <Sparkles size={17} />,
    ready: true,
  },
  {
    key: "addresses",
    label: "Sổ địa chỉ",
    icon: <MapPin size={17} />,
    ready: false,
  },
  {
    key: "password",
    label: "Đổi mật khẩu",
    icon: <Lock size={17} />,
    ready: false,
  },
];

const sLabel: Record<SectionKey, string> = {
  profile: "Thông tin tài khoản",
  orders: "Đơn hàng của tôi",
  wishlist: "Danh sách yêu thích",
  reviews: "Đánh giá của tôi",
  scent: "Hồ sơ mùi hương",
  addresses: "Sổ địa chỉ",
  password: "Đổi mật khẩu",
};

const sDesc: Record<Exclude<SectionKey, "profile" | "scent">, string> = {
  orders:
    "Lịch sử đơn hàng sẽ hiển thị ở đây sau khi hoàn thiện API tạo & tra cứu đơn hàng (hiện mới có bước chuẩn bị thanh toán / kiểm tồn kho).",
  wishlist:
    "Nơi lưu các sản phẩm bạn yêu thích. Dữ liệu yêu thích đã có trong cơ sở dữ liệu, phần API và giao diện đang được phát triển.",
  reviews: "Quản lý các đánh giá & bình luận sản phẩm của bạn. Tính năng đang được phát triển.",
  addresses:
    "Thêm và quản lý địa chỉ giao hàng. Trường địa chỉ đã có trong hồ sơ người dùng, phần quản lý đang được phát triển.",
  password:
    "Tính năng đổi mật khẩu đang được phát triển. Sẽ yêu cầu mật khẩu hiện tại và mật khẩu mới.",
};

type ProductListItem = {
  id: string;
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
};

type ProductListResponse = {
  data: ProductListItem[];
};

const pageStyle: CSSProperties = {
  background: c.pageBg,
  minHeight: "100vh",
  padding: "40px 16px",
};
const containerStyle: CSSProperties = { maxWidth: 1100, margin: "0 auto" };
const titleWrapStyle: CSSProperties = { marginBottom: 28 };
const h1Style: CSSProperties = {
  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
  fontSize: 30,
  color: c.ink,
  margin: 0,
};
const subtitleStyle: CSSProperties = {
  color: c.body,
  marginTop: 6,
  fontSize: 15,
};
const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: 24,
  alignItems: "start",
};
const sidebarStyle: CSSProperties = {
  background: c.cardBg,
  border: `1px solid ${c.border}`,
  borderRadius: 14,
  padding: 18,
};
const userRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "6px 6px 16px",
};
const avatarStyle: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: c.gold,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
  flexShrink: 0,
};
const userNameStyle: CSSProperties = {
  fontWeight: 600,
  color: c.ink,
  fontSize: 15,
};
const userRoleStyle: CSSProperties = {
  fontSize: 12,
  color: c.gold,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginTop: 2,
};
const dividerStyle: CSSProperties = {
  height: 1,
  background: c.border,
  margin: "8px 0 12px",
};
const navWrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const navLabelStyle: CSSProperties = { flex: 1, textAlign: "left" };
const comingBadgeStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: c.gold,
  border: `1px solid ${c.gold}`,
  borderRadius: 999,
  padding: "2px 8px",
};
const cartCountStyle: CSSProperties = {
  background: c.ink,
  color: "#fff",
  fontSize: 11,
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 6px",
};
const logoutStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  border: `1px solid ${c.border}`,
  background: "#fff",
  color: "#a11",
  borderRadius: 10,
  padding: "11px 12px",
  cursor: "pointer",
  fontSize: 14,
};
const contentStyle: CSSProperties = {
  background: "#fff",
  border: `1px solid ${c.border}`,
  borderRadius: 14,
  padding: 28,
  minHeight: 440,
};
const sectionH2Style: CSSProperties = {
  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
  fontSize: 22,
  color: c.ink,
  marginTop: 0,
  marginBottom: 20,
};
const fieldGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};
const fieldLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: c.body,
  marginBottom: 6,
};
const fieldValueStyle: CSSProperties = {
  border: `1px solid ${c.border}`,
  borderRadius: 8,
  padding: "12px 14px",
  color: c.ink,
  background: c.pageBg,
  wordBreak: "break-all",
};
const csBoxStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "56px 24px",
  border: `1px dashed ${c.border}`,
  borderRadius: 12,
  background: c.pageBg,
};
const csIconStyle: CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: c.cardBg,
  color: c.gold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
};
const csTitleStyle: CSSProperties = {
  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
  fontSize: 20,
  color: c.ink,
  margin: 0,
};
const csDescStyle: CSSProperties = {
  color: c.body,
  fontSize: 14,
  maxWidth: 440,
  marginTop: 8,
  lineHeight: 1.6,
};
const csBadgeStyle: CSSProperties = {
  marginTop: 18,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: c.gold,
  border: `1px solid ${c.gold}`,
  borderRadius: 999,
  padding: "6px 14px",
};
const profileComingWrapStyle: CSSProperties = { marginTop: 24 };
const scentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};
const noteBoxStyle: CSSProperties = {
  border: `1px solid ${c.border}`,
  borderRadius: 12,
  background: c.pageBg,
  padding: 16,
};
const noteBoxTitleStyle: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: c.gold,
  marginBottom: 12,
  fontWeight: 700,
};
const noteChipWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  maxHeight: 230,
  overflowY: "auto",
};
const noteHelperStyle: CSSProperties = {
  color: c.body,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: -6,
  marginBottom: 18,
};

const noteChipStyle = (active: boolean, disabled: boolean): CSSProperties => ({
  border: `1px solid ${active ? c.gold : c.border}`,
  background: active ? c.gold : "#fff",
  color: active ? "#fff" : c.ink,
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.38 : 1,
});

const navBtn = (isActive: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  border: "1px solid transparent",
  background: isActive ? "#fff" : "transparent",
  borderColor: isActive ? c.border : "transparent",
  color: isActive ? c.ink : c.body,
  borderRadius: 10,
  padding: "11px 12px",
  cursor: "pointer",
  fontSize: 14,
  textAlign: "left",
});

function ComingSoon(props: { title: string; desc: string }) {
  return (
    <div style={csBoxStyle}>
      <div style={csIconStyle}>
        <Clock size={26} />
      </div>
      <h3 style={csTitleStyle}>{props.title}</h3>
      <p style={csDescStyle}>{props.desc}</p>
      <span style={csBadgeStyle}>Tính năng đang phát triển</span>
    </div>
  );
}

function Field(props: { label: string; value: string }) {
  return (
    <div>
      <div style={fieldLabelStyle}>{props.label}</div>
      <div style={fieldValueStyle}>{props.value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState<SectionKey>("profile");
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const cartCount = useCart((s) => s.count);
  const navigate = useNavigate();
  const storageKey = `scent-profile:${user?.id || "guest"}`;
  const [availableNotes, setAvailableNotes] = useState<string[]>([]);
  const [likedNotes, setLikedNotes] = useState<string[]>([]);
  const [dislikedNotes, setDislikedNotes] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    api
      .get<ProductListResponse>("/products", {
        params: { page: 1, limit: 100 },
      })
      .then(({ data }) => {
        if (!mounted) return;

        const notes = data.data.flatMap((product) => [
          ...(product.notes?.top || []),
          ...(product.notes?.middle || []),
          ...(product.notes?.base || []),
        ]);

        setAvailableNotes(Array.from(new Set(notes.filter(Boolean))).sort());
      })
      .catch(() => {
        if (mounted) setAvailableNotes([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      setLikedNotes([]);
      setDislikedNotes([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        likedNotes?: string[];
        dislikedNotes?: string[];
      };

      setLikedNotes(Array.isArray(parsed.likedNotes) ? parsed.likedNotes : []);
      setDislikedNotes(Array.isArray(parsed.dislikedNotes) ? parsed.dislikedNotes : []);
    } catch {
      setLikedNotes([]);
      setDislikedNotes([]);
    }
  }, [storageKey]);

  const saveScentProfile = (nextLiked: string[], nextDisliked: string[]) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ likedNotes: nextLiked, dislikedNotes: nextDisliked }),
    );
  };

  const toggleLikedNote = (note: string) => {
    if (dislikedNotes.includes(note)) {
      toast.error("Nốt hương đã nằm trong danh sách không thích");
      return;
    }

    const nextLiked = likedNotes.includes(note)
      ? likedNotes.filter((item) => item !== note)
      : [...likedNotes, note];

    setLikedNotes(nextLiked);
    saveScentProfile(nextLiked, dislikedNotes);
  };

  const toggleDislikedNote = (note: string) => {
    if (likedNotes.includes(note)) {
      toast.error("Nốt hương đã nằm trong danh sách yêu thích");
      return;
    }

    const nextDisliked = dislikedNotes.includes(note)
      ? dislikedNotes.filter((item) => item !== note)
      : [...dislikedNotes, note];

    setDislikedNotes(nextDisliked);
    saveScentProfile(likedNotes, nextDisliked);
  };

  const suggestedLink = useMemo(() => {
    const firstLiked = likedNotes[0];
    return firstLiked ? `/shop?search=${encodeURIComponent(firstLiked)}` : "/shop";
  }, [likedNotes]);

  function handleLogout() {
    logout();
    useCart.getState().clear(); // reset badge giỏ trên Header
    navigate("/");
  }

  const initial = (user?.name || "U").trim().charAt(0).toUpperCase();
  const roleText = user?.role === "admin" ? "Quản trị viên" : "Khách hàng";

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={titleWrapStyle}>
          <h1 style={h1Style}>Trang tài khoản</h1>
          <p style={subtitleStyle}>Xin chào, {user?.name || "bạn"}</p>
        </div>

        <div style={gridStyle}>
          <aside style={sidebarStyle}>
            <div style={userRowStyle}>
              <div style={avatarStyle}>{initial}</div>
              <div>
                <div style={userNameStyle}>{user?.name || "Người dùng"}</div>
                <div style={userRoleStyle}>{roleText}</div>
              </div>
            </div>

            <div style={dividerStyle} />

            <nav style={navWrapStyle}>
              {menu.map((m) => (
                <button
                  key={m.key}
                  onClick={() => (m.key === "orders" ? navigate("/orders") : setActive(m.key))}
                  style={navBtn(active === m.key)}
                >
                  {m.icon}
                  <span style={navLabelStyle}>{m.label}</span>
                  {!m.ready && <span style={comingBadgeStyle}>Sắp có</span>}
                </button>
              ))}

              <button onClick={() => navigate("/cart")} style={navBtn(false)}>
                <ShoppingBag size={17} />
                <span style={navLabelStyle}>Giỏ hàng</span>
                {cartCount > 0 && <span style={cartCountStyle}>{cartCount}</span>}
              </button>
            </nav>

            <div style={dividerStyle} />

            <button onClick={handleLogout} style={logoutStyle}>
              <LogOut size={17} />
              <span style={navLabelStyle}>Đăng xuất</span>
            </button>
          </aside>

          <section style={contentStyle}>
            {active === "profile" && (
              <div>
                <h2 style={sectionH2Style}>Thông tin tài khoản</h2>
                <div style={fieldGridStyle}>
                  <Field label="Họ và tên" value={user?.name || "-"} />
                  <Field label="Email" value={user?.email || "-"} />
                  <Field label="Vai trò" value={roleText} />
                  <Field label="Mã người dùng" value={user?.id || "-"} />
                </div>
                <div style={profileComingWrapStyle}>
                  <ComingSoon
                    title="Chỉnh sửa hồ sơ"
                    desc="Tính năng cập nhật tên, ảnh đại diện và thông tin cá nhân đang được phát triển. Hiện thông tin lấy trực tiếp từ tài khoản đã đăng nhập."
                  />
                </div>
              </div>
            )}

            {active === "scent" && (
              <div>
                <h2 style={sectionH2Style}>Hồ sơ mùi hương</h2>
                <p style={noteHelperStyle}>
                  Chọn nốt hương bạn yêu thích và không thích. Danh sách này được lấy từ notes của
                  sản phẩm trong MongoDB.
                </p>

                <div style={scentGridStyle}>
                  <div style={noteBoxStyle}>
                    <div style={noteBoxTitleStyle}>Nốt hương yêu thích</div>
                    <div style={noteChipWrapStyle}>
                      {availableNotes.length === 0 && (
                        <p style={csDescStyle}>Chưa có notes trong sản phẩm.</p>
                      )}

                      {availableNotes.map((note) => {
                        const activeNote = likedNotes.includes(note);
                        const disabled = dislikedNotes.includes(note);

                        return (
                          <button
                            key={note}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleLikedNote(note)}
                            style={noteChipStyle(activeNote, disabled)}
                          >
                            {note}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={noteBoxStyle}>
                    <div style={noteBoxTitleStyle}>Nốt hương không thích</div>
                    <div style={noteChipWrapStyle}>
                      {availableNotes.length === 0 && (
                        <p style={csDescStyle}>Chưa có notes trong sản phẩm.</p>
                      )}

                      {availableNotes.map((note) => {
                        const activeNote = dislikedNotes.includes(note);
                        const disabled = likedNotes.includes(note);

                        return (
                          <button
                            key={note}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleDislikedNote(note)}
                            style={noteChipStyle(activeNote, disabled)}
                          >
                            {note}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(suggestedLink)}
                  style={{
                    ...logoutStyle,
                    justifyContent: "center",
                    color: "#fff",
                    background: c.gold,
                    borderColor: c.gold,
                    marginTop: 18,
                    maxWidth: 280,
                  }}
                >
                  Khám phá sản phẩm phù hợp
                </button>
              </div>
            )}

            {active !== "profile" && active !== "scent" && (
              <div>
                <h2 style={sectionH2Style}>{sLabel[active]}</h2>
                <ComingSoon title={sLabel[active]} desc={sDesc[active]} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
