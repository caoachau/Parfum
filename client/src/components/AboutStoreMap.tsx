import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, Navigation, Phone, Search, Store, X } from "lucide-react";

type StoreLocation = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  plusCode: string;
  image: string;
  lat: number;
  lng: number;
};

type City = {
  name: string;
  lat: number;
  lng: number;
  geocodeName?: string;
};
type GeoPoint = { lat: number; lng: number };
type Origin = { lat: number; lng: number; label: string };
type DrivingRoute = {
  distanceKm: number;
  durationMinutes: number;
  points: Array<{ x: number; y: number }>;
};

const STORES: StoreLocation[] = [
  {
    id: "tv",
    name: "L'Essence Noire Trà Vinh",
    city: "Trà Vinh",
    address: "W8FW+9J, Hòa Thuận",
    phone: "0328 779 845",
    hours: "09:00 – 21:30",
    plusCode: "W8FW+9J Hoa Thuan, Tra Vinh, Vietnam",
    image:
      "https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2026%2F03%2F11%2Fschemata-architects-le-labo-tokyo-flagship-store-reimagined-tactile-wood-concrete-design-001.jpg",
    lat: 9.9209375,
    lng: 106.3463125,
  },
];

const CITIES: City[] = [
  { name: "TP. Hà Nội", lat: 21.0278, lng: 105.8342 },
  { name: "TP. Huế", lat: 16.4637, lng: 107.5909 },
  { name: "TP. Hải Phòng", lat: 20.8449, lng: 106.6881 },
  { name: "TP. Đà Nẵng", lat: 16.0544, lng: 108.2022 },
  { name: "TP. Hồ Chí Minh", lat: 10.7769, lng: 106.7009 },
  { name: "TP. Cần Thơ", lat: 10.0452, lng: 105.7469 },
  { name: "Lai Châu", lat: 22.3862, lng: 103.4707 },
  { name: "Điện Biên", lat: 21.386, lng: 103.023 },
  { name: "Sơn La", lat: 21.327, lng: 103.9141 },
  { name: "Lạng Sơn", lat: 21.8537, lng: 106.7615 },
  { name: "Quảng Ninh", lat: 20.9712, lng: 107.0448 },
  { name: "Thanh Hóa", lat: 19.8067, lng: 105.7852 },
  { name: "Nghệ An", lat: 18.6733, lng: 105.6922 },
  { name: "Hà Tĩnh", lat: 18.3428, lng: 105.9057 },
  { name: "Cao Bằng", lat: 22.6657, lng: 106.257 },
  { name: "Tuyên Quang", lat: 21.8236, lng: 105.2142 },
  { name: "Lào Cai", lat: 22.4856, lng: 103.9707 },
  { name: "Thái Nguyên", lat: 21.5942, lng: 105.8482 },
  { name: "Phú Thọ", lat: 21.3227, lng: 105.4019 },
  { name: "Bắc Ninh", lat: 21.1861, lng: 106.0763 },
  { name: "Hưng Yên", lat: 20.8526, lng: 106.016 },
  { name: "Ninh Bình", lat: 20.2506, lng: 105.9745 },
  { name: "Quảng Trị", lat: 16.7943, lng: 106.9634 },
  { name: "Quảng Ngãi", lat: 15.1205, lng: 108.7923 },
  { name: "Gia Lai", lat: 13.9833, lng: 108.0 },
  { name: "Khánh Hòa", lat: 12.2388, lng: 109.1967 },
  { name: "Lâm Đồng", lat: 11.9404, lng: 108.4583 },
  { name: "Đắk Lắk", lat: 12.6667, lng: 108.05 },
  { name: "Đồng Nai", lat: 10.9574, lng: 106.8426 },
  { name: "Tây Ninh", lat: 11.3101, lng: 106.0983 },
  {
    name: "Khu vực Trà Vinh",
    geocodeName: "Trà Vinh",
    lat: 9.9472,
    lng: 106.3423,
  },
  { name: "Vĩnh Long", lat: 10.2537, lng: 105.9722 },
  { name: "Đồng Tháp", lat: 10.4938, lng: 105.6882 },
  { name: "An Giang", lat: 10.3864, lng: 105.4352 },
  { name: "Cà Mau", lat: 9.1769, lng: 105.1524 },
];

