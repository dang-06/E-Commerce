import assert from "node:assert/strict"
import test from "node:test"
import {
  buildOrdersCsv,
  canPerformAction,
  maskPhone,
  parseCustomerImportPreview,
} from "../lib/services/admin-actions"
import type { Order } from "../lib/types"

void test("admin/operator permissions protect sensitive actions", () => {
  assert.equal(canPerformAction("admin", "product:delete"), true)
  assert.equal(canPerformAction("operator", "product:delete"), false)
  assert.equal(canPerformAction("operator", "order:update"), true)
  assert.equal(canPerformAction(null, "order:update"), false)
})

void test("phone masking hides full phone numbers in exports and lists", () => {
  assert.equal(maskPhone("0901234567"), "090****567")
  assert.equal(maskPhone("123"), "***")
})

void test("customer import preview reports row-level errors", () => {
  const rows = parseCustomerImportPreview("0901234567,VIP\n12345,Sai")
  assert.deepEqual(rows.map((row) => row.valid), [true, false])
  assert.equal(rows[1]?.line, 2)
  assert.equal(rows[1]?.error, "Số điện thoại không hợp lệ")
})

void test("order report export masks phone and omits raw secrets", () => {
  const order: Order = {
    id: "order_1",
    code: "OD001",
    date: new Date("2026-07-15T00:00:00.000Z"),
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    address: "1 Le Loi",
    items: [],
    subtotal: 100000,
    discount: 25000,
    discountApplied: true,
    shipping: 0,
    total: 75000,
    status: "pending",
    paymentStatus: "unpaid",
    syncStatus: "failed",
    notes: "",
    createdAt: new Date("2026-07-15T00:00:00.000Z"),
    updatedAt: new Date("2026-07-15T00:00:00.000Z"),
  }
  const csv = buildOrdersCsv([order])
  assert.match(csv, /090\*\*\*\*567/)
  assert.doesNotMatch(csv, /0901234567/)
  assert.doesNotMatch(csv.toLowerCase(), /authorization|secret|token/)
})
