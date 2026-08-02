import { useEffect, useState } from "react";
import {
  Clock3,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  Sparkles,
  UserCog,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { toast } from "../../store/toast.store";

const accountLinks = [
  { label: "Tổng quan", path: "/account", icon: LayoutDashboard, end: true },
  { label: "Lịch sử đơn hàng", path: "/account/orders", icon: Clock3 },
  { label: "Yêu thích", path: "/account/wishlist", icon: Heart },
  { label: "Địa chỉ đã lưu", path: "/account/addresses", icon: MapPin },
  { label: "Hồ sơ mùi hương", path: "/account/scent-profile", icon: Sparkles },
  { label: "Cài đặt", path: "/account/settings", icon: Settings },
];

export default function AccountSidebar() {
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Dong popup moi khi chuyen trang
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Khoa scroll nen khi popup mo tren mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  const NavItems = (
    <nav className="space-y-2">
      {accountLinks.map(({ label, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 border-l-2 px-4 py-3 text-xs transition ${
              isActive
                ? "border-[#9A7D00] bg-[#EEEAE5] text-[#927600]"
                : "border-transparent text-[#6F6963] hover:bg-[#F1EDE7]"
            }`
          }
        >
          <Icon size={15} strokeWidth={1.4} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const LogoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-4 flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left text-xs text-[#8B2F24] transition hover:bg-[#F1EDE7]"
    >
      <LogOut size={15} strokeWidth={1.4} />
      <span>Đăng xuất</span>
    </button>
  );

  return (
    <>
      {/* ===== Desktop: sidebar co dinh ===== */}
      <aside className="hidden w-[245px] shrink-0 border-r border-[#E8E1D8] bg-[#FCF9F4] p-8 lg:block">
        <p className="mb-5 text-[9px] uppercase tracking-[0.25em] text-[#777068]">Tài khoản</p>
        {NavItems}
        {LogoutButton}
        <div className="mt-10 bg-[#E8E4DF] p-5">
          <h3 className="font-serif text-base">Dịch vụ tư vấn riêng</h3>
          <p className="mt-3 text-xs leading-5 text-[#756E67]">
            Thành viên luôn có thể nhận tư vấn mùi hương cá nhân từ đội ngũ của chúng tôi.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-block border-b border-[#987B00] pb-1 text-[9px] uppercase tracking-widest text-[#806800]"
          >
            Liên hệ chuyên gia
          </Link>
        </div>
      </aside>

      {/* ===== Mobile: nut troi noi + popup ===== */}
      <div className="lg:hidden">
        {/* Lop phu mo dan */}
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* Panel popup: mo dan ra tu goc phai duoi */}
        <div
          role="dialog"
          aria-label="Menu tài khoản"
          className={`fixed bottom-24 right-4 z-50 w-[min(78vw,280px)] origin-bottom-right overflow-hidden rounded-2xl border border-[#E4DCD0] bg-[#FCF9F4] shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-300 ease-out ${
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-90 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#EAE3D8] px-5 py-4">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#6F6963]">
              Menu tài khoản
            </span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {NavItems}
            {LogoutButton}
          </div>
        </div>

        {/* Nut troi noi (icon rieng, khac icon menu 3 gach cua web) */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Đóng menu tài khoản" : "Mở menu tài khoản"}
          className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#817000] text-white shadow-[0_12px_30px_rgba(129,112,0,0.45)] transition-transform duration-300 hover:bg-[#665800] active:scale-90"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <UserCog
              size={22}
              strokeWidth={1.6}
              className={`absolute transition-all duration-300 ${
                open ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
              }`}
            />
            <X
              size={22}
              strokeWidth={1.8}
              className={`absolute transition-all duration-300 ${
                open ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
    </>
  );
}
