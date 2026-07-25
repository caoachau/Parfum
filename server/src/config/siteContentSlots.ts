// =============================================================================
//  SITE CONTENT SLOTS — danh sach TAT CA vi tri anh co the tuy chinh tren web.
//  Moi slot:
//    - key: dinh danh duy nhat (frontend dung key nay de lay anh)
//    - label: ten hien thi trong admin
//    - group: nhom theo trang (de admin de tim)
//    - defaultUrl: anh mac dinh (trung voi anh dang hard-code trong code)
//  Khi admin doi anh -> luu vao DB (model SiteContent). Chua doi -> dung default.
// =============================================================================
export type SiteContentSlot = {
  key: string;
  label: string;
  group: string;
  defaultUrl: string;
};

export const SITE_CONTENT_SLOTS: SiteContentSlot[] = [
  // ------------------------------------------------------------- Trang chu --
  {
    key: 'home_hero',
    label: 'Trang chủ — ảnh Hero (banner lớn đầu trang)',
    group: 'Trang chủ',
    defaultUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f',
  },
  {
    key: 'home_banner',
    label: 'Trang chủ — ảnh Banner bộ sưu tập',
    group: 'Trang chủ',
    defaultUrl: 'https://images.unsplash.com/photo-1595425964071-9e6d1d6c1f0f?w=1600',
  },

  // ------------------------------------------------------------- Gioi thieu --
  {
    key: 'about_hero',
    label: 'Giới thiệu — ảnh Hero',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/about-hero.jpg',
  },
  {
    key: 'about_heritage_lab',
    label: 'Giới thiệu — Di sản (phòng lab)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/heritage-lab.jpg',
  },
  {
    key: 'about_heritage_hands',
    label: 'Giới thiệu — Di sản (bàn tay & hoa)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/heritage-hands.jpg',
  },
  {
    key: 'about_perfumer',
    label: 'Giới thiệu — Nghệ nhân nước hoa',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/perfumer.jpg',
  },
  {
    key: 'about_sustainable_drop',
    label: 'Giới thiệu — Bền vững (giọt nước hoa)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/sustainable-drop.jpg',
  },
  {
    key: 'about_sustainable_white',
    label: 'Giới thiệu — Bền vững (nền trắng)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/sustainable-white.jpg',
  },
  {
    key: 'about_sustainable_field',
    label: 'Giới thiệu — Bền vững (cánh đồng)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/sustainable-field.jpg',
  },
  {
    key: 'about_ing_jasmine',
    label: 'Giới thiệu — Nguyên liệu: Nhài',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/jasmine.jpg',
  },
  {
    key: 'about_ing_oud',
    label: 'Giới thiệu — Nguyên liệu: Trầm (Oud)',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/oud-resin.jpg',
  },
  {
    key: 'about_ing_baies',
    label: 'Giới thiệu — Nguyên liệu: Tiêu hồng',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/baies-roses.jpg',
  },
  {
    key: 'about_ing_vetiver1',
    label: 'Giới thiệu — Nguyên liệu: Vetiver 1',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/vetiver-1.jpg',
  },
  {
    key: 'about_ing_vetiver2',
    label: 'Giới thiệu — Nguyên liệu: Vetiver 2',
    group: 'Giới thiệu',
    defaultUrl: '/images/about/vetiver-2.jpg',
  },

  // -------------------------------------------------------------------- Blog --
  {
    key: 'blog_hero',
    label: 'Blog — ảnh Hero',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/blog-hero.jpg',
  },
  {
    key: 'blog_featured_rose',
    label: 'Blog — Bài nổi bật (hoa hồng)',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/featured-rose.jpg',
  },
  {
    key: 'blog_featured_lab',
    label: 'Blog — Bài nổi bật (phòng lab)',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/featured-laboratory.jpg',
  },
  {
    key: 'blog_arch_vetiver',
    label: 'Blog — Nhóm hương: Smoked Vetiver',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/smoked-vetiver.jpg',
  },
  {
    key: 'blog_arch_resin',
    label: 'Blog — Nhóm hương: Ancient Resin',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/ancient-resin.jpg',
  },
  {
    key: 'blog_arch_lavender',
    label: 'Blog — Nhóm hương: Highland Lavender',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/highland-lavender.jpg',
  },
  {
    key: 'blog_arch_bergamot',
    label: 'Blog — Nhóm hương: Bitter Bergamot',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/bitter-bergamot.jpg',
  },
  {
    key: 'blog_arch_rose',
    label: 'Blog — Nhóm hương: Damask Rose',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/damask-rose.jpg',
  },
  {
    key: 'blog_arch_sandalwood',
    label: 'Blog — Nhóm hương: Sandalwood',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/sandalwood.jpg',
  },
  {
    key: 'blog_art_bottle',
    label: 'Blog — Bài viết: Synesthesia',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/article-bottle.jpg',
  },
  {
    key: 'blog_art_architecture',
    label: 'Blog — Bài viết: Brutalism',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/article-architecture.jpg',
  },
  {
    key: 'blog_art_flowers',
    label: 'Blog — Bài viết: Extraction',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/article-flowers.jpg',
  },
  {
    key: 'blog_art_wave',
    label: 'Blog — Bài viết: Cedarwood',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/article-wave.jpg',
  },
  {
    key: 'blog_art_letter',
    label: 'Blog — Bài viết: Correspondence',
    group: 'Blog / Tin tức',
    defaultUrl: '/images/blog/article-letter.jpg',
  },

  // -------------------------------------------------------------- Thuong hieu --
  {
    key: 'brand_signature_bg',
    label: 'Thương hiệu — ảnh nền CTA / mặc định',
    group: 'Thương hiệu',
    defaultUrl: '/images/brand/signature-background.jpg',
  },
  { key: 'brand_byredo', label: 'Thương hiệu — Byredo', group: 'Thương hiệu', defaultUrl: '/images/brand/byredo.jpg' },
  { key: 'brand_diptyque', label: 'Thương hiệu — Diptyque', group: 'Thương hiệu', defaultUrl: '/images/brand/diptyque.jpg' },
  { key: 'brand_creed', label: 'Thương hiệu — Creed', group: 'Thương hiệu', defaultUrl: '/images/brand/creed.jpg' },
  { key: 'brand_tom_ford', label: 'Thương hiệu — Tom Ford', group: 'Thương hiệu', defaultUrl: '/images/brand/tom-ford.jpg' },
  { key: 'brand_le_labo', label: 'Thương hiệu — Le Labo', group: 'Thương hiệu', defaultUrl: '/images/brand/le-labo.jpg' },
  { key: 'brand_mfk', label: 'Thương hiệu — Maison Francis Kurkdjian', group: 'Thương hiệu', defaultUrl: '/images/brand/maison-francis-kurkdjian.jpg' },
  { key: 'brand_jo_malone', label: 'Thương hiệu — Jo Malone London', group: 'Thương hiệu', defaultUrl: '/images/brand/jo-malone.jpg' },
  { key: 'brand_margiela', label: 'Thương hiệu — Maison Margiela', group: 'Thương hiệu', defaultUrl: '/images/brand/maison-margiela.jpg' },
  { key: 'brand_amouage', label: 'Thương hiệu — Amouage', group: 'Thương hiệu', defaultUrl: '/images/brand/amouage.jpg' },
  { key: 'brand_pdm', label: 'Thương hiệu — Parfums de Marly', group: 'Thương hiệu', defaultUrl: '/images/brand/parfums-de-marly.jpg' },
  { key: 'brand_xerjoff', label: 'Thương hiệu — Xerjoff', group: 'Thương hiệu', defaultUrl: '/images/brand/xerjoff.jpg' },
  { key: 'brand_frederic_malle', label: 'Thương hiệu — Frederic Malle', group: 'Thương hiệu', defaultUrl: '/images/brand/frederic-malle.jpg' },
  { key: 'brand_kilian', label: 'Thương hiệu — Kilian Paris', group: 'Thương hiệu', defaultUrl: '/images/brand/kilian-paris.jpg' },
  { key: 'brand_penhaligons', label: "Thương hiệu — Penhaligon's", group: 'Thương hiệu', defaultUrl: '/images/brand/penhaligons.jpg' },
  { key: 'brand_acqua_di_parma', label: 'Thương hiệu — Acqua di Parma', group: 'Thương hiệu', defaultUrl: '/images/brand/acqua-di-parma.jpg' },
  { key: 'brand_nishane', label: 'Thương hiệu — Nishane', group: 'Thương hiệu', defaultUrl: '/images/brand/nishane.jpg' },
  { key: 'brand_initio', label: 'Thương hiệu — Initio Parfums Privés', group: 'Thương hiệu', defaultUrl: '/images/brand/initio.jpg' },
  { key: 'brand_roja', label: 'Thương hiệu — Roja Parfums', group: 'Thương hiệu', defaultUrl: '/images/brand/roja-parfums.jpg' },

  // ---------------------------------------------------------------- Cua hang --
  {
    key: 'shop_banner',
    label: 'Cửa hàng — ảnh banner cuối trang',
    group: 'Cửa hàng',
    defaultUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200',
  },

  // ---------------------------------------------------------------- Tai khoan --
  {
    key: 'account_overview',
    label: 'Tài khoản — ảnh trang Tổng quan',
    group: 'Tài khoản',
    defaultUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'account_scent_profile',
    label: 'Tài khoản — ảnh Hồ sơ mùi hương',
    group: 'Tài khoản',
    defaultUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=1000&auto=format&fit=crop',
  },
];

export const SITE_CONTENT_KEYS = new Set(SITE_CONTENT_SLOTS.map((s) => s.key));

export function getSlot(key: string): SiteContentSlot | undefined {
  return SITE_CONTENT_SLOTS.find((s) => s.key === key);
}
