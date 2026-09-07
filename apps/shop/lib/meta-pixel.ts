"use client";

import { parseVnd } from "./money";
import type { CartItem, OrderResult } from "./types";

export type MetaPixelEvent =
  "CompleteRegistration" | "InitiateCheckout" | "PageView" | "Purchase" | "ViewContent";

export interface MetaPixelContent {
  id: string;
  item_price?: number;
  quantity?: number;
}

export interface ViewContentParameters {
  content_ids: string[];
  content_name: string;
  content_type: "product";
  currency: "VND";
  value: number;
}

export interface InitiateCheckoutParameters {
  content_ids: string[];
  contents: MetaPixelContent[];
  currency: "VND";
  num_items: number;
  value: number;
}

export interface CompleteRegistrationParameters {
  content_ids: string[];
  currency: "VND";
  num_items: number;
  status: "created";
  value: number;
}

export interface PurchaseParameters {
  currency: "VND";
  value: number;
}

type MetaPixelParameters =
  | CompleteRegistrationParameters
  | InitiateCheckoutParameters
  | PurchaseParameters
  | ViewContentParameters
  | Record<string, unknown>;

type MetaPixelCommand =
  | ["init", string]
  | ["track", MetaPixelEvent]
  | ["track", MetaPixelEvent, MetaPixelParameters]
  | ["track", MetaPixelEvent, MetaPixelParameters, { eventID?: string }];

export interface MetaPixelFunction {
  (...command: MetaPixelCommand): void;
  callMethod?: (...command: MetaPixelCommand) => void;
  loaded?: boolean;
  push?: MetaPixelFunction;
  queue?: MetaPixelCommand[];
  version?: string;
}

declare global {
  interface Window {
    _fbq?: MetaPixelFunction;
    fbq?: MetaPixelFunction;
  }
}

export function getMetaPixelId(): string | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return pixelId && pixelId.length > 0 ? pixelId : null;
}

export function isMetaPixelConfigured(): boolean {
  return getMetaPixelId() !== null;
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function trackPageView(): void {
  track("PageView");
}

export function trackViewContent(parameters: ViewContentParameters): void {
  track("ViewContent", parameters);
}

export function trackInitiateCheckout(parameters: InitiateCheckoutParameters): void {
  track("InitiateCheckout", parameters);
}

export function trackCompleteRegistration(
  parameters: CompleteRegistrationParameters,
  options: { eventID: string },
): void {
  trackOnce("CompleteRegistration", parameters, options);
}

export function trackPurchase(parameters: PurchaseParameters, options: { eventID: string }): void {
  trackOnce("Purchase", parameters, options);
}

export function trackOrderCreatedConversions(order: OrderResult, cartItems: CartItem[]): void {
  if (order.status !== "created") {
    return;
  }

  const orderTotal = parseVnd(order.totalAmount);
  const options = { eventID: order.orderCode };
  trackCompleteRegistration(
    {
      content_ids: cartItems.map((item) => item.productId),
      currency: "VND",
      num_items: order.totalQuantity,
      status: "created",
      value: orderTotal,
    },
    options,
  );
  trackPurchase(
    {
      currency: "VND",
      value: orderTotal,
    },
    options,
  );
}

function track(
  event: MetaPixelEvent,
  parameters?: MetaPixelParameters,
  options?: { eventID?: string },
): boolean {
  if (!isBrowser() || !isMetaPixelConfigured()) {
    return false;
  }

  try {
    const fbq = window.fbq;
    if (!fbq) {
      return false;
    }

    if (parameters && options) {
      fbq("track", event, parameters, options);
      return true;
    }

    if (parameters) {
      fbq("track", event, parameters);
      return true;
    }

    fbq("track", event);
    return true;
  } catch {
    // Tracking must never interrupt the buyer flow.
    return false;
  }
}

function trackOnce(
  event: MetaPixelEvent,
  parameters: MetaPixelParameters,
  options: { eventID: string },
): void {
  if (!isBrowser() || hasTrackedEvent(event, options.eventID)) {
    return;
  }

  if (track(event, parameters, options)) {
    markTrackedEvent(event, options.eventID);
  }
}

function hasTrackedEvent(event: MetaPixelEvent, eventID: string): boolean {
  try {
    return window.sessionStorage.getItem(trackedEventKey(event, eventID)) === "1";
  } catch {
    return false;
  }
}

function markTrackedEvent(event: MetaPixelEvent, eventID: string): void {
  try {
    window.sessionStorage.setItem(trackedEventKey(event, eventID), "1");
  } catch {
    // Storage availability should not affect tracking or the buyer flow.
  }
}

function trackedEventKey(event: MetaPixelEvent, eventID: string): string {
  return `nik:meta-pixel:${event}:${encodeURIComponent(eventID)}`;
}
