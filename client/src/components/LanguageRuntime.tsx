import { useEffect } from "react";

const ENGLISH: Record<string, string> = {
  "Trang chủ": "Home",
  "Sản phẩm": "Products",
  "Thương hiệu": "Brands",
  "Tin tức": "Journal",
  "Giới thiệu": "About",
  "Liên hệ": "Contact",
  "Quản trị": "Admin",
  "Đăng nhập": "Sign in",
  "Đăng xuất": "Sign out",
  "Đăng ký": "Create account",
  "Tài khoản": "Account",
  "Trang tài khoản": "Account overview",
  "Tổng quan": "Overview",
  "Đơn hàng": "Orders",
  "Đơn hàng của tôi": "My orders",
  "Lịch sử đơn hàng": "Order history",
  "Danh sách yêu thích": "Wishlist",
  "Địa chỉ đã lưu": "Saved addresses",
  "Hồ sơ mùi hương": "Scent Profile",
  "Cài đặt": "Settings",
  "Về trang bán hàng": "Back to storefront",
  "Danh mục & nội dung": "Catalog & content",
  "Danh mục": "Categories",
  "Thư viện ảnh": "Media library",
  "Tin tức / Blog": "News / Blog",
  "Cộng đồng": "Community",
  "Đánh giá": "Reviews",
  "Người dùng": "Users",
  "Biến thể & Tồn kho": "Variants & inventory",
  "Thông báo": "Notifications",
  "Thông báo vận hành": "Operations notifications",
  "Tự động làm mới mỗi 15 giây": "Refreshes automatically every 15 seconds",
  "Không có công việc cần chú ý.": "There are no tasks requiring attention.",
  "Tìm đơn hàng, khách hàng, sản phẩm...": "Search orders, customers, products...",
  "Nhập ít nhất 2 ký tự để tìm trong toàn bộ hệ thống.":
    "Enter at least 2 characters to search the entire system.",
  "Đang tìm kiếm": "Searching",
  "Không tìm thấy kết quả phù hợp.": "No matching results found.",
  "Mở menu": "Open menu",
  "Đóng menu": "Close menu",
  "Thu gọn menu": "Collapse menu",
  "Mở rộng menu": "Expand menu",
  "Quản trị viên": "Administrator",
  "Thương hiệu nổi bật": "Featured brands",
  "Khám phá sản phẩm": "Explore products",
  "Đọc câu chuyện": "Read our story",
  "L'Essence Noire — Bộ sưu tập cao cấp": "L'Essence Noire — Luxury collection",
  "Nghệ thuật của": "The art of",
  "Hương thơm": "Fine fragrance",
  "tinh tế.": "refined.",
  "Khám phá bộ sưu tập nước hoa cao cấp với nguyên liệu hiếm từ bốn châu lục. Mỗi chai là một tác phẩm — được chế tác bằng sự kiên nhẫn và nghệ thuật chưng cất thủ công.":
    "Discover a collection of fine fragrances made with rare ingredients from around the world. Each bottle is a work of patience and artisanal distillation.",
  "Khám phá bộ sưu tập": "Explore collection",
  "Chưa có sản phẩm để hiển thị.": "No products to display yet.",
  "Tìm kiếm": "Search",
  "Sắp xếp": "Sort",
  "Mới nhất": "Newest",
  "Bán chạy nhất": "Best selling",
  "Giá tăng dần": "Price: low to high",
  "Giá giảm dần": "Price: high to low",
  "Tất cả": "All",
  Nam: "Men",
  Nữ: "Women",
  "Nước hoa nam": "Men's fragrance",
  "Nước hoa nữ": "Women's fragrance",
  "Giới tính": "Gender",
  "Khoảng giá": "Price range",
  "Nhóm hương": "Scent family",
  "Dung tích": "Volume",
  "Nồng độ": "Concentration",
  "Dịp sử dụng": "Occasion",
  "Thu gọn": "Show less",
  "Hết hàng": "Out of stock",
  "Liên hệ giá": "Contact for price",
  "Thêm vào giỏ": "Add to cart",
  "Đã thêm vào giỏ": "Added to cart",
  "Thêm vào wishlist": "Add to wishlist",
  "Bỏ khỏi wishlist": "Remove from wishlist",
  "Đã thêm vào wishlist": "Added to wishlist",
  "Đã xóa khỏi wishlist": "Removed from wishlist",
  "Thông tin sản phẩm": "Product details",
  "Mã phiên bản": "Variant code",
  "Mùa phù hợp": "Best seasons",
  "Tình trạng": "Availability",
  "Chưa cập nhật": "Not updated",
  "Đang cập nhật": "Updating",
  "Còn hàng": "In stock",
  "Ngừng kinh doanh": "Discontinued",
  "Quay lại Shop": "Back to shop",
  "Không tìm thấy sản phẩm": "Product not found",
  "Đang tải sản phẩm...": "Loading product...",
  "Viết đánh giá": "Write a review",
  "Đóng form": "Close form",
  "Gửi đánh giá": "Submit review",
  "Chọn ảnh từ thư viện": "Choose an image",
  "Chưa có đánh giá nào được duyệt cho sản phẩm này.":
    "There are no approved reviews for this product yet.",
  "Giỏ hàng": "Shopping cart",
  "Thanh toán": "Checkout",
  "Tổng cộng": "Total",
  "Tạm tính": "Subtotal",
  "Phí vận chuyển": "Shipping",
  "Tiếp tục mua sắm": "Continue shopping",
  "Mua sắm ngay": "Shop now",
  "Mua ngay": "Buy now",
  "Đặt hàng": "Place order",
  "Tạo mã QR": "Create QR code",
  "Thông tin giao hàng": "Shipping information",
  "Họ và tên": "Full name",
  "Số điện thoại": "Phone number",
  Email: "Email",
  "Thành phố": "City",
  "Xã/Phường": "Ward",
  "Địa chỉ": "Address",
  "Ghi chú": "Notes",
  "Phương thức thanh toán": "Payment method",
  "Chuyển khoản QR": "QR bank transfer",
  "Thanh toán khi nhận hàng": "Cash on delivery",
  "Tra cứu đơn hàng": "Order lookup",
  "Mã đơn, số điện thoại hoặc email": "Order code, phone number or email",
  "Tra cứu": "Look up",
  "Đang tra cứu": "Looking up",
  "Không tìm thấy đơn hàng": "No orders found",
  "Cảm ơn bạn đã đặt hàng!": "Thank you for your order!",
  "Quét mã QR để thanh toán": "Scan the QR code to pay",
  "Bước 3 · Chuyển khoản QR": "Step 3 · QR bank transfer",
  "Quét mã để thanh toán": "Scan to pay",
  "Hủy thanh toán QR": "Cancel QR payment",
  "Chưa tải được mã QR": "Could not load QR code",
  "Chưa cấu hình": "Not configured",
  "SePay sẽ ghi nhận giao dịch. Trạng thái chỉ chuyển thành đã thanh toán sau khi admin đối soát và xác nhận.":
    "SePay will record the transaction. The payment status changes to paid only after an admin reconciles and confirms it.",
  "Tôi đã thanh toán": "I have paid",
  "Đang hủy...": "Cancelling...",
  "Đã tạo mã QR thanh toán": "Payment QR code created",
  "Đã hủy thanh toán QR": "QR payment cancelled",
  "Thanh toán thành công": "Payment successful",
  "Số tài khoản": "Account number",
  "Chủ tài khoản": "Account holder",
  "Số tiền": "Amount",
  "Nội dung CK": "Transfer reference",
  "Xem chi tiết đơn": "View order details",
  "Chờ xử lý": "Pending",
  "Đã thanh toán": "Paid",
  "Chưa thanh toán": "Unpaid",
  "Đang giao": "Shipping",
  "Hoàn thành": "Completed",
  "Đã hủy": "Cancelled",
  "Chi tiết": "Details",
  "Chưa có đơn hàng nào": "No orders yet",
  Lưu: "Save",
  Hủy: "Cancel",
  Xóa: "Delete",
  Xoá: "Delete",
  Sửa: "Edit",
  Thêm: "Add",
  "Cập nhật": "Update",
  "Thao tác": "Actions",
  "Trạng thái": "Status",
  "Ngày đặt": "Order date",
  "Khách hàng": "Customer",
  "Khách vãng lai": "Guest",
  "Mã đơn": "Order code",
  "Quản lý đơn hàng": "Order management",
  "Theo dõi và cập nhật trạng thái đơn hàng": "Track and update order statuses",
  "QR chưa thanh toán": "Unpaid QR",
  "Chỉ hiện tồn thấp (≤ 5)": "Low stock only (≤ 5)",
  "Đơn hàng chờ xử lý": "Orders awaiting processing",
  "Sản phẩm sắp hết hàng": "Low-stock products",
  "Đánh giá chờ duyệt": "Reviews awaiting approval",
  "Bài viết chưa xuất bản": "Unpublished articles",
  "Thanh toán QR chưa hoàn tất": "Incomplete QR payments",
  "Điều khoản sử dụng": "Terms of use",
  "Chính sách bảo mật": "Privacy policy",
  "Hỗ trợ": "Support",
  "Hướng dẫn": "Guides",
  "Đăng ký nhận tin": "Subscribe",
  "Email không hợp lệ": "Invalid email address",
  "Đã đăng ký nhận tin": "Subscription confirmed",
  "Đang tải…": "Loading...",
  "Đang tải...": "Loading...",
  "Tuyển tập theo mùa": "The Seasonal",
  "Tuyển tập": "Archives",
  "Bộ sưu tập mùi hương được tuyển chọn, từ nhựa thơm phương Đông đầy khói đến những cánh hoa còn đẫm sương của buổi sáng Grasse.":
    "A curated selection of olfactory experiences, from the smoky resins of the Orient to the dew-kissed petals of a Grasse morning.",
  "Đang hiển thị": "Showing",
  "Chọn lọc theo nồng độ": "Concentration",
  "Kích thước": "Size",
  "Liên hệ cùng chuyên gia": "Contact the atelier",
  "Bắt đầu một": "Begin a",
  "Cuộc trò chuyện": "Dialogue",
  "Dù bạn muốn hỏi về nguồn gốc sản phẩm, cần tư vấn riêng hay chỉ muốn gửi một lời nhắn, chúng tôi đều trân trọng đọc từng dòng.":
    "Whether it's a question about provenance, a private consultation, or simply a note — we read every letter.",
  "Góc nhìn biên tập": "The editorial voice",
  "Một mùi hương không chỉ được lựa chọn, nó bộc lộ chính mình qua cuộc trò chuyện.":
    '"A fragrance is not chosen — it reveals itself through conversation."',
  "Xưởng hương": "Atelier",
  "Điện thoại": "Phone",
  "Thư từ": "Correspondence",
  "Giờ làm việc": "Hours",
  "Gửi lời nhắn": "Send a message",
  "Chúng tôi phản hồi trong một ngày làm việc. Với yêu cầu khẩn cấp, vui lòng gọi điện trực tiếp.":
    "We respond within one business day. For urgent enquiries, reach us by phone.",
  Tên: "First name",
  Họ: "Last name",
  "Chủ đề": "Subject",
  "Chọn chủ đề": "Select a topic",
  "Tin nhắn": "Message",
  "Gửi tin nhắn": "Send message",
  "Xóa nội dung": "Clear",
  "Địa điểm": "Location",
  "Truy cập": "Access the",
  "Câu lạc bộ Biên tập": "Editorial Club",
  "Chào mừng trở lại": "Welcome Back",
  "Nhập thông tin tài khoản của bạn": "Enter your manuscript credentials",
  "Địa chỉ email": "Email Address",
  "Mật khẩu": "Password",
  "Quên mật khẩu?": "Forgot?",
  "Duy trì đăng nhập": "Keep me signed in to the archives",
  "Đang xử lý...": "Processing...",
  "Đăng nhập vào câu lạc bộ": "Sign In to the Club",
  "Tham gia": "Join the",
  "Đăng ký thành viên": "Apply for Membership",
  "Tạo thông tin tài khoản của bạn": "Create your manuscript credentials",
  "Xác nhận mật khẩu": "Confirm Password",
  Hoặc: "Or",
  "Những nhà hương": "Curated",
  "được tuyển chọn": "Houses",
  "Ghi chép về điều": "Notes on the",
  "phù du.": "Ephemeral.",
  "Thuật giả kim của": "The Alchemy of",
  "những câu chuyện": "Invisible",
  "vô hình": "Narratives",
};

