import type { RecipientForm } from "../lib/types";

export function RecipientFields({
  errors,
  form,
  onChange,
}: {
  errors: Partial<Record<keyof RecipientForm, string>>;
  form: RecipientForm;
  onChange: (field: keyof RecipientForm, value: string) => void;
}): React.ReactElement {
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
        <Field error={errors.province} label="Tỉnh/Thành" name="province" value={form.province} onChange={onChange} />
        <Field error={errors.district} label="Quận/Huyện" name="district" value={form.district} onChange={onChange} />
      </div>
      <Field error={errors.ward} label="Phường/Xã" name="ward" value={form.ward} onChange={onChange} />
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
