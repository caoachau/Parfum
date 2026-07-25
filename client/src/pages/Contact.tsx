"use client";
import { useSeo } from "../hooks/useSeo";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";

const SUBJECTS = [
  "Tư vấn riêng",
  "Hỏi về sản phẩm",
  "Hỗ trợ đơn hàng",
  "Báo chí và biên tập",
  "Khác",
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  useSeo({
    title: "Liên hệ",
    description:
      "Liên hệ với L'Essence Noire để được tư vấn mùi hương, hỗ trợ đơn hàng và hợp tác.",
  });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [sending, setSending] = useState(false);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSend = async () => {
    if (!form.firstName || !form.email || !form.message) {
      setToast({ text: "Vui lòng nhập tên, email và tin nhắn để tiếp tục.", type: "error" });
      return;
    }
    try {
      setSending(true);
      await api.post("/support", {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim(),
        subject: form.subject || "Khác",
        message: form.message.trim(),
      });
      setToast({ text: "Đã gửi tin nhắn. Chúng tôi sẽ phản hồi sớm.", type: "success" });
      setForm(EMPTY);
    } catch (error: any) {
      setToast({
        text: error?.response?.data?.message || "Hiện chưa thể gửi tin nhắn của bạn.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY);
    setToast(null);
  };

  return (
    <>
      <main
        className="min-h-screen"
        style={{
          background: "#FDF9F4",
          color: "#1a1a18",
          fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* ── Hero strip ── */}
          <div
            className="contact-hero-grid grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "0.5px solid rgba(26,26,24,0.14)",
            }}
          >
            {/* Left */}
            <div
              className="contact-hero-copy flex flex-col justify-end"
              style={{ padding: "64px 48px 52px" }}
            >
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#735C00",
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                Liên hệ cửa hàng
              </p>
              <h1
                style={{
                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                  fontSize: 52,
                  fontWeight: 300,
                  lineHeight: 1.1,
                  marginBottom: 18,
                }}
              >
                Bắt đầu một
                <br />
                <em style={{ fontStyle: "italic" }}>cuộc trò chuyện</em>
              </h1>
              <p style={{ fontSize: 13, color: "#6b6b65", lineHeight: 1.8, maxWidth: 280 }}>
                Dù bạn cần hỏi về nguồn gốc sản phẩm, tư vấn riêng hay chỉ muốn gửi lời nhắn, chúng
                tôi đều trân trọng đọc từng dòng.
              </p>
            </div>

            {/* Right — video quote panel */}
            <div
              className="contact-quote flex flex-col justify-end"
              style={{ position: "relative", minHeight: 260, overflow: "hidden" }}
            >
              {/* Video background */}

              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 0,
                }}
              >
                <source
                  src="https://res.cloudinary.com/dwj2trmn0/video/upload/v1784437000/Video_Project_4_fmziee.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Dark overlay để chữ dễ đọc */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(26, 26, 24, 0.62)",
                  zIndex: 1,
                }}
              />

              {/* Text content — chồng lên video */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  padding: "32px 36px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 8,
                  }}
                >
                  Góc nhìn biên tập
                </p>
                <blockquote
                  className="break-words"
                  style={{
                    fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.68)",
                    lineHeight: 1.75,
                    borderLeft: "1.5px solid #A8893A",
                    paddingLeft: 14,
                  }}
                >
                  "Một mùi hương không được chọn vội, nó tự bộc lộ qua cuộc trò chuyện."
                </blockquote>
              </div>
            </div>
          </div>
          {/* ── Body: info + form ── */}
          <div
            className="contact-body-grid grid"
            style={{
              gridTemplateColumns: "1fr 1.4fr",
              borderBottom: "0.5px solid rgba(26,26,24,0.14)",
            }}
          >
            {/* Info column */}
            <div
              className="contact-info"
              style={{
                padding: "48px 40px",
                borderRight: "0.5px solid rgba(26,26,24,0.14)",
              }}
            >
              {[
                {
                  icon: (
                    <MapPin size={16} color="#735C00" style={{ marginTop: 2, flexShrink: 0 }} />
                  ),
                  label: "Địa chỉ",
                  content: (
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=W8FW%2B9J%20Hoa%20Thuan%2C%20Tra%20Vinh%2C%20Vietnam"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Mở vị trí cửa hàng L'Essence Noire Trà Vinh trên Google Maps"
                      style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "#1a1a18",
                        textDecoration: "none",
                      }}
                    >
                      W8FW+9J, Hòa Thuận
                      <br />
                      Trà Vinh, Việt Nam
                    </a>
                  ),
                },
                {
                  icon: <Phone size={16} color="#735C00" style={{ marginTop: 2, flexShrink: 0 }} />,
                  label: "Điện thoại",
                  content: (
                    <a
                      href="tel:+84328779845"
                      aria-label="Gọi L'Essence Noire qua số 0328 779 845"
                      style={{
                        fontSize: 13,
                        color: "#1a1a18",
                        textDecoration: "none",
                        borderBottom: "0.5px solid rgba(26,26,24,0.2)",
                      }}
                    >
                      (+84) 328 779 845
                    </a>
                  ),
                },
                {
                  icon: <Mail size={16} color="#735C00" style={{ marginTop: 2, flexShrink: 0 }} />,
                  label: "Thư từ",
                  content: (
                    <a
                      href="mailto:tranvungochuynh136@gmail.com?subject=Li%C3%AAn%20h%E1%BB%87%20L%27Essence%20Noire"
                      aria-label="Soạn email gửi L'Essence Noire"
                      className="break-all"
                      style={{
                        fontSize: 13,
                        color: "#1a1a18",
                        textDecoration: "none",
                        borderBottom: "0.5px solid rgba(26,26,24,0.2)",
                      }}
                    >
                      tranvungochuynh136@gmail.com
                    </a>
                  ),
                },
                {
                  icon: <Clock size={16} color="#735C00" style={{ marginTop: 2, flexShrink: 0 }} />,
                  label: "Giờ làm việc",
                  content: (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "3px 16px",
                      }}
                    >
                      {[
                        ["Thứ 2 - Thứ 6", "10:00 - 19:00"],
                        ["Thứ 7", "11:00 - 18:00"],
                        ["Chủ nhật", "Theo lịch hẹn"],
                      ].map(([day, time]) => (
                        <>
                          <span style={{ fontSize: 12, color: "#1a1a18" }}>{day}</span>
                          <span style={{ fontSize: 12, color: "#6b6b65" }}>{time}</span>
                        </>
                      ))}
                    </div>
                  ),
                },
              ].map(({ icon, label, content }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "20px 0",
                    borderBottom: i < 3 ? "0.5px solid rgba(26,26,24,0.1)" : undefined,
                  }}
                >
                  {icon}
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                        color: "#6b6b65",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </p>
                    {content}
                  </div>
                </div>
              ))}
            </div>

            {/* Form column */}
            <div className="contact-form" style={{ padding: "48px 48px" }}>
              <h2
                style={{
                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                  fontSize: 26,
                  fontWeight: 300,
                  marginBottom: 6,
                }}
              >
                Gửi lời nhắn
              </h2>
              <p style={{ fontSize: 12.5, color: "#6b6b65", marginBottom: 32, lineHeight: 1.7 }}>
                Chúng tôi phản hồi trong một ngày làm việc. Với yêu cầu khẩn cấp, vui lòng gọi điện
                trực tiếp.
              </p>

              <div
                className="contact-name-grid"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}
              >
                <Field label="Tên">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Ngọc"
                  />
                </Field>
                <Field label="Họ">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Huỳnh"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Chủ đề">
                <select value={form.subject} onChange={set("subject")}>
                  <option value="" disabled>
                    Chọn chủ đề
                  </option>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Tin nhắn">
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Hãy cho chúng tôi biết điều bạn đang cần..."
                />
              </Field>

              <div
                className="contact-actions"
                style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28 }}
              >
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    background: "#1a1a18",
                    color: "#fff",
                    border: "none",
                    fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    padding: "13px 28px",
                    cursor: "pointer",
                  }}
                >
                  {sending ? "Đang gửi..." : "Gửi tin nhắn"}
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    background: "transparent",
                    border: "0.5px solid rgba(26,26,24,0.2)",
                    color: "#6b6b65",
                    fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 400,
                    padding: "13px 20px",
                    cursor: "pointer",
                  }}
                >
                  Xóa nội dung
                </button>
              </div>

              {toast && (
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: toast.type === "success" ? "#735C00" : "#993C1D",
                    borderLeft: `2px solid ${toast.type === "success" ? "#735C00" : "#993C1D"}`,
                    paddingLeft: 10,
                    letterSpacing: "0.03em",
                  }}
                >
                  {toast.text}
                </p>
              )}
            </div>
          </div>{" "}
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── Field wrapper ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "#6b6b65",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <style>{`
        .lne-field input,
        .lne-field select,
        .lne-field textarea {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 0.5px solid rgba(26,26,24,0.18);
          outline: none;
          font-family: 'Be Vietnam Pro', 'Manrope', sans-serif;
          font-size: 13px;
          color: #1a1a18;
          padding: 8px 0;
          transition: border-color 0.2s;
          appearance: none;
        }
        .lne-field input:focus,
        .lne-field select:focus,
        .lne-field textarea:focus {
          border-bottom-color: #735C00;
        }
        .lne-field input::placeholder,
        .lne-field textarea::placeholder {
          color: rgba(107,107,101,0.45);
          font-size: 12px;
        }
        .lne-field textarea { resize: none; line-height: 1.7; }
      `}</style>
      <div className="lne-field">{children}</div>
    </div>
  );
}