const VIETNAMESE = Object.fromEntries(
  Object.entries(ENGLISH).map(([vietnamese, english]) => [english, vietnamese]),
) as Record<string, string>;
VIETNAMESE["Full Name"] = "Họ và tên";
VIETNAMESE["Phone Number"] = "Số điện thoại";
VIETNAMESE["Add to bag"] = "Thêm vào giỏ";
VIETNAMESE["Sold out"] = "Hết hàng";
VIETNAMESE["Complimentary sample included"] = "Tặng kèm mẫu thử";
VIETNAMESE["The Curator's Circle"] = "Vòng tròn nhà tuyển hương";
VIETNAMESE["Access the"] = "Truy cập";
VIETNAMESE["Join the"] = "Tham gia";
VIETNAMESE["Editorial Club"] = "Câu lạc bộ Biên tập";
VIETNAMESE["Welcome Back"] = "Chào mừng trở lại";
VIETNAMESE["Enter your manuscript credentials"] = "Nhập thông tin tài khoản của bạn";
VIETNAMESE["Create your manuscript credentials"] = "Tạo thông tin tài khoản của bạn";
VIETNAMESE["Sign In to the Club"] = "Đăng nhập vào câu lạc bộ";
VIETNAMESE["Apply for Membership"] = "Đăng ký thành viên";
VIETNAMESE["Processing..."] = "Đang xử lý...";
VIETNAMESE["Or"] = "Hoặc";
VIETNAMESE["Email Address"] = "Địa chỉ email";
VIETNAMESE["Password"] = "Mật khẩu";
VIETNAMESE["Confirm Password"] = "Xác nhận mật khẩu";
VIETNAMESE["Forgot?"] = "Quên mật khẩu?";
VIETNAMESE["Keep me signed in to the archives"] = "Duy trì đăng nhập";
VIETNAMESE["The Seasonal"] = "Tuyển tập theo mùa";
VIETNAMESE["Archives"] = "Lưu hương";
VIETNAMESE["Amber Oud"] = "Trầm hổ phách";
VIETNAMESE["Rare Wood"] = "Gỗ quý";
VIETNAMESE["Issue No. 04 — Autumn/Winter"] = "Số 04 - Thu Đông";
VIETNAMESE["Featured Fragrances"] = "Nước hoa nổi bật";
VIETNAMESE["The Favorites"] = "Được yêu thích";
VIETNAMESE["Featured"] = "Nổi bật";
VIETNAMESE["New Arrivals"] = "Hàng mới";
VIETNAMESE["Bundle Deals"] = "Ưu đãi";
VIETNAMESE["Previous"] = "Trước";
VIETNAMESE["Next"] = "Sau";

