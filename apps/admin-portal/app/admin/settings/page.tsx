'use client'

import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Key, Link2, Save, Table2 } from 'lucide-react'
import { getErrorMessage, integrationService } from '@/lib/services/api-service'
import { GoogleSheetConfig } from '@/lib/types'

interface SheetFormState {
  sheetUrl: string
  worksheetName: string
  phoneColumn: string
  orderMappingText: string
  isActive: boolean
}

const emptySheetForm: SheetFormState = {
  isActive: true,
  orderMappingText: '',
  phoneColumn: '',
  sheetUrl: '',
  worksheetName: '',
}

export default function SettingsPage() {
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, string>>({})
  const [eligibleSheet, setEligibleSheet] = useState<SheetFormState>(emptySheetForm)
  const [orderSheet, setOrderSheet] = useState<SheetFormState>(emptySheetForm)
  const [loadingSheets, setLoadingSheets] = useState(true)
  const [saving, setSaving] = useState<'eligible_customers' | 'orders' | null>(null)
  const [sheetMessage, setSheetMessage] = useState<string | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const googleSheetConfigured =
    (eligibleSheet.isActive && eligibleSheet.sheetUrl.trim().length > 0) ||
    (orderSheet.isActive && orderSheet.sheetUrl.trim().length > 0)

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      try {
        const [status, sheetConfigs] = await Promise.all([
          integrationService.getIntegrationStatus(),
          integrationService.getGoogleSheetConfigs(),
        ])
        if (cancelled) return
        setIntegrationStatus(status)
        setEligibleSheet(toSheetForm(sheetConfigs.eligibleCustomers))
        setOrderSheet(toSheetForm(sheetConfigs.orders))
      } catch (error) {
        if (!cancelled) {
          setSheetError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoadingSheets(false)
        }
      }
    }
    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveEligibleSheet(): Promise<void> {
    await saveSheet('eligible_customers', eligibleSheet)
  }

  async function saveOrderSheet(): Promise<void> {
    await saveSheet('orders', orderSheet)
  }

  async function saveSheet(purpose: 'eligible_customers' | 'orders', form: SheetFormState): Promise<void> {
    setSaving(purpose)
    setSheetError(null)
    setSheetMessage(null)
    try {
      const saved = await integrationService.saveGoogleSheetConfig(purpose, {
        isActive: form.isActive,
        orderMapping: purpose === 'orders' ? parseOrderMapping(form.orderMappingText) : undefined,
        phoneColumn: purpose === 'eligible_customers' ? form.phoneColumn.trim() : undefined,
        sheetUrl: form.sheetUrl.trim(),
        worksheetName: form.worksheetName.trim() || undefined,
      })
      if (purpose === 'eligible_customers') {
        setEligibleSheet(toSheetForm(saved))
      } else {
        setOrderSheet(toSheetForm(saved))
      }
      setSheetMessage('Đã lưu cấu hình Google Sheet.')
    } catch (error) {
      setSheetError(getErrorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Cấu hình' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cấu hình hệ thống</h1>
        <p className="mt-1 text-muted-foreground">Quản lý các cài đặt của cửa hàng</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Sheet số điện thoại ưu đãi
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Quản lý link Google Sheet chứa danh sách số điện thoại được giảm giá. Hệ thống chỉ lưu link và cấu hình
              cột; việc đồng bộ thật cần credential Google được cấu hình ở backend.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eligible-sheet-url">Link Google Sheet</Label>
                <Input
                  id="eligible-sheet-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={eligibleSheet.sheetUrl}
                  onChange={(event) => {
                    setEligibleSheet({ ...eligibleSheet, sheetUrl: event.target.value })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="eligible-worksheet">Tên tab</Label>
                <Input
                  id="eligible-worksheet"
                  placeholder="Ví dụ: Eligible"
                  value={eligibleSheet.worksheetName}
                  onChange={(event) => {
                    setEligibleSheet({ ...eligibleSheet, worksheetName: event.target.value })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="eligible-phone-column">Cột chứa số điện thoại</Label>
                <Input
                  id="eligible-phone-column"
                  placeholder="Ví dụ: phone hoặc A"
                  value={eligibleSheet.phoneColumn}
                  onChange={(event) => {
                    setEligibleSheet({ ...eligibleSheet, phoneColumn: event.target.value })
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="eligible-sheet-active"
                  checked={eligibleSheet.isActive}
                  onCheckedChange={(checked) => {
                    setEligibleSheet({ ...eligibleSheet, isActive: checked })
                  }}
                />
                <Label htmlFor="eligible-sheet-active">Kích hoạt sheet ưu đãi</Label>
              </div>
              <Button
                className="gap-2"
                disabled={loadingSheets || saving === 'eligible_customers'}
                onClick={() => {
                  void saveEligibleSheet()
                }}
              >
                <Save className="h-4 w-4" />
                {saving === 'eligible_customers' ? 'Đang lưu...' : 'Lưu sheet ưu đãi'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Sheet ghi đơn hàng
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Đơn hàng sau khi tạo thành công sẽ đi qua integration job. Link này là cấu hình sheet đích để adapter ghi
              đơn khi credential Google được bật.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orders-sheet-url">Link Google Sheet</Label>
                <Input
                  id="orders-sheet-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={orderSheet.sheetUrl}
                  onChange={(event) => {
                    setOrderSheet({ ...orderSheet, sheetUrl: event.target.value })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="orders-worksheet">Tên tab</Label>
                <Input
                  id="orders-worksheet"
                  placeholder="Ví dụ: Orders"
                  value={orderSheet.worksheetName}
                  onChange={(event) => {
                    setOrderSheet({ ...orderSheet, worksheetName: event.target.value })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="orders-mapping">Mapping cột đơn hàng (JSON)</Label>
                <Textarea
                  id="orders-mapping"
                  rows={7}
                  placeholder='{"orderCode":"A","recipientName":"B","totalAmount":"C"}'
                  value={orderSheet.orderMappingText}
                  onChange={(event) => {
                    setOrderSheet({ ...orderSheet, orderMappingText: event.target.value })
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="orders-sheet-active"
                  checked={orderSheet.isActive}
                  onCheckedChange={(checked) => {
                    setOrderSheet({ ...orderSheet, isActive: checked })
                  }}
                />
                <Label htmlFor="orders-sheet-active">Kích hoạt sheet đơn hàng</Label>
              </div>
              <Button
                className="gap-2"
                disabled={loadingSheets || saving === 'orders'}
                onClick={() => {
                  void saveOrderSheet()
                }}
              >
                <Save className="h-4 w-4" />
                {saving === 'orders' ? 'Đang lưu...' : 'Lưu sheet đơn hàng'}
              </Button>
            </div>
          </Card>

          {sheetMessage ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{sheetMessage}</p> : null}
          {sheetError ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{sheetError}</p> : null}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Integration Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Tích hợp
            </h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-border">
                <p className="font-semibold text-sm mb-2">Google Sheet</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {integrationLabel(googleSheetConfigured ? 'connected' : integrationStatus.google_sheet)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cấu hình bằng 2 form sheet ở bên trái. Credential Google không hiển thị trong portal.
                </p>
              </div>
              <div className="pb-4 border-b border-border">
                <p className="font-semibold text-sm mb-2">Pancake</p>
                <p className="text-xs text-muted-foreground mb-2">{integrationLabel(integrationStatus.pancake)}</p>
                <Button size="sm" variant="outline" className="w-full">
                  Cấu hình lại
                </Button>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">BEST Express</p>
                <p className="text-xs text-muted-foreground mb-2">{integrationLabel(integrationStatus.best)}</p>
                <Button size="sm" variant="outline" className="w-full">
                  Cấu hình lại
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          {/* <Card className="p-6 border-destructive/50 bg-destructive/5">
            <h2 className="text-lg font-semibold mb-4 text-destructive">Vùng nguy hiểm</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Những hành động trong phần này không thể hoàn tác
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                window.confirm('Hành động này đang bị khóa trong MVP để tránh xóa nhầm dữ liệu.')
              }}
            >
              Xoá tất cả dữ liệu
            </Button>
          </Card> */}
        </div>
      </div>
    </div>
  )
}

function toSheetForm(config: GoogleSheetConfig | null): SheetFormState {
  if (!config) {
    return emptySheetForm
  }
  return {
    isActive: config.isActive,
    orderMappingText: config.orderMapping ? JSON.stringify(config.orderMapping, null, 2) : '',
    phoneColumn: config.phoneColumn ?? '',
    sheetUrl: config.sheetUrl,
    worksheetName: config.worksheetName ?? '',
  }
}

function parseOrderMapping(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Mapping cột đơn hàng phải là JSON object.')
  }
  return parsed as Record<string, unknown>
}

function integrationLabel(status: string | undefined): string {
  if (status === 'connected') return 'Đã kết nối'
  if (status === 'degraded') return 'Có lỗi cần kiểm tra'
  return 'Chưa kết nối'
}
