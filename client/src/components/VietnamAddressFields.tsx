import { useEffect, useId, useMemo, useState } from "react";

type Division = {
  code: number;
  name: string;
  province_code?: number;
};

type Props = {
  province: string;
  ward: string;
  onProvinceChange: (value: string) => void;
  onWardChange: (value: string) => void;
  inputClassName: string;
  labelClassName: string;
  wrapperClassName?: string;
  required?: boolean;
};

const API_BASE = "https://provinces.open-api.vn/api/v2";
let provinceCache: Division[] | null = null;
const wardCache = new Map<number, Division[]>();

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN");
}

async function fetchDivisions(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Không tải được danh mục địa chỉ");
  const data = await response.json();
  return Array.isArray(data) ? (data as Division[]) : [];
}

export default function VietnamAddressFields({
  province,
  ward,
  onProvinceChange,
  onWardChange,
  inputClassName,
  labelClassName,
  wrapperClassName = "grid gap-4 sm:grid-cols-2",
  required = false,
}: Props) {
  const rawId = useId().replace(/:/g, "");
  const provinceListId = `province-list-${rawId}`;
  const wardListId = `ward-list-${rawId}`;
  const [provinces, setProvinces] = useState<Division[]>(provinceCache || []);
  const [wards, setWards] = useState<Division[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (provinceCache) return;
    const controller = new AbortController();
    fetchDivisions(`${API_BASE}/p/`, controller.signal)
      .then((data) => {
        provinceCache = data;
        setProvinces(data);
      })
      .catch(() => null);
    return () => controller.abort();
  }, []);

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (item) => normalize(item.name) === normalize(province),
      ),
    [province, provinces],
  );

  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      return;
    }

    const cached = wardCache.get(selectedProvince.code);
    if (cached) {
      setWards(cached);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoadingWards(true);
    fetchDivisions(
      `${API_BASE}/w/?province=${selectedProvince.code}`,
      controller.signal,
    )
      .then((data) => {
        if (!active) return;
        wardCache.set(selectedProvince.code, data);
        setWards(data);
      })
      .catch(() => {
        if (active) setWards([]);
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedProvince]);

  return (
    <div className={wrapperClassName}>
      <div>
        <label className={labelClassName}>Thành phố / Tỉnh</label>
        <input
          list={provinceListId}
          className={inputClassName}
          value={province}
          onChange={(event) => {
            onProvinceChange(event.target.value);
            onWardChange("");
          }}
          placeholder="Chọn hoặc nhập thành phố / tỉnh"
          autoComplete="address-level1"
          required={required}
        />
        <datalist id={provinceListId}>
          {provinces.map((item) => (
            <option key={item.code} value={item.name} />
          ))}
        </datalist>
      </div>

      <div>
        <label className={labelClassName}>Xã / Phường</label>
        <input
          list={wardListId}
          className={inputClassName}
          value={ward}
          onChange={(event) => onWardChange(event.target.value)}
          placeholder={
            loadingWards
              ? "Đang tải xã / phường..."
              : "Chọn hoặc nhập xã / phường"
          }
          autoComplete="address-level3"
          required={required}
          aria-busy={loadingWards}
        />
        <datalist id={wardListId}>
          {wards.map((item) => (
            <option key={item.code} value={item.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
