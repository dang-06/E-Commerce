export interface VietnamProvince {
  code: number;
  name: string;
  wards: VietnamWard[];
}

export interface VietnamWard {
  code: number;
  name: string;
  province_code: number;
}

interface ApiProvince {
  code: number;
  name: string;
  wards?: ApiWard[];
}

interface ApiWard {
  code: number;
  name: string;
  province_code: number;
}

const provincesApiBaseUrl = "https://provinces.open-api.vn/api/v2";
let provinceCache: VietnamProvince[] | null = null;
const wardCache = new Map<number, VietnamWard[]>();

export const noDistrictValue = "Không áp dụng";

export async function fetchVietnamProvinces(): Promise<VietnamProvince[]> {
  if (provinceCache) {
    return provinceCache;
  }

  const response = await fetch(`${provincesApiBaseUrl}/p/`);
  if (!response.ok) {
    throw new Error("Could not load Vietnam provinces");
  }
  const provinces = (await response.json()) as ApiProvince[];
  provinceCache = provinces.map((province) => ({
    code: province.code,
    name: province.name,
    wards: [],
  }));
  return provinceCache;
}

export async function fetchVietnamWards(provinceCode: number): Promise<VietnamWard[]> {
  const cached = wardCache.get(provinceCode);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${provincesApiBaseUrl}/p/${provinceCode}?depth=2`);
  if (!response.ok) {
    throw new Error("Could not load Vietnam wards");
  }
  const province = (await response.json()) as ApiProvince;
  const wards = (province.wards ?? []).map((ward) => ({
    code: ward.code,
    name: ward.name,
    province_code: ward.province_code,
  }));
  wardCache.set(provinceCode, wards);
  return wards;
}

export function findProvinceByName(
  provinces: VietnamProvince[],
  provinceName: string,
): VietnamProvince | null {
  const normalizedName = normalizeAddressText(provinceName);
  return provinces.find((province) => normalizeAddressText(province.name) === normalizedName) ?? null;
}

export function findWardByName(wards: VietnamWard[], wardName: string): VietnamWard | null {
  const normalizedName = normalizeAddressText(wardName);
  return wards.find((ward) => normalizeAddressText(ward.name) === normalizedName) ?? null;
}

function normalizeAddressText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
}
