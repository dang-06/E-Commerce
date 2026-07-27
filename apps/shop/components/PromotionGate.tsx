"use client";

import { useEffect, useState } from "react";
import { checkPromotion, fetchSiteSettings } from "../lib/api";
import { normalizeVietnamesePhone } from "../lib/phone";
import { readPromotionSession, savePromotionSession } from "../lib/promotion-session";
import type { PromotionSession, SiteSettings } from "../lib/types";

const emptySiteSettings: SiteSettings = {
  bannerButtonText: "",
  bannerEyebrow: "",
  bannerImageUrl: null,
  bannerSubtitle: "",
  bannerTitle: "",
  catalogTitle: "",
  logoImageUrl: null,
  logoText: "",
  updatedAt: "",
};

export function PromotionGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const [checked, setChecked] = useState(false);
  const [session, setSession] = useState<PromotionSession | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(emptySiteSettings);

  useEffect(() => {
    setSession(readPromotionSession(globalThis.localStorage));
    setChecked(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings(): Promise<void> {
      try {
        const settings = await fetchSiteSettings();
        if (!cancelled) {
          setSiteSettings(settings);
        }
      } catch {
        if (!cancelled) {
          setSiteSettings(emptySiteSettings);
        }
      }
    }
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitPhone(): Promise<void> {
    setError(null);
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeVietnamesePhone(phoneInput);
    } catch {
      setError("Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.");
      return;
    }

    setCheckingPhone(true);
    try {
      const result = await checkPromotion(normalizedPhone);
      const nextSession: PromotionSession = {
        eligible: result.eligible && Boolean(result.promotionToken && result.expiresAt),
        phone: normalizedPhone,
        ...(result.expiresAt ? { expiresAt: result.expiresAt } : {}),
        ...(result.promotionToken ? { promotionToken: result.promotionToken } : {}),
      };
      savePromotionSession(globalThis.localStorage, nextSession);
      setSession(nextSession);
    } catch {
      setError("Không thể kiểm tra số điện thoại lúc này. Vui lòng thử lại.");
    } finally {
      setCheckingPhone(false);
    }
  }

  if (!checked) {
    return (
      <main className="app-shell">
        <section className="phone-panel" aria-label="Đang kiểm tra phiên số điện thoại">
          <p className="status">Đang tải...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-shell">
        <section className="phone-panel" aria-labelledby="phone-gate-title">
          <p className="eyebrow">{displayBrandName(siteSettings)}</p>
          <h1 id="phone-gate-title">Nhập số điện thoại để vào cửa hàng</h1>
          <p className="intro-copy">
            Bạn chỉ cần nhập một lần. Nếu số điện thoại có ưu đãi, giá giảm sẽ tự áp dụng trên mọi
            trang sản phẩm.
          </p>
          <label className="field" htmlFor="promotion-gate-phone">
            <span>Số điện thoại</span>
            <input
              autoComplete="tel"
              autoFocus
              id="promotion-gate-phone"
              inputMode="tel"
              placeholder="Ví dụ: 0901234567"
              value={phoneInput}
              onChange={(event) => {
                setPhoneInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitPhone();
                }
              }}
            />
          </label>
          {error ? <p className="status error">{error}</p> : null}
          {checkingPhone ? <p className="status">Đang kiểm tra số điện thoại...</p> : null}
          <button
            className="primary-button full-width"
            disabled={checkingPhone}
            type="button"
            onClick={() => {
              void submitPhone();
            }}
          >
            Vào cửa hàng
          </button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

function displayBrandName(siteSettings: SiteSettings): string {
  return siteSettings.logoText || "Rosa";
}
