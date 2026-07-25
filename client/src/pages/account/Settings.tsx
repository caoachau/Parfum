import { useEffect, useState } from "react";
import { Bell, Eye, EyeOff, LockKeyhole, Mail, Save, User } from "lucide-react";
import { PasswordRequirements } from "../../components/PasswordRequirements";
import { api } from "../../lib/api";
import { getPasswordError } from "../../lib/password";
import { useAuth } from "../../store/auth.store";
import { toast } from "../../store/toast.store";

export default function Settings() {
  const language = "vi" as const;
  const [showPassword, setShowPassword] = useState(false);
  const user = useAuth((state) => state.user);
  const setUser = useAuth((state) => state.setUser);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotification, setSavingNotification] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    promotionNotifications: true,
    orderNotifications: true,
    journalNotifications: true,
  });

  useEffect(() => {
    if (!user) return;

    setForm((previous) => ({
      ...previous,
      fullName: user.name || "",
      email: user.email || "",
      phone: user.phone || user.addresses?.[0]?.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    api
      .get("/auth/me/notification-preferences")
      .then(({ data }) => {
        if (!active) return;
        setForm((previous) => ({
          ...previous,
          orderNotifications: data.orderNotifications !== false,
          emailNotifications: data.emailNotifications !== false,
          promotionNotifications: data.promotionNotifications === true,
          journalNotifications: data.journalNotifications === true,
        }));
      })
      .catch(() => {
        if (active) toast.error("Không thể tải tùy chọn thông báo");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "phone"
            ? value.replace(/\D/g, "").slice(0, 10)
            : value,
    }));
  };

  type NotificationPreferenceKey =
    "orderNotifications" | "emailNotifications" | "promotionNotifications" | "journalNotifications";

  const handleNotificationChange = async (name: NotificationPreferenceKey, checked: boolean) => {
    const previousPreferences = {
      orderNotifications: form.orderNotifications,
      emailNotifications: form.emailNotifications,
      promotionNotifications: form.promotionNotifications,
      journalNotifications: form.journalNotifications,
    };
    const base = { ...previousPreferences, [name]: checked };
    // "Thông báo qua email" là công tắc tổng: tắt nó thì tắt hết 3 cái còn lại.
    const nextPreferences = base.emailNotifications
      ? base
      : {
          emailNotifications: false,
          orderNotifications: false,
          promotionNotifications: false,
          journalNotifications: false,
        };

    setForm((previous) => ({ ...previous, ...nextPreferences }));
    setSavingNotification(name);
    try {
      const { data } = await api.put("/auth/me/notification-preferences", nextPreferences);
      setForm((previous) => ({
        ...previous,
        orderNotifications: data.orderNotifications,
        emailNotifications: data.emailNotifications,
        promotionNotifications: data.promotionNotifications,
        journalNotifications: data.journalNotifications,
      }));
      if (user) {
        setUser({
          ...user,
          notificationPreferences: {
            orderNotifications: data.orderNotifications,
            emailNotifications: data.emailNotifications,
            promotionNotifications: data.promotionNotifications,
            journalNotifications: data.journalNotifications,
          },
        });
      }
      toast.success(checked ? "Đã bật thông báo" : "Đã tắt thông báo");
    } catch (error: any) {
      setForm((previous) => ({ ...previous, ...previousPreferences }));
      toast.error(error?.response?.data?.message || "Không thể lưu tùy chọn thông báo");
    } finally {
      setSavingNotification(null);
    }
  };

  // Luu thong tin ca nhan - HOAN TOAN doc lap voi mat khau.
  // Cap nhat SDT/ten/email KHONG yeu cau nhap mat khau.
  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextPhone = form.phone.trim();
    if (nextPhone && !/^0\d{9}$/.test(nextPhone)) {
      toast.error("Số điện thoại phải bắt đầu bằng 0 và đủ 10 số");
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.put("/auth/me", {
        name: form.fullName,
        email: form.email,
        phone: nextPhone || undefined,
      });

      setUser({
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.createdAt || user?.createdAt,
        isEmailVerified: data.isEmailVerified,
        addresses: data.addresses || [],
        profileCompletedAt: data.profileCompletedAt,
        profileCompletionVoucherCode: data.profileCompletionVoucherCode,
        notificationPreferences: data.notificationPreferences || user?.notificationPreferences,
      });

      toast.success(
        data.profileJustCompleted
          ? `Cập nhật hồ sơ thành công. Voucher chào mừng ${data.profileCompletionVoucherCode} đã sẵn sàng.`
          : "Đã lưu thông tin cá nhân",
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  // Doi mat khau - form rieng, chi chay khi nguoi dung chu dong doi mat khau.
  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const passwordError = getPasswordError(form.newPassword, language);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!form.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    try {
      setSavingPassword(true);
      await api.put("/auth/me/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm((previous) => ({
        ...previous,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Đã đổi mật khẩu");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2D2925]">
      <section className="border-b border-[#E7E0D7] px-6 pb-7 pt-12 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9B9288]">
          Cổng thông tin cá nhân
        </p>

        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Cài đặt</h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7C746C]">
          Quản lý thông tin cá nhân, mật khẩu và tùy chọn thông báo của tài khoản.
        </p>
      </section>

      <div className="space-y-8 px-6 py-10 lg:px-12">
        {/* Thong tin ca nhan + thong bao: luu doc lap, khong can mat khau */}
        <form onSubmit={handleSaveProfile} className="space-y-8">
          <section className="border border-[#E2DBD2] bg-[#FFFDF9]">
            <div className="flex items-center gap-3 border-b border-[#E7E0D7] px-6 py-5">
              <User size={19} strokeWidth={1.4} />

              <div>
                <h2 className="font-serif text-2xl">Thông tin cá nhân</h2>

                <p className="mt-1 text-xs text-[#877E74]">
                  Cập nhật thông tin hiển thị trong tài khoản. Bạn có thể lưu mà không cần nhập mật
                  khẩu.
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                  Họ và tên
                </span>

                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={handleChange}
                  className="mt-3 w-full border border-[#DCD4CB] bg-[#FCF9F4] px-4 py-3 text-sm outline-none transition focus:border-[#927600]"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                  Số điện thoại
                </span>

                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-3 w-full border border-[#DCD4CB] bg-[#FCF9F4] px-4 py-3 text-sm outline-none transition focus:border-[#927600]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                  Email
                </span>

                <div className="relative mt-3">
                  <Mail
                    size={16}
                    strokeWidth={1.4}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8379]"
                  />

                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-[#DCD4CB] bg-[#FCF9F4] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#927600]"
                  />
                </div>
              </label>
            </div>

            <div className="flex justify-end border-t border-[#EFE9E1] px-6 py-5">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 bg-[#816A00] px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#675500] disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="border border-[#E2DBD2] bg-[#FFFDF9]">
            <div className="flex items-center gap-3 border-b border-[#E7E0D7] px-6 py-5">
              <Bell size={19} strokeWidth={1.4} />

              <div>
                <h2 className="font-serif text-2xl">Tùy chọn thông báo</h2>

                <p className="mt-1 text-xs text-[#877E74]">
                  Chọn những thông báo mà bạn muốn nhận.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#EAE4DC] px-6">
              <NotificationToggle
                title="Thông báo qua email"
                description="Công tắc chính cho email. Tắt mục này sẽ tắt toàn bộ email bên dưới."
                name="emailNotifications"
                checked={form.emailNotifications}
                onChange={handleNotificationChange}
                disabled={savingNotification !== null}
              />

              <NotificationToggle
                title="Thông báo đơn hàng"
                description="Nhận thông báo về xác nhận, vận chuyển và trạng thái đơn hàng."
                name="orderNotifications"
                checked={form.emailNotifications && form.orderNotifications}
                onChange={handleNotificationChange}
                disabled={savingNotification !== null || !form.emailNotifications}
              />

              <NotificationToggle
                title="Khuyến mãi và ưu đãi"
                description="Nhận thông tin về chương trình giảm giá và sản phẩm mới.(Lưu ý: Bạn cần cập nhật hồ sơ để nhận ưu đãi chào mừng)"
                name="promotionNotifications"
                checked={form.emailNotifications && form.promotionNotifications}
                onChange={handleNotificationChange}
                disabled={savingNotification !== null || !form.emailNotifications}
              />

              <NotificationToggle
                title="Thông báo bài viết mới"
                description="Nhận bài viết Nhật ký mới qua email ngay khi bài viết được xuất bản.
                (Lưu ý: Bạn cần đăng ký nhận thông báo bài viết mới ở trang tin tức trước)."
                name="journalNotifications"
                checked={form.emailNotifications && form.journalNotifications}
                onChange={handleNotificationChange}
                disabled={savingNotification !== null || !form.emailNotifications}
              />
            </div>
          </section>
        </form>

        {/* Doi mat khau: form rieng biet, khong bat buoc de luu ho so */}
        <form onSubmit={handleChangePassword}>
          <section className="border border-[#E2DBD2] bg-[#FFFDF9]">
            <div className="flex items-center gap-3 border-b border-[#E7E0D7] px-6 py-5">
              <LockKeyhole size={19} strokeWidth={1.4} />

              <div>
                <h2 className="font-serif text-2xl">Đổi mật khẩu</h2>

                <p className="mt-1 text-xs text-[#877E74]">
                  Chỉ điền khi bạn muốn đổi mật khẩu. Không bắt buộc để lưu thông tin cá nhân.
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-6">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                  Mật khẩu hiện tại
                </span>

                <div className="relative mt-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="currentPassword"
                    autoComplete="current-password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full border border-[#DCD4CB] bg-[#FCF9F4] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#927600]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#81786F]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                    Mật khẩu mới
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={handleChange}
                    minLength={8}
                    placeholder="Nhập mật khẩu mới"
                    className="mt-3 w-full border border-[#DCD4CB] bg-[#FCF9F4] px-4 py-3 text-sm outline-none transition focus:border-[#927600]"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#736B63]">
                    Xác nhận mật khẩu
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu mới"
                    className="mt-3 w-full border border-[#DCD4CB] bg-[#FCF9F4] px-4 py-3 text-sm outline-none transition focus:border-[#927600]"
                  />
                </label>
              </div>

              <PasswordRequirements password={form.newPassword} language={language} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-3 bg-[#27231F] px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:opacity-60"
                >
                  <LockKeyhole size={15} />
                  {savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  title: string;
  description: string;
  name:
    "orderNotifications" | "emailNotifications" | "promotionNotifications" | "journalNotifications";
  checked: boolean;
  onChange: (name: NotificationToggleProps["name"], checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({
  title,
  description,
  name,
  checked,
  onChange,
  disabled = false,
}: NotificationToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      disabled={disabled}
      onClick={() => onChange(name, !checked)}
      className={`flex w-full items-center justify-between gap-5 py-6 text-left ${
        disabled ? "cursor-wait opacity-65" : "cursor-pointer"
      }`}
    >
      <div>
        <p className="font-serif text-lg">{title}</p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-[#81786F]">{description}</p>
      </div>

      <div className="relative shrink-0">
        <div
          className={`h-6 w-11 rounded-full transition ${
            checked ? "bg-[#887000]" : "bg-[#D8D1C8]"
          }`}
        />
        <div
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </div>
    </button>
  );
}