const TEXT_RULES: Array<[RegExp, (...matches: string[]) => string]> = [
  [/^(\d+) việc$/, (count) => `${count} open tasks`],
  [/^(\d+) sản phẩm$/, (count) => `${count} products`],
  [/^Còn (\d+) sản phẩm$/, (count) => `${count} in stock`],
  [/^(\d+) đơn cần được kiểm tra$/, (count) => `${count} orders need review`],
  [/^(\d+) biến thể còn tối đa 5 sản phẩm$/, (count) => `${count} variants have 5 or fewer items`],
  [/^(\d+) đánh giá cần kiểm duyệt$/, (count) => `${count} reviews need moderation`],
  [/^(\d+) bài đang ở trạng thái nháp$/, (count) => `${count} articles are drafts`],
  [/^(\d+) giao dịch đang chờ đối soát$/, (count) => `${count} transactions await reconciliation`],
  [
    /^Hiển thị (\d+) trên (\d+) sản phẩm$/,
    (shown, total) => `Showing ${shown} of ${total} products`,
  ],
];

function toEnglish(source: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const value = source.trim();
  if (!value) return source;
  const exact = ENGLISH[value];
  if (exact) return `${leading}${exact}${trailing}`;
  for (const [pattern, replace] of TEXT_RULES) {
    const match = value.match(pattern);
    if (match) return `${leading}${replace(...match.slice(1))}${trailing}`;
  }
  return source;
}