// Cac diem neo tren truc duong bo Bac - Nam, tat ca deu nam trong Viet Nam.
// OSRM bat buoc di qua cac diem nay de khong chon duong tat qua Lao/Campuchia.
const VIETNAM_SOUTHBOUND_CORRIDOR: GeoPoint[] = [
  { lat: 19.8067, lng: 105.7852 }, // Thanh Hoa
  { lat: 18.6733, lng: 105.6922 }, // Vinh
  { lat: 17.4689, lng: 106.6223 }, // Dong Hoi
  { lat: 16.4637, lng: 107.5909 }, // Hue
  { lat: 16.0544, lng: 108.2022 }, // Da Nang
  { lat: 15.1205, lng: 108.7923 }, // Quang Ngai
  { lat: 13.782, lng: 109.219 }, // Quy Nhon
  { lat: 12.2388, lng: 109.1967 }, // Nha Trang
  { lat: 10.9289, lng: 108.1021 }, // Phan Thiet
  { lat: 10.7769, lng: 106.7009 }, // TP.HCM
  { lat: 10.3601, lng: 106.3598 }, // My Tho
];

// Anh ban do Viet Nam that (Wikimedia - official location map cua Viet Nam),
// rasterize sang PNG de tai nhanh & on dinh. Neu tai loi se dung lop SVG ben duoi.
const MAP_IMAGE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Vietnam_location_map.svg?width=900";

// Duong vien Viet Nam (silhouette) trong he toa do 0..100, dung lam nen vector
// va lam fallback khi anh raster khong tai duoc. Ranh gioi bao gom dat lien;
// Hoang Sa & Truong Sa duoc danh dau rieng o inset chu quyen ben duoi.
const VIETNAM_PATH =
  "M 41.71,1.61 C 46.12,1.99 56.14,4.21 58.78,5.16 C 61.42,6.11 56.28,6.38 57.56,7.29 C 58.84,8.21 63.72,9.64 66.46,10.65 C 69.20,11.66 74.63,12.27 74.02,13.35 C 73.41,14.43 65.18,16.23 62.80,17.10 C 60.42,17.97 60.77,17.72 59.76,18.58 C 58.74,19.44 58.44,21.22 56.71,22.26 C 54.98,23.30 50.67,23.25 49.39,24.84 C 48.11,26.43 47.66,29.36 49.02,31.81 C 50.38,34.26 53.90,37.17 57.56,39.55 C 61.22,41.92 67.61,44.55 70.98,46.06 C 74.35,47.57 75.40,47.14 77.80,48.58 C 80.20,50.02 83.34,52.25 85.37,54.71 C 87.40,57.17 88.84,60.96 90.00,63.35 C 91.16,65.74 92.44,67.33 92.32,69.03 C 92.20,70.73 90.49,71.88 89.27,73.55 C 88.05,75.22 87.28,77.67 85.00,79.03 C 82.72,80.39 79.21,80.66 75.61,81.74 C 72.01,82.81 66.42,84.43 63.41,85.48 C 60.40,86.53 59.43,86.93 57.56,88.06 C 55.69,89.19 55.70,90.81 52.20,92.26 C 48.71,93.71 39.60,96.61 36.59,96.77 C 33.58,96.93 33.85,94.71 34.15,93.23 C 34.45,91.75 38.84,89.19 38.41,87.87 C 37.98,86.55 31.49,86.39 31.59,85.29 C 31.69,84.19 36.26,82.55 39.02,81.29 C 41.78,80.03 46.38,78.78 48.17,77.74 C 49.96,76.70 49.25,75.89 49.76,75.03 C 50.27,74.17 50.27,73.90 51.22,72.58 C 52.17,71.26 52.54,69.09 55.49,67.10 C 58.44,65.11 67.07,62.26 68.90,60.65 C 70.73,59.04 67.17,58.93 66.46,57.42 C 65.75,55.91 66.25,53.12 64.63,51.61 C 63.00,50.10 58.03,49.47 56.71,48.39 C 55.39,47.31 58.03,46.45 56.71,45.16 C 55.39,43.87 51.73,42.59 48.78,40.65 C 45.83,38.71 42.78,36.02 39.02,33.55 C 35.26,31.08 28.35,27.91 26.22,25.81 C 24.09,23.71 25.61,22.42 26.22,20.97 C 26.83,19.52 31.91,18.61 29.88,17.10 C 27.85,15.60 17.07,13.50 14.02,11.94 C 10.97,10.38 11.08,8.87 11.59,7.74 C 12.10,6.61 13.62,5.97 17.07,5.16 C 20.52,4.35 28.21,3.49 32.32,2.90 C 36.43,2.31 37.30,1.23 41.71,1.61 Z";

