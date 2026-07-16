import assert from "node:assert/strict";
import test from "node:test";
import { GoogleSheetsClientService } from "./google-sheets-client.service.js";
import type { IntegrationJobContext } from "./integration.types.js";

void test("appendOrder writes the next order from column A instead of using Sheets table detection", async () => {
  const prisma = {
    googleSheetConfig: {
      findFirst: () =>
        Promise.resolve({
          spreadsheetId: "sheet-1",
          worksheetName: "Orders",
        }),
    },
  };
  const service = new GoogleSheetsClientService(prisma as never);
  const calls: { init: RequestInit; url: string }[] = [];

  (
    service as unknown as {
      request: <T>(url: string, init: RequestInit) => Promise<T>;
    }
  ).request = <T>(url: string, init: RequestInit): Promise<T> => {
    calls.push({ init, url });
    if (init.method === "GET") {
      return Promise.resolve({
        values: [
          Array.from({ length: 13 }, (_, index) => (index === 12 ? "old items" : "")),
          Array.from({ length: 25 }, (_, index) => (index === 12 ? "misaligned old order" : "")),
        ],
      } as T);
    }
    return Promise.resolve({ updates: { updatedRange: "Orders!A3:M3" } } as T);
  };

  const externalId = await service.appendOrder(sampleJob(), new AbortController().signal);

  assert.equal(externalId, "Orders!A3:M3");
  assert.equal(calls.length, 2);
  const readCall = calls[0];
  const writeCall = calls[1];
  assert.ok(readCall);
  assert.ok(writeCall);
  assert.match(readCall.url, /values\/'Orders'!A%3AZ$/);
  assert.equal(writeCall.init.method, "PUT");
  assert.match(writeCall.url, /values\/'Orders'!A3%3AM3\?valueInputOption=USER_ENTERED$/);
  assert.doesNotMatch(writeCall.url, /:append/);
  const rawBody = writeCall.init.body;
  if (typeof rawBody !== "string") {
    throw new Error("expected Google Sheets request body to be JSON");
  }
  const body = JSON.parse(rawBody) as { values: string[][] };
  assert.match(body.values[0]?.[0] ?? "", /\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(body.values[0]?.slice(1), [
    "OD001",
    "Nguyen Van A",
    "0901234567",
    "1 Le Loi, Ben Nghe, Quan 1, HCM",
    "2",
    "12580000",
    "0",
    "0",
    "12580000",
    "cod",
    "",
    "DEV-SKU-001 x1; DEV-SKU-002 x1",
  ]);
  assert.deepEqual(
    {
      majorDimension: "ROWS",
      rowCount: body.values.length,
    },
    {
    majorDimension: "ROWS",
      rowCount: 1,
    },
  );
});

function sampleJob(): IntegrationJobContext {
  return {
    action: "create",
    attemptCount: 0,
    externalId: null,
    id: "job-1",
    integration: "sheet",
    order: {
      address: "1 Le Loi",
      discountAmount: "0",
      district: "Quan 1",
      items: [
        {
          discountPerItem: "0",
          finalUnitPrice: "6290000",
          lineDiscount: "0",
          lineSubtotal: "6290000",
          lineTotal: "6290000",
          listedPrice: "6290000",
          productName: "Product 1",
          quantity: 1,
          sku: "DEV-SKU-001",
        },
        {
          discountPerItem: "0",
          finalUnitPrice: "6290000",
          lineDiscount: "0",
          lineSubtotal: "6290000",
          lineTotal: "6290000",
          listedPrice: "6290000",
          productName: "Product 2",
          quantity: 1,
          sku: "DEV-SKU-002",
        },
      ],
      note: null,
      orderCode: "OD001",
      paymentMethod: "cod",
      province: "HCM",
      recipientName: "Nguyen Van A",
      recipientPhone: "0901234567",
      recipientPhoneMasked: "090****567",
      shippingFee: "0",
      subtotal: "12580000",
      totalAmount: "12580000",
      totalQuantity: 2,
      ward: "Ben Nghe",
    },
  };
}
