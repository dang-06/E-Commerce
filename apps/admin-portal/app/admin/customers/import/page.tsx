'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, CheckCircle, Download } from 'lucide-react'
import {
  buildEligibleCustomersSampleCsv,
  parseCustomerImportPreview,
  type ImportPreviewRow,
} from '@/lib/services/admin-actions'
import { eligibleCustomerService, getErrorMessage } from '@/lib/services/api-service'

type ImportStep = 'upload' | 'preview' | 'confirm' | 'result'

export default function ImportWizardPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportPreviewRow[]>([])
  const [spreadsheetPreview, setSpreadsheetPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported: number; updated: number; duplicates: number; errors: number } | null>(
    null,
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setError('')
      const isSpreadsheet = /\.(xlsx|xls)$/i.test(selectedFile.name)
      setSpreadsheetPreview(isSpreadsheet)
      if (isSpreadsheet) {
        setRows([])
        setStep('confirm')
        return
      }
      void selectedFile.text().then((content) => {
        const parsedRows = parseCustomerImportPreview(content)
        setRows(parsedRows)
        setStep('preview')
      })
    }
  }

  const handleConfirm = async () => {
    if (!file) {
      setError('Vui lòng chọn file CSV/Excel trước khi nhập.')
      setStep('upload')
      return
    }

    setLoading(true)
    setError('')
    try {
      const imported = await eligibleCustomerService.importFile(file)
      setResult(imported)
      setStep('result')
    } catch (e) {
      console.error(e)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleFile = () => {
    const blob = new Blob([buildEligibleCustomersSampleCsv()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'eligible-customers-sample.csv'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <Button variant="outline" className="gap-2" onClick={downloadSampleFile}>
          <Download className="h-4 w-4" />
          Tải file mẫu
        </Button>
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
              <p className="text-muted-foreground">Chấp nhận CSV, TSV, TXT, XLS hoặc XLSX</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary cursor-pointer transition">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".csv,.tsv,.txt,.xls,.xlsx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground mb-1">Nhấp để chọn file hoặc kéo thả file</p>
                <p className="text-xs text-muted-foreground">Tối đa 10MB</p>
              </label>
            </div>

            {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
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
                      <th className="px-4 py-2 text-left">Mã khách/Nguồn</th>
                      <th className="px-4 py-2 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row) => (
                      <tr key={row.line} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">{row.sourceCustomerId || '-'}</td>
                        <td className="px-4 py-2">
                          <span className={row.valid ? 'text-emerald-700' : 'font-medium text-rose-700'}>
                            {row.valid ? 'Hợp lệ' : row.error}
                          </span>
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
              <Button onClick={() => { setStep('confirm'); }} className="flex-1" disabled={rows.length === 0}>
                Xác nhận
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Xác nhận nhập</h2>
              <p className="text-muted-foreground mb-6">
                {spreadsheetPreview
                  ? 'File Excel sẽ được xử lý trực tiếp bởi hệ thống.'
                  : `Bạn sắp nhập ${rows.filter((row) => row.valid).length} khách hàng hợp lệ vào hệ thống.`}
              </p>
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Các số điện thoại lỗi hoặc trùng lặp sẽ được báo theo từng dòng và không ghi đè dữ liệu hợp lệ.
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(spreadsheetPreview ? 'upload' : 'preview')
                }}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                onClick={() => {
                  void handleConfirm()
                }}
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Đang nhập...' : 'Nhập ngay'}
              </Button>
            </div>
            {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="mb-4 inline-block rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle className="h-8 w-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Nhập thành công</h2>
            </div>

            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-900">Đã thêm mới:</span>
                <span className="font-semibold text-emerald-950">{result?.imported ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Đã cập nhật:</span>
                <span className="font-semibold text-emerald-950">{result?.updated ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Trùng lặp (bỏ qua):</span>
                <span className="font-semibold text-emerald-950">{result?.duplicates ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Không hợp lệ:</span>
                <span className="font-semibold text-emerald-950">{result?.errors ?? 0}</span>
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
