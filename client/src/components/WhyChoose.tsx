"use client";

import { useState } from "react";

/* ─────────────────────────────────────────────
   Dữ liệu
───────────────────────────────────────────── */
const reasons = [
  {
    id: 1,
    index: "01",
    tag: "Tay nghề thủ công",
    title: "Chế tác\nthủ công",
    description:
      "Mỗi chai là một tác phẩm. Từng mẻ hương được rót thủ công, chưng cất theo phương pháp truyền thống và hoàn thiện bởi kinh nghiệm của nhiều thế hệ nghệ nhân.",
    detail: "Thành lập 1978 · Paris",
  },
  {
    id: 2,
    index: "02",
    tag: "Nguyên liệu quý",
    title: "Nguyên liệu\nhiếm",
    description:
      "Chúng tôi tìm kiếm những tinh chất đặc biệt trên khắp thế giới, kết hợp nguyên liệu tự nhiên tinh tuyển cùng kỹ thuật hiện đại để tạo nên dấu hương bền lâu.",
    detail: "Hơn 40 vùng nguyên liệu",
  },
  {
    id: 3,
    index: "03",
    tag: "Câu chuyện hương",
    title: "Trải nghiệm\nđược tuyển chọn",
    description:
      "Không chỉ là mùi hương, chúng tôi mang đến một hành trình cá nhân. Cách tuyển chọn giàu tính biên tập giúp bạn tìm được dấu hương đồng điệu với bản sắc riêng.",
    detail: "Tư vấn cá nhân",
  },
  {
    id: 4,
    index: "04",
    tag: "Đạo đức",
    title: "Xa xỉ\ncó trách nhiệm",
    description:
      "Sự sang trọng phải đi cùng trách nhiệm. Nguyên liệu được khai thác có đạo đức, không thử nghiệm trên động vật và tôn trọng hệ sinh thái tạo nên chúng.",
    detail: "Trung hòa carbon từ 2021",
  },
];

/* ─────────────────────────────────────────────
   Mục phụ ở cột phải
───────────────────────────────────────────── */
function SubItem({
  reason,
  active,
  onClick,
}: {
  reason: (typeof reasons)[0];
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        paddingBottom: 28,
        borderBottom: "0.5px solid rgba(115,92,0,0.15)",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "36px 1fr",
        gap: "0 20px",
        alignItems: "start",
      }}
    >
      {/* Index */}
      <span
        style={{
          fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: active ? "#735C00" : "rgba(115,92,0,0.4)",
          fontWeight: 500,
          paddingTop: 3,
          transition: "color 0.3s ease",
        }}
      >
        {reason.index}
      </span>

      <div>
        {/* Tag */}
        <p
          style={{
            fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: active ? "#735C00" : "#B0A898",
            fontWeight: 500,
            marginBottom: 6,
            transition: "color 0.3s ease",
          }}
        >
          {reason.tag}
        </p>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
            fontSize: 17,
            fontWeight: 300,
            color: active ? "#1D1C19" : "#5A554F",
            lineHeight: 1.25,
            transition: "color 0.3s ease",
            whiteSpace: "pre-line",
          }}
        >
          {reason.title}
        </h3>

        {/* Expand line */}
        <div
          style={{
            height: "0.5px",
            background: "#735C00",
            marginTop: 14,
            transformOrigin: "left",
            transform: active || hovered ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   Component chính
───────────────────────────────────────────── */
export default function WhyChooseUs() {
  const [active, setActive] = useState(0);
  const featured = reasons[active];

  return (
    <section
      className="why-choose-section"
      style={{
        background: "#FCF9F4",
        padding: "64px 32px 96px",
        fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 64,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#735C00",
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              Chuẩn mực tuyển chọn
            </p>
            <h2
              style={{
                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 300,
                color: "#1D1C19",
                lineHeight: 1.1,
              }}
            >
              Vì sao <em style={{ fontStyle: "italic" }}>chọn</em> chúng tôi
            </h2>
          </div>

          {/* Counter */}
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "#B0A898",
              fontWeight: 500,
            }}
          >
            {String(active + 1).padStart(2, "0")} — {String(reasons.length).padStart(2, "0")}
          </p>
        </div>

        {/* ── Body: asymmetric layout ── */}
        <div
          className="why-choose-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: "0 80px",
            alignItems: "start",
          }}
        >
          {/* Bên trái — nội dung nổi bật */}
          <div
            style={{
              borderTop: "0.5px solid rgba(115,92,0,0.25)",
              paddingTop: 40,
            }}
          >
            {/* Nhãn */}
            <p
              key={`tag-${active}`}
              style={{
                fontSize: 9.5,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#735C00",
                fontWeight: 500,
                marginBottom: 24,
                animation: "fadeUp 0.6s ease both",
              }}
            >
              {featured.tag}
            </p>

            {/* Tiêu đề */}
            <h3
              key={`title-${active}`}
              style={{
                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 300,
                color: "#1D1C19",
                lineHeight: 1.1,
                marginBottom: 36,
                whiteSpace: "pre-line",
                animation: "fadeUp 0.65s ease 0.05s both",
              }}
            >
              {featured.title}
            </h3>

            {/* Mô tả */}
            <p
              key={`desc-${active}`}
              style={{
                fontSize: 14,
                lineHeight: 1.85,
                color: "#7D7870",
                maxWidth: 520,
                marginBottom: 40,
                animation: "fadeUp 0.7s ease 0.1s both",
              }}
            >
              {featured.description}
            </p>

            {/* Chi tiết */}
            <div
              key={`detail-${active}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                animation: "fadeUp 0.75s ease 0.15s both",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: "0.5px",
                  background: "#735C00",
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#735C00",
                  fontWeight: 500,
                }}
              >
                {featured.detail}
              </span>
            </div>
          </div>

          {/* Bên phải — danh sách phụ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {reasons.map((r, i) => (
              <SubItem key={r.id} reason={r} active={i === active} onClick={() => setActive(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* Hiệu ứng */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .why-choose-section { padding: 48px 24px 72px !important; }
          .why-choose-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 56px 0 !important; }
        }
        @media (max-width: 480px) {
          .why-choose-section { padding: 42px 20px 60px !important; }
        }
      `}</style>
    </section>
  );
}
