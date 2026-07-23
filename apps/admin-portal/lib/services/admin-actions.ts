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
  sourceCustomerId: string
  valid: boolean
  error?: string
}

export function parseCustomerImportPreview(content: string): ImportPreviewRow[] {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? ""
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ","
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .filter(({ line, index }) => index !== 0 || !/^"?\s*(phone|sdt|số điện thoại|so dien thoai)\s*"?\s*[,;\t]/i.test(line))
    .map(({ line, index }) => {
      const [phone = "", sourceCustomerId = ""] = line
        .split(delimiter)
        .map((value) => value.trim().replace(/^"|"$/g, ""))
      const normalized = phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0")
      const valid = /^0\d{9}$/.test(normalized)
      return {
        line: index + 1,
        phone: normalized || phone,
        sourceCustomerId,
        valid,
        ...(valid ? {} : { error: "Số điện thoại không hợp lệ" }),
      }
    })
}

export function buildEligibleCustomersSampleCsv(): string {
  const header = ["phone", "sourceCustomerId"]
  const rows = [
    ["0901234567", "CRM-1001"],
    ["0912345678", "CRM-1002"],
  ]
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
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
