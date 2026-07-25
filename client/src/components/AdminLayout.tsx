import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BarChart3,
  Boxes,
  ChevronLeft,
  CircleAlert,
  CircleDollarSign,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  Newspaper,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShoppingCart,
  Star,
  Tags,
  TicketPercent,
  UserCircle,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { adminApi } from "../lib/adminApi";
import { useAuth } from "../store/auth.store";

type NavIcon = typeof LayoutDashboard;
type NavItem = { to: string; label: string; icon: NavIcon; end?: boolean };
type NavSection = { title: string; items: NavItem[] };
type SearchItem = { id: string; type: string; title: string; subtitle: string; to: string };
type SearchGroup = { key: string; label: string; items: SearchItem[] };
type SearchResponse = { query: string; groups: SearchGroup[]; total: number };
type NotificationItem = {
  id: string;
  count: number;
  severity: "warning" | "danger" | "info" | "neutral";
  title: string;
  description: string;
  to: string;
};
type NotificationsResponse = { items: NotificationItem[]; total: number; updatedAt: string };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Chính",
    items: [{ to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Sản phẩm",
    items: [
      { to: "/admin/products", label: "Sản phẩm", icon: Package },
      { to: "/admin/variants", label: "Biến thể & Tồn kho", icon: Boxes },
      { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { to: "/admin/promotions/vouchers", label: "Ưu đãi & Voucher", icon: TicketPercent },
    ],
  },
  {
    title: "Danh mục & nội dung",
    items: [
      { to: "/admin/brands", label: "Thương hiệu", icon: Tags },
      { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
      { to: "/admin/media", label: "Thư viện ảnh", icon: Image },
      { to: "/admin/blog", label: "Tin tức / Blog", icon: Newspaper },
    ],
  },
  {
    title: "Cộng đồng",
    items: [
      { to: "/admin/reviews", label: "Đánh giá", icon: Star },
      { to: "/admin/users", label: "Người dùng", icon: Users },
    ],
  },
  {
    title: "Báo cáo",
    items: [
      { to: "/admin/reports/revenue", label: "Doanh thu", icon: BarChart3 },
      { to: "/admin/reports/orders", label: "Đơn hàng", icon: ShoppingCart },
      { to: "/admin/reports/inventory", label: "Sản phẩm & tồn kho", icon: Boxes },
      { to: "/admin/reports/customers", label: "Khách hàng", icon: Users },
      { to: "/admin/reports/finance", label: "Tài chính", icon: CircleDollarSign },
      { to: "/admin/reports/operations", label: "Vận hành", icon: Workflow },
    ],
  },
];

const SEARCH_ICONS: Record<string, NavIcon> = {
  order: ShoppingCart,
  user: Users,
  product: Package,
  variant: Boxes,
  brand: Tags,
  category: FolderTree,
  review: MessageSquareText,
  article: FileText,
  support: MessageSquareText,
};

const NOTIFICATION_NAV_TARGETS: Record<string, string> = {
  "pending-orders": "/admin/orders",
  "unpaid-qr": "/admin/orders",
  "low-stock": "/admin/variants",
  "pending-reviews": "/admin/reviews",
  "draft-articles": "/admin/blog",
  "open-support": "/admin/reports/operations",
};

const NEW_NOTIFICATION_DESCRIPTIONS: Record<string, (count: number) => string> = {
  "pending-orders": (count) => `${count} đơn mới cần kiểm tra`,
  "unpaid-qr": (count) => `${count} giao dịch QR mới chờ đối soát`,
  "low-stock": (count) => `${count} biến thể mới sắp hết hàng`,
  "pending-reviews": (count) => `${count} đánh giá mới chờ duyệt`,
  "draft-articles": (count) => `${count} bài viết mới đang là bản nháp`,
  "open-support": (count) => `${count} yêu cầu hỗ trợ mới cần xử lý`,
};

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("adminSidebarCollapsed") === "1",
  );
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [seenNotificationCounts, setSeenNotificationCounts] = useState<Record<string, number>>({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const notificationsRef = useRef<NotificationsResponse | null>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const notificationStorageKey = `adminNotificationSeenCounts:${user?.id || user?.email || "admin"}`;
  const newNotificationItems = useMemo(() => {
    return (notifications?.items || [])
      .map((item) => {
        const count = Math.max(0, item.count - Number(seenNotificationCounts[item.id] || 0));
        const describe = NEW_NOTIFICATION_DESCRIPTIONS[item.id];
        return {
          ...item,
          count,
          description: describe ? describe(count) : `${count} thông báo mới`,
        };
      })
      .filter((item) => item.count > 0);
  }, [notifications, seenNotificationCounts]);
  const newNotificationsTotal = useMemo(
    () => newNotificationItems.reduce((total, item) => total + item.count, 0),
    [newNotificationItems],
  );
  const notificationCountsByPath = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of notifications?.items || []) {
      const path = NOTIFICATION_NAV_TARGETS[item.id] || item.to.split("?")[0];
      map[path] = (map[path] || 0) + item.count;
    }
    return map;
  }, [notifications]);

  function readSeenCounts(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(notificationStorageKey) || "{}") as Record<
        string,
        number
      >;
    } catch {
      return {};
    }
  }

  function markNotificationsSeen(items = notificationsRef.current?.items || []) {
    const seen = readSeenCounts();
    for (const item of items) {
      const current = notificationsRef.current?.items.find(
        (currentItem) => currentItem.id === item.id,
      );
      seen[item.id] = current?.count ?? item.count;
    }
    localStorage.setItem(notificationStorageKey, JSON.stringify(seen));
    setSeenNotificationCounts(seen);
    const remaining = (notificationsRef.current?.items || []).reduce(
      (total, item) => total + Math.max(0, item.count - Number(seen[item.id] || 0)),
      0,
    );
    setUnreadNotifications(remaining);
  }

  function closeNotificationPanel() {
    setNotificationOpen(false);
  }

  function notificationPath(item: NotificationItem) {
    return item.to.split("?")[0];
  }

  function notificationMatchesLocation(item: NotificationItem, pathname: string, search = "") {
    const [targetPath, targetQuery = ""] = item.to.split("?");
    if ((NOTIFICATION_NAV_TARGETS[item.id] || targetPath) !== pathname) return false;
    const targetParams = new URLSearchParams(targetQuery);
    if (!targetParams.toString()) return true;
    const currentParams = new URLSearchParams(search);
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  }

  function markNotificationsSeenForLocation(pathname: string, search = "") {
    const items = (notificationsRef.current?.items || []).filter((item) => {
      return notificationMatchesLocation(item, pathname, search);
    });
    if (items.length) markNotificationsSeen(items);
  }

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        if (notificationOpen) closeNotificationPanel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notificationOpen, newNotificationItems]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResult(null);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const result = await adminApi.get<SearchResponse>("/search", { q: query.trim() });
        if (active) setSearchResult(result);
      } catch {
        if (active) setSearchResult({ query, groups: [], total: 0 });
      } finally {
        if (active) setSearching(false);
      }
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!notificationOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (notificationButtonRef.current?.contains(target)) return;
      if (notificationPanelRef.current?.contains(target)) return;
      closeNotificationPanel();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [notificationOpen, newNotificationItems]);

  useEffect(() => {
    let active = true;
    async function loadNotifications() {
      try {
        const result = await adminApi.get<NotificationsResponse>("/notifications");
        if (!active) return;

        const hasSeenSnapshot = localStorage.getItem(notificationStorageKey) != null;
        const seen = hasSeenSnapshot ? readSeenCounts() : {};
        const activeIds = new Set(result.items.map((item) => item.id));
        let unread = 0;

        for (const item of result.items) {
          const seenCount = hasSeenSnapshot
            ? Math.min(Number(seen[item.id] || 0), item.count)
            : item.count;
          seen[item.id] = seenCount;
          unread += Math.max(0, item.count - seenCount);
        }
        for (const id of Object.keys(seen)) {
          if (!activeIds.has(id)) delete seen[id];
        }

        localStorage.setItem(notificationStorageKey, JSON.stringify(seen));
        notificationsRef.current = result;
        setNotifications(result);
        setSeenNotificationCounts(seen);
        setUnreadNotifications(unread);
      } catch {
        if (active) {
          notificationsRef.current = null;
          setNotifications(null);
        }
      }
    }
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15_000);
    window.addEventListener("focus", loadNotifications);
    window.addEventListener("admin:refresh-notifications", loadNotifications);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadNotifications);
      window.removeEventListener("admin:refresh-notifications", loadNotifications);
    };
  }, [notificationStorageKey]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    markNotificationsSeenForLocation(location.pathname, location.search);
  }, [location.pathname, location.search]);

  function goToResult(to: string) {
    setSearchOpen(false);
    setQuery("");
    navigate(to);
  }

  async function goToNotification(item: NotificationItem) {
    markNotificationsSeen([item]);
    setNotificationOpen(false);
    try {
      const result = await adminApi.patch<NotificationsResponse>(`/notifications/${item.id}/seen`);
      notificationsRef.current = result;
      setNotifications(result);
    } catch {
      // Trạng thái đã xem cục bộ vẫn giữ chuông ổn định nếu lỗi mạng chỉ xảy ra tạm thời.
    }
    navigate(item.to);
  }

  const initial = (user?.name || user?.email || "A").charAt(0).toUpperCase();
  const SidebarCollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  function renderSidebar(compact = false) {
    return (
      <div className="flex h-full flex-col bg-[#F7F4EF] text-[#242321]">
        <div
          className={`flex h-[78px] items-center border-b border-[#D8D6D1] ${compact ? "justify-center gap-1 px-2" : "justify-between px-5"}`}
        >
          <NavLink
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className={`font-title font-semibold leading-none text-black ${compact ? "text-[21px]" : "text-[25px]"}`}
            title="L'Essence Noire"
          >
            {compact ? "LN" : "L'Essence Noire"}
          </NavLink>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`hidden h-9 w-9 items-center justify-center bg-transparent text-[#5E5A54] transition hover:bg-[#EFEAE3] hover:text-black lg:flex ${compact ? "ml-0" : "ml-3"}`}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <SidebarCollapseIcon className="h-4 w-4" strokeWidth={1.7} />
          </button>
          {!compact && (
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center text-[#4A4946] lg:hidden"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-7 ${compact ? "px-3" : "px-5"}`}>
          <div className={compact ? "space-y-5" : "space-y-7"}>
            {NAV_SECTIONS.map((section) => (
              <section key={section.title}>
                {compact ? (
                  <div className="mx-auto mb-2 h-px w-7 bg-[#D8D3CC] first:hidden" />
                ) : (
                  <p className="mb-2 px-3 font-sans text-[9px] font-medium uppercase tracking-[0.17em] text-[#99958E]">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const badgeCount = notificationCountsByPath[item.to.split("?")[0]] || 0;
                    const hasNotification = badgeCount > 0;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => {
                          setMenuOpen(false);
                          const [pathname, query = ""] = item.to.split("?");
                          markNotificationsSeenForLocation(pathname, query ? `?${query}` : "");
                        }}
                        title={compact ? item.label : undefined}
                        className={({ isActive }) => {
                          const stateClass = hasNotification
                            ? isActive
                              ? "bg-[#F6D7E1] text-[#8F244D]"
                              : "bg-[#FCE7EF] text-[#B73C6B] hover:bg-[#F9D6E3] hover:text-[#8F244D]"
                            : isActive
                              ? "bg-[#E9E6E1] text-black"
                              : "text-[#55534F] hover:bg-[#EFEBE5] hover:text-black";

                          return `relative flex min-h-9 items-center font-sans text-[11px] font-medium tracking-[0.04em] transition-colors ${
                            compact ? "justify-center px-2" : "gap-3 px-3"
                          } ${stateClass}`;
                        }}
                      >
                        <ItemIcon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.7} />
                        {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                        {badgeCount > 0 && (
                          <span
                            className={`flex shrink-0 items-center justify-center rounded-full bg-[#B73C36] font-mono font-semibold tabular-nums leading-none text-white ${compact ? "absolute right-2 top-1.5 h-4 min-w-4 px-1 text-[8px]" : "ml-auto h-5 min-w-5 px-1.5 text-[9px]"}`}
                            aria-label={`${badgeCount} thông báo chưa xử lý`}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className={`border-t border-[#D8D6D1] py-5 ${compact ? "px-3" : "px-5"}`}>
          <NavLink
            to="/"
            title={compact ? "Về trang bán hàng" : undefined}
            className={`flex min-h-9 items-center font-sans text-[10px] font-medium text-[#68655F] transition hover:bg-[#EFEBE5] hover:text-black ${compact ? "justify-center px-2" : "gap-3 px-3"}`}
          >
            <ChevronLeft className="h-[15px] w-[15px]" strokeWidth={1.7} />
            {!compact && "Về trang bán hàng"}
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            title={compact ? "Đăng xuất" : undefined}
            className={`flex min-h-9 w-full items-center font-sans text-[10px] font-medium text-[#A33A35] transition hover:bg-[#F4E5E2] ${compact ? "justify-center px-2" : "gap-3 px-3"}`}
          >
            <LogOut className="h-[15px] w-[15px]" strokeWidth={1.7} />
            {!compact && "Đăng xuất"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#171715]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#D8D6D1] transition-[width] duration-300 lg:block ${collapsed ? "w-[84px]" : "w-72"}`}
      >
        {renderSidebar(collapsed)}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative h-full w-[min(288px,86vw)] border-r border-[#D8D6D1] shadow-xl">
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      <div
        className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "lg:ml-[84px]" : "lg:ml-72"}`}
      >
        <header className="sticky top-0 z-30 flex h-[78px] items-center gap-3 border-b border-[#D8D6D1] bg-[#FCF9F5]/95 px-4 backdrop-blur-sm sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#3F3E3A] lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817D76]"
              strokeWidth={1.6}
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Tìm đơn hàng, khách hàng, sản phẩm..."
              className="h-10 w-full border border-[#D8D4CD] bg-[#F8F4EE] pl-10 pr-12 font-sans text-[10px] text-[#282622] outline-none transition focus:border-[#8A8378] focus:bg-white"
            />
            {searchOpen ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                  setSearchResult(null);
                }}
                className="absolute right-2 top-1/2 z-[60] flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#77726B] transition hover:bg-[#ECE7E0] hover:text-black"
                aria-label="Đóng tìm kiếm"
                title="Đóng tìm kiếm"
              >
                <X className="h-4 w-4" strokeWidth={1.7} />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 border border-[#D6D1C9] px-1.5 py-0.5 text-[8px] text-[#8A867F] sm:block">
                Ctrl K
              </kbd>
            )}

            {searchOpen && (
              <div className="fixed left-4 right-4 top-[70px] z-50 max-h-[70vh] overflow-y-auto border border-[#D5D1CA] bg-[#FFFDF9] shadow-[0_20px_55px_rgba(45,39,32,0.16)] sm:absolute sm:left-0 sm:right-0 sm:top-[46px]">
                {query.trim().length < 2 ? (
                  <div className="px-5 py-7 text-center font-sans text-[10px] text-[#88837B]">
                    Nhập ít nhất 2 ký tự để tìm trong toàn bộ hệ thống.
                  </div>
                ) : searching ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-8 text-[10px] text-[#77736B]">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Đang tìm kiếm
                  </div>
                ) : searchResult?.total ? (
                  <div className="py-2">
                    {searchResult.groups.map((group) => (
                      <section
                        key={group.key}
                        className="border-b border-[#E6E2DC] py-2 last:border-0"
                      >
                        <p className="px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#9A958D]">
                          {group.label}
                        </p>
                        {group.items.map((item) => {
                          const ResultIcon = SEARCH_ICONS[item.type] || Search;
                          return (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onClick={() => goToResult(item.to)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F3EEE8]"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#ECE8E1] text-[#514E48]">
                                <ResultIcon className="h-4 w-4" strokeWidth={1.6} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[10px] font-medium text-[#292723]">
                                  {item.title}
                                </span>
                                <span className="mt-1 block truncate text-[8px] text-[#89847D]">
                                  {item.subtitle}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-[10px] text-[#88837B]">
                    Không tìm thấy kết quả phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          {(searchOpen || notificationOpen) && (
            <button
              type="button"
              className="fixed inset-0 top-[78px] z-20 cursor-default"
              aria-label="Đóng bảng nổi"
              onClick={() => {
                setSearchOpen(false);
                if (notificationOpen) closeNotificationPanel();
              }}
            />
          )}

          <div className="relative z-30 ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              ref={notificationButtonRef}
              type="button"
              onClick={() => {
                if (notificationOpen) closeNotificationPanel();
                else setNotificationOpen(true);
                setSearchOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center text-[#55534F] transition hover:text-black"
              aria-label="Thông báo"
              title="Thông báo"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
              {unreadNotifications > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B73C36] px-1 text-[8px] font-semibold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                ref={notificationPanelRef}
                className="fixed left-4 right-4 top-[70px] z-50 border border-[#D5D1CA] bg-[#FFFDF9] shadow-[0_20px_55px_rgba(45,39,32,0.16)] sm:absolute sm:left-auto sm:right-12 sm:top-[48px] sm:w-[370px]"
              >
                <div className="flex items-center justify-between border-b border-[#E2DED8] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-semibold text-[#292723]">Thông báo vận hành</p>
                    <p className="mt-1 text-[8px] text-[#8A867F]">Tự động làm mới mỗi 15 giây</p>
                  </div>
                  <span className="text-[9px] font-medium text-[#B73C36]">
                    {newNotificationsTotal} mới
                  </span>
                </div>
                <div className="max-h-[430px] overflow-y-auto py-2">
                  {newNotificationItems.length ? (
                    newNotificationItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void goToNotification(item)}
                        className="flex w-full gap-3 px-5 py-4 text-left transition hover:bg-[#F3EEE8]"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center ${item.severity === "danger" ? "bg-[#F7E5E2] text-[#B73C36]" : item.severity === "warning" ? "bg-[#F1ECD9] text-[#75642A]" : "bg-[#E8ECE9] text-[#52675A]"}`}
                        >
                          <CircleAlert className="h-4 w-4" strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-medium text-[#292723]">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[8px] leading-4 text-[#827D75]">
                            {item.description}
                          </span>
                        </span>
                        <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#B73C36] px-1.5 font-mono text-[9px] font-semibold leading-none text-white tabular-nums">
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-5 py-10 text-center text-[10px] text-[#88837B]">
                      Không có thông báo mới.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="hidden text-right xl:block">
              <p className="font-sans text-[10px] font-medium text-[#2E2D2A]">
                {user?.name || "Quản trị viên"}
              </p>
              <p className="max-w-48 truncate text-[9px] text-[#8B8780]">{user?.email}</p>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BDB9B2] bg-[#EFEBE5] font-sans text-[10px] font-semibold text-[#383632]"
              title={user?.name || "Quản trị viên"}
            >
              {initial || <UserCircle className="h-4 w-4" />}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-8 lg:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