function toVietnamese(source: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const value = source.trim();
  if (!value) return source;
  const exact = VIETNAMESE[value];
  if (exact) return `${leading}${exact}${trailing}`;
  const showing = value.match(/^Showing (\d+) of (\d+) products$/);
  if (showing) return `${leading}Hiển thị ${showing[1]} trên ${showing[2]} sản phẩm${trailing}`;
  return source;
}

type TextRecord = { source: string; rendered: string };
type AttributeRecord = Record<string, TextRecord>;
const textRecords = new WeakMap<Text, TextRecord>();
const attributeRecords = new WeakMap<Element, AttributeRecord>();
const TRANSLATED_ATTRIBUTES = ["placeholder", "title", "aria-label"];

function translateTextNode(node: Text, english: boolean) {
  if (node.parentElement?.closest("script, style, code, pre")) return;
  let record = textRecords.get(node);
  if (!record) {
    record = { source: node.data, rendered: node.data };
    textRecords.set(node, record);
  } else if (node.data !== record.rendered) {
    record.source = node.data;
  }
  const rendered = english ? toEnglish(record.source) : toVietnamese(record.source);
  record.rendered = rendered;
  if (node.data !== rendered) node.data = rendered;
}

function translateElementAttributes(element: Element, english: boolean) {
  let records = attributeRecords.get(element);
  if (!records) {
    records = {};
    attributeRecords.set(element, records);
  }
  for (const name of TRANSLATED_ATTRIBUTES) {
    const current = element.getAttribute(name);
    if (current == null) continue;
    const record = records[name];
    if (!record) records[name] = { source: current, rendered: current };
    else if (current !== record.rendered) record.source = current;
    const active = records[name];
    const rendered = english ? toEnglish(active.source) : toVietnamese(active.source);
    active.rendered = rendered;
    if (current !== rendered) element.setAttribute(name, rendered);
  }
}

function translateTree(root: Node, english: boolean) {
  if (root.nodeType === Node.TEXT_NODE) translateTextNode(root as Text, english);
  if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root as Element, english);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, english);
    else translateElementAttributes(node as Element, english);
    node = walker.nextNode();
  }
}

export default function LanguageRuntime() {
  useEffect(() => {
    document.documentElement.lang = "vi";
    const english = false;
    translateTree(document.body, english);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTree(mutation.target, english);
        for (const node of mutation.addedNodes) translateTree(node, english);
        if (mutation.type === "attributes") translateTree(mutation.target, english);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATED_ATTRIBUTES,
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
