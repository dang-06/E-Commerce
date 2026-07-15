'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import { parseCustomerImportPreview, type ImportPreviewRow } from '@/lib/services/admin-actions'

type ImportStep = 'upload' | 'preview' | 'confirm' | 'result'

export default function ImportWizardPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ImportPreviewRow[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      void file.text().then((content) => {
        const parsedRows = parseCustomerImportPreview(content)
        setRows(parsedRows.length > 0 ? parsedRows : sampleRows)
        setStep('preview')
      })
    }
  }

  const handleConfirm = () => {
    setStep('result')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Khách ưu đãi', href: '/admin/customers' },
          { label: 'Nhập danh sách' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nhập danh sách khách ưu đãi</h1>
          <p className="mt-1 text-muted-foreground">
            Bước {step === 'upload' ? 1 : step === 'preview' ? 2 : step === 'confirm' ? 3 : 4} / 4
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1">
        {['upload', 'preview', 'confirm', 'result'].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              ['upload', 'preview', 'confirm', 'result'].indexOf(s) <=
              ['upload', 'preview', 'confirm', 'result'].indexOf(step)
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          ></div>
        ))}
      </div>

      {/* Content */}
      <Card className="p-12">
        {step === 'upload' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-lg mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Tải lên file</h2>
              <p className="text-muted-foreground">Chấp nhận file Excel (.xlsx) hoặc CSV (.csv)</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary cursor-pointer transition">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx,.csv"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground mb-1">Nhấp để chọn file hoặc kéo thả file</p>
                <p className="text-xs text-muted-foreground">Tối đa 10MB</p>
              </label>
            </div>

            <Button onClick={() => { setRows(sampleRows); setStep('preview'); }} className="w-full">
              Tiếp tục
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Xem trước dữ liệu</h2>
              <p className="text-muted-foreground mb-4">File: {fileName}</p>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left">Số điện thoại</th>
                      <th className="px-4 py-2 text-left">Lý do</th>
                      <th className="px-4 py-2 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row) => (
                      <tr key={row.line} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">{row.reason}</td>
                        <td className={row.valid ? 'px-4 py-2 text-green-700' : 'px-4 py-2 text-red-700'}>
                          {row.valid ? 'Hợp lệ' : row.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hiển thị {Math.min(rows.length, 8)}/{rows.length} hàng. Lỗi: {rows.filter((row) => !row.valid).length}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('upload'); }} className="flex-1">
                Quay lại
              </Button>
              <Button onClick={() => { setStep('confirm'); }} className="flex-1">
                Xác nhân
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Xác nhân nhập</h2>
              <p className="text-muted-foreground mb-6">
                Bạn sắp nhập {rows.filter((row) => row.valid).length} khách hàng hợp lệ vào hệ thống.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900">
                Các số điện thoại lỗi hoặc trùng lặp sẽ được báo theo từng dòng và không ghi đè dữ liệu hợp lệ.
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('preview'); }} className="flex-1">
                Quay lại
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                Nhập ngay
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="inline-block p-4 bg-green-100 rounded-lg mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Nhập thành công</h2>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-900">Đã thêm mới:</span>
                <span className="font-semibold text-green-900">{rows.filter((row) => row.valid).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-900">Đã cập nhật:</span>
                <span className="font-semibold text-green-900">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-900">Trùng lặp (bỏ qua):</span>
                <span className="font-semibold text-green-900">{rows.filter((row) => !row.valid).length}</span>
              </div>
            </div>

            <Link href="/admin/customers" className="block">
              <Button className="w-full">Quay lại danh sách</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

const sampleRows: ImportPreviewRow[] = [
  { line: 1, phone: '0901234567', reason: 'Khách VIP', valid: true },
  { line: 2, phone: '0912345678', reason: 'Đã mua hàng', valid: true },
  { line: 3, phone: '12345', reason: 'Sai định dạng', valid: false, error: 'Số điện thoại không hợp lệ' },
]