const LAT_TOP = 23.6;
const LAT_BOTTOM = 8.1;
const LNG_LEFT = 101.9;
const LNG_RIGHT = 110.1;
const MAP_ASPECT = (LNG_RIGHT - LNG_LEFT) / (LAT_TOP - LAT_BOTTOM);

function pct(lat: number, lng: number) {
  const x = ((lng - LNG_LEFT) / (LNG_RIGHT - LNG_LEFT)) * 100;
  const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * 100;
  return { x, y };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();
}

async function administrativeCenter(city: City, signal: AbortSignal) {
  const placeName = city.geocodeName || city.name.replace(/^TP\.\s*/i, "");
  const params = new URLSearchParams({
    format: "jsonv2",
    countrycodes: "vn",
    addressdetails: "1",
    limit: "8",
    "accept-language": "vi",
    q: `${placeName}, Việt Nam`,
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
  });
  if (!response.ok) throw new Error("geocode");

  const rows = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    type?: string;
    addresstype?: string;
    boundingbox?: string[];
    display_name?: string;
  }>;
  const normalizedName = normalize(placeName);
  const row =
    rows.find(
      (item) =>
        ["state", "province", "administrative", "city"].includes(
          item.addresstype || item.type || "",
        ) && normalize(item.display_name || "").includes(normalizedName),
    ) || rows[0];
  if (!row) throw new Error("geocode");

  const bounds = row.boundingbox?.map(Number);
  if (
    bounds?.length === 4 &&
    bounds.every(Number.isFinite) &&
    bounds[0] < bounds[1] &&
    bounds[2] < bounds[3]
  ) {
    return {
      lat: (bounds[0] + bounds[1]) / 2,
      lng: (bounds[2] + bounds[3]) / 2,
    };
  }

  const lat = Number(row.lat);
  const lng = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("geocode");
  return { lat, lng };
}

function haversine(a: GeoPoint, b: GeoPoint) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function directionsUrl(store: StoreLocation) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(store.plusCode);
}

function vietnamOnlyWaypoints(origin: GeoPoint, store: StoreLocation) {
  if (origin.lat <= store.lat) return [] as GeoPoint[];
  const entryPoints: GeoPoint[] = [];
  if (origin.lat > 20.4) {
    if (origin.lng < 104.8) {
      if (origin.lat > 21.55) entryPoints.push({ lat: 21.327, lng: 103.9141 });
      entryPoints.push({ lat: 20.8133, lng: 105.3383 });
    } else {
      entryPoints.push({ lat: 21.0278, lng: 105.8342 });
    }
  }
  const corridor = VIETNAM_SOUTHBOUND_CORRIDOR.filter(
    (point) => point.lat < origin.lat - 0.15 && point.lat > store.lat + 0.15,
  );
  return [...entryPoints, ...corridor];
}

function drivingRouteUrl(origin: GeoPoint, store: StoreLocation) {
  const coordinates = [origin, ...vietnamOnlyWaypoints(origin, store), store]
    .map((point) => `${point.lng},${point.lat}`)
    .join(";");
  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
}

function routePoints(coordinates: number[][], maxPoints = 500) {
  if (!coordinates.length) return [];
  const stride = Math.max(1, Math.ceil(coordinates.length / maxPoints));
  const sampled = coordinates
    .filter((_, index) => index % stride === 0)
    .map(([lng, lat]) => pct(lat, lng));
  const [lastLng, lastLat] = coordinates[coordinates.length - 1];
  const last = pct(lastLat, lastLng);
  const currentLast = sampled[sampled.length - 1];
  if (!currentLast || currentLast.x !== last.x || currentLast.y !== last.y) sampled.push(last);
  return sampled;
}

