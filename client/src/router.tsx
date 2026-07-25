import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

// PF-40 / PF-41: code-splitting + lazy-load route.
// Moi trang duoc tach thanh 1 chunk rieng va chi tai ve khi nguoi dung
// truy cap route tuong ung -> giam kich thuoc bundle ban dau, tang toc do tai trang.
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Register = lazy(() => import("./pages/Register"));
const Brand = lazy(() => import("./pages/Brand"));
const BrandJournal = lazy(() => import("./pages/BrandJournal"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const OrderLookup = lazy(() => import("./pages/OrderLookup"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AccountLayout = lazy(() => import("./pages/Account"));
const AccountOverview = lazy(() => import("./pages/account/AccountOverview"));
const OrderHistory = lazy(() => import("./pages/account/OrderHistory"));
const Wishlist = lazy(() => import("./pages/account/Wishlist"));
const SavedAddresses = lazy(() => import("./pages/account/SavedAddresses"));
const ScentProfile = lazy(() => import("./pages/account/ScentProfile"));
const Settings = lazy(() => import("./pages/account/Settings"));
const Contact = lazy(() => import("./pages/Contact"));
// Trang quan tri
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminVariants = lazy(() => import("./pages/admin/AdminVariants"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));

// Fallback hien thi trong khi chunk cua route dang duoc tai ve.
function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      Dang tai...
    </div>
  );
}

// Boc phan tu route bang Suspense de co fallback khi lazy-load.
function s(node: ReactNode): ReactNode {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: s(<Home />) },
      { path: "shop", element: s(<Shop />) },
      { path: "brand", element: s(<Brand />) },
      { path: "brand/:slug", element: s(<BrandJournal />) },
      { path: "blog", element: s(<Blog />) },
      { path: "blog/:slug", element: s(<BlogPost />) },
      { path: "contact", element: s(<Contact />) },
      { path: "about", element: s(<About />) },
      { path: "cart", element: s(<Cart />) },
      { path: "checkout", element: s(<Checkout />) },
      { path: "thank-you/:id", element: s(<ThankYou />) },
      { path: "order-lookup", element: s(<OrderLookup />) },
      { path: "privacy-policy", element: s(<PrivacyPolicy />) },
      { path: "products/:idOrSlug", element: s(<ProductDetail />) },
      { path: "product/:idOrSlug", element: s(<ProductDetail />) },
      { path: "login", element: s(<Login />) },
      { path: "forgot-password", element: s(<ForgotPassword />) },
      { path: "register", element: s(<Register />) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: s(<Dashboard />) },
          { path: "orders", element: s(<Orders />) },
          { path: "orders/:id", element: s(<OrderDetail />) },
          {
            path: "account",
            element: s(<AccountLayout />),
            children: [
              { index: true, element: s(<AccountOverview />) },
              { path: "orders", element: s(<OrderHistory />) },
              { path: "wishlist", element: s(<Wishlist />) },
              { path: "addresses", element: s(<SavedAddresses />) },
              { path: "scent-profile", element: s(<ScentProfile />) },
              { path: "settings", element: s(<Settings />) },
            ],
          },
        ],
      },
    ],
  },
  // ======================= KHU VUC QUAN TRI (/admin) =======================
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: s(<AdminDashboard />) },
      { path: "products", element: s(<AdminProducts />) },
      { path: "variants", element: s(<AdminVariants />) },
      { path: "brands", element: s(<AdminBrands />) },
      { path: "categories", element: s(<AdminCategories />) },
      { path: "media", element: s(<AdminMedia />) },
      { path: "blog", element: s(<AdminBlog />) },
      { path: "orders", element: s(<AdminOrders />) },
      { path: "users", element: s(<AdminUsers />) },
      { path: "reviews", element: s(<AdminReviewsPage />) },
      { path: "reports/:tab?", element: s(<AdminReports />) },
      { path: "promotions/:tab?", element: s(<AdminPromotions />) },
    ],
  },
]);
