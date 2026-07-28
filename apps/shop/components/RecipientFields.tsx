import { useEffect, useMemo, useState } from "react";
import type { RecipientForm } from "../lib/types";
import {
  fetchVietnamProvinces,
  fetchVietnamWards,
  findProvinceByName,
  findWardByName,
  noDistrictValue,
  type VietnamProvince,
  type VietnamWard,
} from "../lib/vietnam-address";

export function RecipientFields({
  errors,
  form,
  onChange,
}: {
  errors: Partial<Record<keyof RecipientForm, string>>;
  form: RecipientForm;
  onChange: (field: keyof RecipientForm, value: string) => void;
}): React.ReactElement {
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [addressDataError, setAddressDataError] = useState<string | null>(null);
  const selectedProvince = useMemo(
    () => findProvinceByName(provinces, form.province),
    [form.province, provinces],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadProvinces(): Promise<void> {
      setLoadingProvinces(true);
      setAddressDataError(null);
      try {
        const nextProvinces = await fetchVietnamProvinces();
        if (!cancelled) {
          setProvinces(nextProvinces);
        }
      } catch {
        if (!cancelled) {
          setAddressDataError("Không tải được danh sách tỉnh/thành. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProvinces(false);
        }
      }
    }
    void loadProvinces();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWards(): Promise<void> {
      if (!selectedProvince) {
        setWards([]);
        return;
      }

      setLoadingWards(true);
      setAddressDataError(null);
      try {
        const nextWards = await fetchVietnamWards(selectedProvince.code);
        if (!cancelled) {
          setWards(nextWards);
        }
      } catch {
        if (!cancelled) {
          setAddressDataError("Không tải được danh sách phường/xã. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) {
          setLoadingWards(false);
        }
      }
    }

    void loadWards();
    return () => {
      cancelled = true;
    };
  }, [selectedProvince]);

  function updateProvince(value: string): void {
    const nextProvince = findProvinceByName(provinces, value);
    onChange("province", value);
    onChange("ward", "");
    onChange("district", nextProvince ? noDistrictValue : "");
  }

  function updateWard(value: string): void {
    onChange("ward", value);
    if (findWardByName(wards, value)) {
      onChange("district", noDistrictValue);
    }
  }

  return (
    <section className="form-panel" aria-labelledby="recipient-title">
      <h2 id="recipient-title">Thông tin nhận hàng</h2>
      <Field
        autoComplete="name"
        error={errors.recipientName}
        label="Họ tên người nhận"
        name="recipientName"
        value={form.recipientName}
        onChange={onChange}
      />
      <Field
        autoComplete="tel"
        error={errors.recipientPhone}
        inputMode="tel"
        label="Số điện thoại người nhận"
        name="recipientPhone"
        value={form.recipientPhone}
        onChange={onChange}
      />
      <div className="field-grid">
        <SearchableAddressField
          disabled={loadingProvinces}
          error={errors.province}
          label="Tỉnh/Thành"
          listId="province-options"
          name="province"
          options={provinces.map((province) => province.name)}
          placeholder={loadingProvinces ? "Đang tải tỉnh/thành..." : "Tìm tỉnh/thành"}
          value={form.province}
          onChange={updateProvince}
        />
        <SearchableAddressField
          disabled={!selectedProvince || loadingWards}
          error={errors.ward}
          label="Phường/Xã"
          listId="ward-options"
          name="ward"
          options={wards.map((ward) => ward.name)}
          placeholder={
            selectedProvince
              ? loadingWards
                ? "Đang tải phường/xã..."
                : "Tìm phường/xã"
              : "Chọn tỉnh/thành trước"
          }
          value={form.ward}
          onChange={updateWard}
        />
      </div>
      {addressDataError ? <p className="field-helper error">{addressDataError}</p> : null}
      <Field error={errors.address} label="Địa chỉ cụ thể" name="address" value={form.address} onChange={onChange} />
      <label className="field" htmlFor="field-note">
        <span>Ghi chú</span>
        <textarea
          id="field-note"
          rows={3}
          value={form.note}
          onChange={(event) => {
            onChange("note", event.target.value);
          }}
        />
      </label>
    </section>
  );
}

function SearchableAddressField({
  disabled,
  error,
  label,
  listId,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled: boolean;
  error: string | undefined;
  label: string;
  listId: string;
  name: "province" | "ward";
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  value: string;
}): React.ReactElement {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={name === "province" ? "address-level1" : "address-level3"}
        disabled={disabled}
        id={id}
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {error ? (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </label>
  );
}

function Field({
  autoComplete,
  error,
  inputMode,
  label,
  name,
  onChange,
  value,
}: {
  autoComplete?: string;
  error: string | undefined;
  inputMode?: "tel";
  label: string;
  name: keyof RecipientForm;
  onChange: (field: keyof RecipientForm, value: string) => void;
  value: string;
}): React.ReactElement {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        inputMode={inputMode}
        value={value}
        onChange={(event) => {
          onChange(name, event.target.value);
        }}
      />
      {error ? (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
