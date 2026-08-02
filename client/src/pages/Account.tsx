import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import AccountSidebar from "./account/AccountSidebar";

export default function AccountLayout() {
  /* Bố cục trang tài khoản */
  return (
    <>
      <div className="min-h-screen bg-[#FCF9F4]">
        <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
          <AccountSidebar />

          <div className="min-w-0 flex-1">
            <Outlet />{" "}
            {/* Outlet là nơi hiển thị nội dung của các trang con(Hiển thị component con.) trong tài khoản */}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