// Tuyen duong du phong (dung ngay lap tuc, khong can mang). Noi origin -> store
// qua hanh lang noi dia va lam min bang noi suy tuyen tinh de ve duong cong dep.
function buildFallbackRoute(origin: GeoPoint, store: StoreLocation): DrivingRoute {
  const anchors = [origin, ...vietnamOnlyWaypoints(origin, store), store];
  let distanceKm = 0;
  for (let i = 1; i < anchors.length; i += 1) distanceKm += haversine(anchors[i - 1], anchors[i]);
  distanceKm *= 1.28; // he so duong bo so voi duong chim bay
  const points: Array<{ x: number; y: number }> = [];
  const segments = 26;
  for (let i = 1; i < anchors.length; i += 1) {
    const a = anchors[i - 1];
    const b = anchors[i];
    for (let s = 0; s < segments; s += 1) {
      const t = s / segments;
      points.push(pct(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t));
    }
  }
  points.push(pct(store.lat, store.lng));
  return {
    distanceKm: Math.round(distanceKm),
    durationMinutes: Math.round((distanceKm / 48) * 60),
    points,
  };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.max(1, minutes)} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function AboutStoreMap() {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreLocation | null>(null);
  const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [, setFlying] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [focus, setFocus] = useState({ x: 50, y: 50, scale: 1 });

  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  const nearest = useMemo(() => {
    if (!origin) return null;
    let best = STORES[0];
    let bestDist = Infinity;
    for (const store of STORES) {
      const dist = haversine(origin, store);
      if (dist < bestDist) {
        bestDist = dist;
        best = store;
      }
    }
    return { store: best, distance: bestDist };
  }, [origin]);

  const highlight = activeStore || nearest?.store || null;
  const started = Boolean(origin || activeStore);

  const fallbackRoute = useMemo(() => {
    if (!origin || !nearest?.store) return null;
    return buildFallbackRoute(origin, nearest.store);
  }, [origin, nearest?.store]);

  const effectiveRoute = drivingRoute || fallbackRoute;

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [] as City[];
    return CITIES.filter(
      (city) => normalize(city.name).includes(q) || normalize(city.geocodeName || "").includes(q),
    ).slice(0, 6);
  }, [query]);

  useEffect(
    () => () => {
      geocodeAbortRef.current?.abort();
    },
    [],
  );

  // Goi OSRM lay tuyen that; that bai thi giu tuyen du phong.
  useEffect(() => {
    if (!origin || !nearest?.store) {
      setDrivingRoute(null);
      setRouteLoading(false);
      return;
    }
    const controller = new AbortController();
    setDrivingRoute(null);
    setRouteLoading(true);
    fetch(drivingRouteUrl(origin, nearest.store), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("route");
        return response.json();
      })
      .then((data: any) => {
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates;
        if (data?.code !== "Ok" || !Array.isArray(coordinates) || !coordinates.length)
          throw new Error("route");
        setDrivingRoute({
          distanceKm: Math.round(Number(route.distance || 0) / 1000),
          durationMinutes: Math.round(Number(route.duration || 0) / 60),
          points: routePoints(coordinates),
        });
      })
      .catch(() => {
        /* giu fallbackRoute */
      })
      .finally(() => {
        if (!controller.signal.aborted) setRouteLoading(false);
      });
    return () => controller.abort();
  }, [origin, nearest?.store]);

  // Bay camera (fly-to): lui ve toan canh roi phong to vao khu vuc muc tieu.
  useEffect(() => {
    if (flyTimer.current) clearTimeout(flyTimer.current);
    const computeTarget = () => {
      if (origin && nearest?.store) {
        const o = pct(origin.lat, origin.lng);
        const s = pct(nearest.store.lat, nearest.store.lng);
        const span = Math.max(Math.abs(o.x - s.x), Math.abs(o.y - s.y), 7);
        return {
          x: clamp((o.x + s.x) / 2, 14, 86),
          y: clamp((o.y + s.y) / 2, 14, 86),
          scale: clamp(64 / span, 1.15, 2.6),
        };
      }
      if (activeStore) {
        const p = pct(activeStore.lat, activeStore.lng);
        return { x: clamp(p.x, 14, 86), y: clamp(p.y, 14, 86), scale: 2.4 };
      }
      return { x: 50, y: 50, scale: 1 };
    };
    const target = computeTarget();
    if (started) {
      setFlying(true);
      setFocus({ x: 50, y: 50, scale: 1 });
      flyTimer.current = setTimeout(() => {
        setFocus(target);
        flyTimer.current = setTimeout(() => setFlying(false), 1500);
      }, 420);
    } else {
      setFlying(false);
      setFocus(target);
    }
    return () => {
      if (flyTimer.current) clearTimeout(flyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, activeStore, nearest?.store]);

  // Ve duong di (draw-on) sau khi da bay toi noi.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRouteProgress(0);
    if (!effectiveRoute || !origin) return;
    const delay = setTimeout(() => {
      const duration = 1700;
      const start = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - start) / duration, 0, 1);
        setRouteProgress(easeInOut(t));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, 950);
    return () => {
      clearTimeout(delay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [effectiveRoute, origin]);

  const originPoint = origin ? pct(origin.lat, origin.lng) : null;
  const k = 1 / focus.scale; // counter-scale de ghim/nhan giu kich thuoc trên man hinh

  const drawnPoints = useMemo(() => {
    if (!effectiveRoute) return [] as Array<{ x: number; y: number }>;
    const total = effectiveRoute.points.length;
    const count = Math.max(2, Math.ceil(total * routeProgress));
    return effectiveRoute.points.slice(0, count);
  }, [effectiveRoute, routeProgress]);
  const head = drawnPoints[drawnPoints.length - 1];

  async function selectCity(name: string) {
    const city = CITIES.find((c) => c.name === name);
    if (!city) return;

    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setQuery(name);
    setSuggestOpen(false);
    setImageError(false);
    setActiveStore(STORES[0]);
    setSearching(true);
    setOrigin(null);
    setDrivingRoute(null);

    const timeout = window.setTimeout(() => controller.abort(), 6000);
    let center = { lat: city.lat, lng: city.lng };
    try {
      center = await administrativeCenter(city, controller.signal);
    } catch {
      // Dịch vụ địa giới không phản hồi: dùng tọa độ trung tâm dự phòng.
    } finally {
      window.clearTimeout(timeout);
    }

    // Một tỉnh khác đã được chọn trong lúc yêu cầu cũ còn chạy.
    if (geocodeAbortRef.current !== controller) return;
    geocodeAbortRef.current = null;
    setOrigin({
      ...center,
      label: city.name.startsWith("Khu vực") ? city.name : `Trung tâm ${city.name}`,
    });
    setSearching(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const match = suggestions[0] || CITIES.find((c) => normalize(c.name) === normalize(query));
    if (match) void selectCity(match.name);
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    geocodeAbortRef.current?.abort();
    geocodeAbortRef.current = null;
    setSearching(false);
    setLocating(true);
    setActiveStore(STORES[0]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setQuery("Vị trí của bạn");
        setSuggestOpen(false);
        setImageError(false);
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Vị trí của bạn",
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function resetView() {
    geocodeAbortRef.current?.abort();
    geocodeAbortRef.current = null;
    setSearching(false);
    setLocating(false);
    setOrigin(null);
    setActiveStore(null);
    setQuery("");
    setSuggestOpen(false);
    setDrivingRoute(null);
  }

  return (
    <section
      className="bg-[#F5F2ED] px-4 py-20 sm:px-10 lg:px-16 lg:py-28"
      style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
    >
      <style>{`
        @keyframes ln-radar{0%{transform:translate(-50%,-50%) scale(.35);opacity:.65}100%{transform:translate(-50%,-50%) scale(3.6);opacity:0}}
        @keyframes ln-ping{0%{transform:translate(-50%,-50%) scale(.5);opacity:.7}100%{transform:translate(-50%,-50%) scale(2.8);opacity:0}}
        @keyframes ln-drop{0%{transform:translate(-50%,-140%) scale(.4);opacity:0}60%{transform:translate(-50%,-46%) scale(1.06);opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
        @keyframes ln-cardIn{0%{transform:translate(24px,0);opacity:0}100%{transform:translate(0,0);opacity:1}}
        @keyframes ln-rise{0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes ln-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes ln-spin{to{transform:rotate(360deg)}}
        @keyframes ln-shine{0%{background-position:-160% 0}100%{background-position:260% 0}}
        .ln-fadeup{animation:ln-rise .7s cubic-bezier(.22,1,.36,1) both}
      `}</style>

      <div className="mx-auto max-w-[1200px]">
        <h2 className="ln-fadeup mt-4 text-[34px] leading-tight text-[#242018] sm:text-[46px]">
          Tìm cửa hàng gần bạn nhất
        </h2>
        <p className="ln-fadeup mt-4 max-w-xl text-[15px] leading-[1.9] text-[#5c564b]">
          Nhập tỉnh/thành để bắt đầu từ trung tâm địa giới mà không cần GPS, hoặc chủ động chia sẻ
          vị trí để tìm boutique L'Essence Noire gần bạn.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          {/* ===================== MAP STAGE ===================== */}
          <div className="relative overflow-hidden rounded-[16px] border border-[#d8d1c0] bg-[linear-gradient(180deg,#f7f2e7,#efe7d3_55%,#e6dabf)] shadow-[0_30px_80px_-40px_rgba(60,50,25,0.6)]">
            <div className="relative w-full" style={{ aspectRatio: String(MAP_ASPECT) }}>
              {/* Lop camera duoc phong to / bay */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${focus.scale})`,
                  transformOrigin: `${focus.x}% ${focus.y}%`,
                  transition: `transform 1.45s cubic-bezier(0.66, 0, 0.34, 1)`,
                }}
              >
                {/* Nen vector Viet Nam (luon co) */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="lnLand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#efe8d6" />
                      <stop offset="100%" stopColor="#e3d8bd" />
                    </linearGradient>
                    <filter id="lnSoft" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="0.6"
                        stdDeviation="0.9"
                        floodColor="#3c3216"
                        floodOpacity="0.28"
                      />
                    </filter>
                  </defs>
                  {/* Luoi kinh vi tuyen mo */}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={`v${i}`}
                      x1={(i + 1) * 10}
                      y1="0"
                      x2={(i + 1) * 10}
                      y2="100"
                      stroke="#d8ccae"
                      strokeWidth="0.12"
                      opacity="0.5"
                    />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={`h${i}`}
                      x1="0"
                      y1={(i + 1) * 10}
                      x2="100"
                      y2={(i + 1) * 10}
                      stroke="#d8ccae"
                      strokeWidth="0.12"
                      opacity="0.5"
                    />
                  ))}
                  <path
                    d={VIETNAM_PATH}
                    fill="url(#lnLand)"
                    stroke="#b9a06a"
                    strokeWidth="0.35"
                    filter="url(#lnSoft)"
                  />
                  <path
                    d={VIETNAM_PATH}
                    fill="none"
                    stroke="#927A20"
                    strokeWidth="0.28"
                    opacity="0.55"
                  />
                </svg>

                {/* Anh raster chinh thuc (phu len khi tai xong) */}
                {!mapError && (
                  <img
                    loading="lazy"
                    src={MAP_IMAGE}
                    alt="Bản đồ Việt Nam"
                    referrerPolicy="no-referrer"
                    onLoad={() => setMapReady(true)}
                    onError={() => setMapError(true)}
                    draggable={false}
                    className="absolute inset-0 h-full w-full select-none object-fill transition-opacity duration-700"
                    style={{
                      opacity: mapReady ? 1 : 0,
                      filter:
                        "grayscale(0.15) drop-shadow(0 6px 10px rgba(40,32,16,0.25)) saturate(1.05)",
                    }}
                  />
                )}

                {/* Tuyen duong di */}
                {origin && drawnPoints.length > 1 && (
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {effectiveRoute && (
                      <polyline
                        points={effectiveRoute.points.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#927A20"
                        strokeWidth={0.35 * k}
                        strokeDasharray={`${0.2 * k} ${1.1 * k}`}
                        opacity="0.35"
                      />
                    )}
                    <polyline
                      points={drawnPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={1.9 * k}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <polyline
                      points={drawnPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#927A20"
                      strokeWidth={0.9 * k}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* Dau di chuyen tren tuyen */}
                {origin && head && routeProgress < 1 && (
                  <span
                    className="absolute z-20 rounded-full bg-[#927A20]"
                    style={{
                      left: `${head.x}%`,
                      top: `${head.y}%`,
                      width: 10 * k,
                      height: 10 * k,
                      transform: "translate(-50%,-50%)",
                      boxShadow: `0 0 ${8 * k}px ${2 * k}px rgba(146,122,32,0.65)`,
                    }}
                  />
                )}

                {/* Ghim vi tri nguoi dung */}
                {originPoint && (
                  <div
                    className="absolute z-10"
                    style={{
                      left: `${originPoint.x}%`,
                      top: `${originPoint.y}%`,
                      transform: "translate(-50%,-50%)",
                    }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 rounded-full border border-[#242018]"
                      style={{
                        width: 22 * k,
                        height: 22 * k,
                        animation: "ln-ping 2s ease-out infinite",
                      }}
                    />
                    <span
                      className="relative block rounded-full border-2 border-white bg-[#242018] shadow"
                      style={{ width: 12 * k, height: 12 * k }}
                    />
                  </div>
                )}

                {/* Ghim cua hang + radar */}
                {STORES.map((store) => {
                  const p = pct(store.lat, store.lng);
                  const isHi = highlight?.id === store.id;
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setActiveStore(store)}
                      className="group absolute z-10 focus:outline-none"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: "translate(-50%,-50%)",
                      }}
                      aria-label={store.name}
                    >
                      {isHi &&
                        [0, 0.6, 1.2].map((delay) => (
                          <span
                            key={delay}
                            className="absolute left-1/2 top-1/2 rounded-full bg-[#927A20]"
                            style={{
                              width: 16 * k,
                              height: 16 * k,
                              animation: `ln-radar 2.4s ease-out ${delay}s infinite`,
                            }}
                          />
                        ))}
                      <span
                        className="relative flex items-center justify-center rounded-full border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:scale-110"
                        style={{
                          width: (isHi ? 17 : 12) * k,
                          height: (isHi ? 17 : 12) * k,
                          background: isHi ? "#927A20" : "#7c6f4d",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {!mapReady && !mapError && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[10px] text-[#7d7460]">
                  Đang tải bản đồ chi tiết…
                </div>
              )}
            </div>
          </div>

          {/* ===================== SIDEBAR ===================== */}
          <div className="relative isolate flex flex-col gap-5 overflow-visible">
            {/* ===== Ô TÌM KIẾM (đưa ra cột phải) ===== */}
            <div className="ln-fadeup relative z-30 overflow-visible rounded-[12px] border border-[#e2dccf] bg-white p-5 shadow-[0_18px_50px_-30px_rgba(40,32,16,0.55)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#927A20]">Tìm cửa hàng</p>
              <h3 className="mt-1 text-[19px] leading-snug text-[#242018]">Nhập vị trí của bạn</h3>
              <form onSubmit={handleSubmit} className="relative z-40 mt-4 flex items-center gap-2">
                <div className="relative z-40 flex flex-1 items-center">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 text-[#927A20]"
                  />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                    placeholder="Nhập tỉnh/thành của bạn…"
                    className="w-full rounded-full border border-[#d9d2c3] bg-[#faf8f2] py-2.5 pl-9 pr-3 text-[13px] text-[#3a352b] outline-none transition focus:border-[#927A20]"
                  />
                  {searching && (
                    <span
                      className="absolute right-3 h-4 w-4 rounded-full border-2 border-[#927A20]/30 border-t-[#927A20]"
                      style={{ animation: "ln-spin .7s linear infinite" }}
                    />
                  )}
                  {suggestOpen && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[110%] z-[100] isolate overflow-hidden rounded-[10px] border border-[#d4c9ae] bg-[#FFFEFB] shadow-[0_20px_48px_rgba(40,32,16,0.24)]">
                      {suggestions.map((city) => (
                        <button
                          key={city.name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => void selectCity(city.name)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#3a352b] transition hover:bg-[#fbf7ec]"
                        >
                          <MapPin size={13} className="shrink-0 text-[#927A20]" />
                          {city.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#927A20] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#7c6717]"
                >
                  <Search size={14} />
                  <span className="hidden sm:inline">Tìm</span>
                </button>
              </form>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#927A20]/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#927A20] transition hover:bg-[#927A20] hover:text-white"
                >
                  <Navigation size={13} />
                  {locating ? "Đang định vị…" : "Dùng vị trí của tôi"}
                </button>
                {started && (
                  <button
                    type="button"
                    onClick={resetView}
                    className="flex items-center justify-center gap-1 rounded-full border border-[#d9d2c3] px-3 py-2 text-[11px] text-[#6b6558] transition hover:border-[#927A20] hover:text-[#927A20]"
                  >
                    <X size={13} /> Toàn cảnh
                  </button>
                )}
              </div>
            </div>

            {/* ===== THẼ CHI TIẾT CỬA HÀNG (đưa ra cột phải) ===== */}
            {highlight ? (
              <div
                key={highlight.id}
                className="relative z-10 overflow-hidden rounded-[12px] border border-[#927360]/35 bg-white/95 shadow-[0_24px_60px_-30px_rgba(40,32,16,0.6)] backdrop-blur"
                style={{
                  animation: "ln-cardIn .55s cubic-bezier(.22,1,.36,1) both",
                }}
              >
                <div className="relative h-56 w-full overflow-hidden bg-[linear-gradient(120deg,#2c2620,#4a4133_55%,#927A20)]">
                  {!imageError && (
                    <img
                      loading="lazy"
                      src={highlight.image}
                      alt={highlight.name}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/70">Boutique</p>
                    <h3 className="text-[19px] leading-tight text-white">{highlight.name}</h3>
                  </div>
                </div>
                <div className="space-y-2 px-4 py-4">
                  <p className="flex items-start gap-2 text-[13px] text-[#5c564b]">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#927A20]" />
                    {highlight.address}, {highlight.city}
                  </p>
                  <p className="flex items-center gap-2 text-[13px] text-[#5c564b]">
                    <Phone size={13} className="shrink-0 text-[#927A20]" />
                    {highlight.phone}
                  </p>
                  <p className="flex items-center gap-2 text-[13px] text-[#5c564b]">
                    <Clock size={13} className="shrink-0 text-[#927A20]" />
                    {highlight.hours}
                  </p>
                  {origin && (
                    <div className="mt-1 flex items-center gap-3 rounded-[8px] bg-[#fbf7ec] px-3 py-2 text-[12px] text-[#5c564b]">
                      {routeLoading && !drivingRoute ? (
                        <span className="flex items-center gap-2 text-[#927A20]">
                          <span
                            className="h-3.5 w-3.5 rounded-full border-2 border-[#927A20]/30 border-t-[#927A20]"
                            style={{ animation: "ln-spin .7s linear infinite" }}
                          />
                          Đang tính tuyến đường…
                        </span>
                      ) : effectiveRoute ? (
                        <>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-[#a79f8b]">
                              Khoảng cách
                            </span>
                            <span className="text-[15px] font-semibold text-[#242018]">
                              {effectiveRoute.distanceKm} km
                            </span>
                          </span>
                          <span className="h-8 w-px bg-[#e2dccf]" />
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-[#a79f8b]">
                              Thời gian
                            </span>
                            <span className="text-[15px] font-semibold text-[#242018]">
                              {formatDuration(effectiveRoute.durationMinutes)}
                            </span>
                          </span>
                          {!drivingRoute && (
                            <span className="ml-auto text-[9px] italic text-[#a79f8b]">
                              ước tính
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>
                  )}
                  {origin && effectiveRoute && effectiveRoute.distanceKm > 250 && (
                    <p className="rounded-[8px] bg-[#f4efe1] px-3 py-2 text-[11px] leading-relaxed text-[#8a6d1f]">
                      Cửa hàng ở khá xa vị trí của bạn. Bạn có thể đặt hàng online để được giao tận
                      nơi.
                    </p>
                  )}
                  <a
                    href={directionsUrl(highlight)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#927A20] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#7c6717]"
                  >
                    <Navigation size={13} /> Chỉ đường
                  </a>
                </div>
              </div>
            ) : (
              <div className="ln-fadeup relative z-0 flex items-center gap-3 rounded-[10px] border border-[#e2dccf] bg-white/60 p-6 text-[14px] text-[#6b6558]">
                <Store size={20} className="shrink-0 text-[#927A20]" />
                Nhập tỉnh/thành ở ô tìm kiếm hoặc chọn cửa hàng bên dưới để xem chi tiết.
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#927A20]">
                Danh sách boutique
              </p>
              {STORES.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => setActiveStore(store)}
                  className={
                    "flex w-full items-start gap-3 rounded-[8px] border px-4 py-3 text-left text-[13px] transition hover:border-[#927A20] " +
                    (highlight?.id === store.id
                      ? "border-[#927A20] bg-[#fbf7ec]"
                      : "border-[#e6e0d3] bg-white/40")
                  }
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#927A20]" />
                  <span className="min-w-0">
                    <span className="text-[#3a352b]">{store.city}</span>
                    <span className="block text-[12px] text-[#8a8373]">{store.address}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[#a79f8b]">
                      <Clock size={11} /> {store.hours}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[12px] italic text-[#8a8373]">
          Quần đảo Hoàng Sa và Trường Sa thuộc chủ quyền Việt Nam.
        </p>
      </div>
    </section>
  );
}
