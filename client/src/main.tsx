import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuth } from "./store/auth.store";
import "./index.css";

function App() {
  const isBootstrapped = useAuth((s) => s.isBootstrapped);

  useEffect(() => {
    useAuth.getState().bootstrap();
  }, []);

  if (!isBootstrapped) {
    return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  }

  return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Neu HTML da duoc prerender san (react-snap) -> hydrate de giu lai DOM tinh
// (tot cho SEO + first paint, tranh nhap nhay). Neu khong -> render binh thuong.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
