import type { Order, UserRole } from "../types"

export type AdminAction =
  | "product:create"
  | "product:update"
  | "product:delete"
  | "customer:import"
  | "customer:update"
  | "order:update"
  | "integration:retry"
  | "report:export"

const adminOnlyActions = new Set<AdminAction>([
  "product:create",
  "product:delete",
  "customer:import",
  "integration:retry",
  "report:export",
])

export function canPerformAction(role: UserRole | null, action: AdminAction): boolean {
  if (!role) {
    return false
  }
  if (adminOnlyActions.has(action)) {
    return role === "admin"
  }
  return true
}

export function maskPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "")
  if (normalized.length < 7) {
    return "***"
  }
  return `${normalized.slice(0, 3)}****${normalized.slice(-3)}`
}

export interface ImportPreviewRow {
  line: number
  phone: string
  reason: string
  valid: boolean
  error?: string
}

export function parseCustomerImportPreview(content: string): ImportPreviewRow[] {
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, index }) => {
      const [phone = "", reason = "imported"] = line.split(",").map((value) => value.trim())
      const normalized = phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0")
      const valid = /^0\d{9}$/.test(normalized)
      return {
        line: index + 1,
        phone: normalized || phone,
        reason,
        valid,
        ...(valid ? {} : { error: "Số điện thoại không hợp lệ" }),
      }
    })
}

export function buildOrdersCsv(orders: Order[]): string {
  const header = [
    "order_code",
    "created_at",
    "recipient_name",
    "phone_masked",
    "status",
    "sync_status",
    "subtotal",
    "discount",
    "shipping",
    "total",
  ]
  const rows = orders.map((order) => [
    order.code,
    order.createdAt.toISOString(),
    order.recipientName,
    maskPhone(order.phone),
    order.status,
    order.syncStatus,
    String(order.subtotal),
    String(order.discount),
    String(order.shipping),
    String(order.total),
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
}

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}
