"use client";

import type { PromotionSession } from "./types";

const promotionSessionKey = "nik:promotion-session";

export function readPromotionSession(storage: Storage | undefined): PromotionSession | null {
  if (!storage) {
    return null;
  }

  const rawSession = storage.getItem(promotionSessionKey);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<PromotionSession>;
    if (!parsed.phone || typeof parsed.phone !== "string" || typeof parsed.eligible !== "boolean") {
      clearPromotionSession(storage);
      return null;
    }
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) {
      clearPromotionSession(storage);
      return null;
    }
    return {
      eligible: parsed.eligible,
      phone: parsed.phone,
      ...(parsed.expiresAt ? { expiresAt: parsed.expiresAt } : {}),
      ...(parsed.promotionToken ? { promotionToken: parsed.promotionToken } : {}),
    };
  } catch {
    clearPromotionSession(storage);
    return null;
  }
}

export function savePromotionSession(storage: Storage | undefined, session: PromotionSession): void {
  storage?.setItem(promotionSessionKey, JSON.stringify(session));
  globalThis.dispatchEvent(new CustomEvent("promotion-session-updated", { detail: session }));
}

export function clearPromotionSession(storage: Storage | undefined): void {
  storage?.removeItem(promotionSessionKey);
}
