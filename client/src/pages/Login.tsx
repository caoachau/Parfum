import React, { useState, CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../store/auth.store";
import { useCart } from "../store/cart.store";
import Footer from "../components/Footer";

const color = {
  pageBg: "#FDF9F4",
  gold: "#735C00",
  inputBorder: "#D0C5AF",
  ink: "#1C1C19",
  body: "#5F5E5E",
  formBg: "#F7F3EE",
  formBorder: "rgba(208,197,175,0.1)",
  divider: "rgba(208,197,175,0.3)",
};

const font = {
  serif: "'Noto Serif', 'Noto Serif Display', serif",
  sans: "'Be Vietnam Pro', 'Manrope', sans-serif",
};

const IconSparkles = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path d="M12 3v4M12 17v4M4 12h4M16 12h4" strokeLinecap="round" />
    <path d="M7 7l1.5 1.5M17 17l-1.5-1.5M7 17l1.5-1.5M17 7l-1.5 1.5" strokeLinecap="round" />
  </svg>
);
const IconScroll = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path
      d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6 4a2 2 0 0 0-2 2v1h4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6" strokeLinecap="round" />
  </svg>
);
const IconTicket = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path
      d="M3 9a2 2 0 0 0 0 4v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 6v12" strokeDasharray="2 2" />
  </svg>
);

const fieldLabelStyle: CSSProperties = {
  fontFamily: font.sans,
  fontWeight: 400,
  fontSize: 10,
  lineHeight: "15px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: color.body,
};

const fieldInputStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderBottom: `1px solid ${color.inputBorder}`,
  background: "transparent",
  padding: "13px 0",
  fontFamily: font.sans,
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "22px",
  color: color.ink,
  boxSizing: "border-box",
  outline: "none",
};

type FeatureItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const features: FeatureItem[] = [
  {
    icon: <IconSparkles style={{ width: 20, height: 20 }} />,
    title: "Tuyển chọn riêng",
    description: "Hồ sơ mùi hương cá nhân được gợi ý bởi chuyên gia của chúng tôi.",
  },
  {
    icon: <IconScroll style={{ width: 19, height: 15 }} />,
    title: "Bản thảo mùi hương",
    description: "Ưu tiên xem trước các bộ sưu tập giới hạn và câu chuyện biên tập mới.",
  },
  {
    icon: <IconTicket style={{ width: 19, height: 15 }} />,
    title: "Sự kiện riêng",
    description: "Nhận lời mời tới những buổi ra mắt mùi hương độc quyền.",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useAuth((s) => s.setUser);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      useAuth.getState().setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      try {
        await useCart.getState().syncOnLogin();
      } catch {
        // Không xóa guest_cart nếu merge lỗi; lần đăng nhập sau có thể thử lại.
        await useCart
          .getState()
          .loadCart()
          .catch(() => null);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: color.pageBg }}>
      <section
        style={{
          position: "relative",
          background: color.pageBg,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1152,
            margin: "0 auto",
            padding: "131px 24px 96px",
            display: "flex",
            flexWrap: "wrap",
            gap: 64,
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ maxWidth: 496, width: "100%" }}>
            <p
              style={{
                fontFamily: font.sans,
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: "3.6px",
                textTransform: "uppercase",
                color: color.gold,
                margin: 0,
              }}
            >
              L'Essence Noire
            </p>

            <h1
              style={{
                fontFamily: font.serif,
                fontWeight: 400,
                fontSize: 54,
                lineHeight: "60px",
                color: color.ink,
                margin: "23px 0 0",
              }}
            >
              Bắt đầu hành trình
              <br />
              chinh phục mùi hương của bạn
            </h1>

            <div style={{ maxWidth: 448, marginTop: 24 }}>
              <p
                style={{
                  fontFamily: font.sans,
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: "29px",
                  color: color.body,
                  margin: 0,
                }}
              >
                Tham gia cộng đồng yêu hương tinh tuyển và nhận những gợi ý chuyên sâu về thế giới
                nước hoa cao cấp.
              </p>
            </div>

            <ul
              style={{
                listStyle: "none",
                margin: "48px 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 32,
              }}
            >
              {features.map((f) => (
                <li key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      background: "#F1EDE8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: color.gold,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <h3
                      style={{
                        fontFamily: font.serif,
                        fontWeight: 400,
                        fontSize: 20,
                        lineHeight: "28px",
                        color: color.ink,
                        margin: 0,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: font.sans,
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: "19px",
                        color: "rgba(95,94,94,0.8)",
                        margin: 0,
                        maxWidth: 420,
                      }}
                    >
                      {f.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 544,
              background: color.formBg,
              border: `1px solid ${color.formBorder}`,
              boxShadow: "0px 40px 80px -20px rgba(28,28,25,0.04)",
              padding: "64px 64px 80px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                fontFamily: font.serif,
                fontWeight: 400,
                fontSize: 30,
                lineHeight: "36px",
                color: color.ink,
                margin: 0,
              }}
            >
              Chào mừng trở lại
            </h2>
            <p
              style={{
                fontFamily: font.sans,
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: color.body,
                margin: "8px 0 0",
              }}
            >
              Nhập thông tin tài khoản của bạn
            </p>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginTop: 16,
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              style={{
                marginTop: 48,
                display: "flex",
                flexDirection: "column",
                gap: 40,
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={fieldLabelStyle}>Địa chỉ email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="curator@lessencenoire.com"
                  style={fieldInputStyle}
                  required
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={fieldLabelStyle}>Mật khẩu</span>
                  <Link
                    to="/forgot-password"
                    style={{
                      ...fieldLabelStyle,
                      textDecoration: "none",
                      color: color.gold,
                    }}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={fieldInputStyle}
                  required
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    background: "#FFFFFF",
                    border: `1px solid ${color.inputBorder}`,
                    accentColor: color.gold,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: font.sans,
                    fontSize: 12,
                    lineHeight: "16px",
                    color: color.body,
                  }}
                >
                  Duy trì đăng nhập
                </span>
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  marginTop: 24,
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: color.gold,
                    border: 0,
                    padding: "20px 32px",
                    fontFamily: font.sans,
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "16px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "#FFFFFF",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ flex: 1, height: 1, background: color.divider }} />
                  <span
                    style={{
                      fontFamily: font.sans,
                      fontSize: 10,
                      lineHeight: "15px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "rgba(95,94,94,0.4)",
                    }}
                  >
                    Hoặc
                  </span>
                  <span style={{ flex: 1, height: 1, background: color.divider }} />
                </div>

                <Link
                  to="/register"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(115,92,0,0.4)",
                    padding: "20px 32px",
                    fontFamily: font.sans,
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "16px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: color.gold,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Đăng ký thành viên
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
