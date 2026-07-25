import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken, getCsrfToken } from "./token";

// withCredentials: true de gui/nhan httpOnly cookie chua refresh token
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: () => void;
}> = [];

function processQueue(token: string | null, err?: any) {
  pendingQueue.forEach((p) => (err ? p.reject() : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.request.use((config) => {
  // Access token lay tu BO NHO (khong con doc localStorage).
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Dinh kem CSRF header cho cac request thay doi trang thai (double-submit cookie).
  const method = (config.method || "get").toLowerCase();
  if (method !== "get" && method !== "head") {
    const csrf = getCsrfToken();
    if (csrf) config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    )
      return Promise.reject(error);

    original._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Refresh token nam trong httpOnly cookie -> khong can gui trong body.
        // CSRF header duoc gan tu dong o request interceptor.
        const { data } = await api.post("/auth/refresh", {});
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(data.accessToken);
        return api(original);
      } catch (e) {
        processQueue(null, e);
        clearAccessToken();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    } else {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject: () => {
            reject(error);
          },
        });
      });
    }
  },
);
