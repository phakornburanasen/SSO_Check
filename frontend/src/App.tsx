import { useEffect, useMemo, useState } from 'react'
import {
  Camera,
  Check,
  Circle,
  Download,
  Edit3,
  Eye,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Monitor,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ScanBarcode,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
  Zap, 
  Projector, 
  Video
} from 'lucide-react'
import Swal from 'sweetalert2'

type AgentRecord = {
  id: number
  created_at?: string | null
  hostname?: string | null
  ip_address?: string | null
  username?: string | null
  windows_version?: string | null
  cpu_name?: string | null
  ram_total_gb?: number | null
  Office_Version?: string | null
  Detail?: string | null
  Users?: string | null
  Dep?: string | null
  asset_no?: string | null
  img_png?: string | null
  Status_mac?: string | null
  user_check?: string | null
}

type FormState = {
  id: string
  created_at: string
  action: 'create' | 'update'
  Status_mac: string
  hostname: string
  ip_address: string
  username: string
  Users: string
  Dep: string
  asset_no: string
  windows_version: string
  Office_Version: string
  cpu_name: string
  ram_total_gb: string
  Detail: string
  user_check: string
}

type PendingImage = {
  blob: Blob
  name: string
  previewUrl: string
}

const DEFAULT_API_BASE = `http://${window.location.hostname}:8000/api/SSO_Check`
const DEFAULT_MUTATION_API_BASE = `http://${window.location.hostname}:10100/api/SSO_Check`
const API_BASE = (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
const MUTATION_API_BASE = (import.meta.env.VITE_MUTATION_API_BASE || DEFAULT_MUTATION_API_BASE).replace(/\/$/, '')
const apiURL = (path: string) => `${API_BASE}${path}`
const mutationApiURL = (path: string) => `${MUTATION_API_BASE}${path}`

const typeOptions = [
  { value: '', label: 'ทั้งหมด', icon: LayoutGrid },
  { value: 'C', label: 'Computer', icon: Monitor },
  { value: 'P', label: 'Printer', icon: Printer },
  { value: 'M', label: 'Monitor', icon: Monitor },
  { value: 'U', label: 'UPS', icon: Zap },
  { value: 'S', label: 'Scanner', icon: ScanBarcode },
  { value: 'J', label: 'Projector', icon: Projector },
  { value: 'VC', label: 'Video Conference', icon: Video },
]

const typeLabels: Record<string, string> = {
  C: 'Computer',
  P: 'Printer',
  M: 'Monitor',
  U: 'UPS',
  S: 'Scanner',
  J: 'Projector',
  VC: 'Video Conference',
}

const badgeClasses: Record<string, string> = {
  C: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  P: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  M: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  U: 'bg-amber-50 text-amber-700 ring-amber-200',
  S: 'bg-rose-50 text-rose-700 ring-rose-200',
  J: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  VC: 'bg-amber-50 text-amber-700 ring-amber-200',
}

const windowsOptions = ['Windows 10 Home','Windows 11 Home','Windows XP Pro', 'Windows 7 Pro', 'Windows 8.1 Pro', 'Windows 10 Pro', 'Windows 11 Pro']

const officeOptions = [
  'Microsoft Office Home & Business 2010',
  'Microsoft Office Home & Business 2013',
  'Microsoft Office Home & Business 2016',
  'Microsoft Office Home & Business 2019',
  'Microsoft Office Home & Business 2021',
  'Microsoft Office Home & Business 2024',
  'Microsoft 365 Basic',
  'Microsoft 365 STD',
]

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),0_1px_1px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100'

function App() {
  const [records, setRecords] = useState<AgentRecord[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewerImage, setViewerImage] = useState('')
  const [form, setForm] = useState<FormState>(() => emptyForm(getUserCheck()))
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [exportAll, setExportAll] = useState(true)
  const [selectedExportChecks, setSelectedExportChecks] = useState<string[]>([])
  const [exportUserCheckOptions, setExportUserCheckOptions] = useState<string[]>([])

  const userCheck = useMemo(() => getUserCheck(), [])

  useEffect(() => {
    loadRecords(filter)
  }, [filter])

  useEffect(() => {
    loadExportUserChecks()
  }, [])

  const visibleRecords = records.filter((row) => {
    const text = [
      row.hostname,
      row.ip_address,
      row.username,
      row.Status_mac,
      row.windows_version,
      row.cpu_name,
      row.Office_Version,
      row.Detail,
      row.Users,
      row.Dep,
      row.asset_no,
      row.user_check,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const stats = {
    total: records.length,
    computers: records.filter((row) => row.Status_mac === 'C').length,
    other: records.filter((row) => row.Status_mac && row.Status_mac !== 'C').length,
  }

  const userCheckOptions = exportUserCheckOptions

  async function loadRecords(nextFilter = filter, options: { silent?: boolean } = {}) {
    const silent = options.silent ?? records.length > 0
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')
    try {
      const params = new URLSearchParams({ action: 'read' })
      if (nextFilter) params.set('Status_mac', nextFilter)
      const res = await fetch(apiURL(`/agents?${params}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลไม่สำเร็จ')
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  async function loadExportUserChecks() {
    try {
      const res = await fetch(apiURL('/agents?action=read'))
      const data: AgentRecord[] = await res.json()
      if (!res.ok) return
      const options = Array.from(new Set(data.map((row) => row.user_check).filter((value): value is string => Boolean(value)))).sort((a, b) =>
        a.localeCompare(b),
      )
      setExportUserCheckOptions(options)
    } catch {
      setExportUserCheckOptions([])
    }
  }

  function openCreate() {
    clearPendingImages()
    setForm(emptyForm(userCheck))
    setExistingImages([])
    setRemovedImages([])
    setModalOpen(true)
  }

  async function openEdit(id: number) {
    setError('')
    try {
      const res = await fetch(apiURL(`/agents?action=get&id=${id}`))
      const row: AgentRecord & { error?: string } = await res.json()
      if (!res.ok) throw new Error(row.error || 'ไม่พบข้อมูล')
      clearPendingImages()
      setForm({
        id: String(row.id),
        created_at: row.created_at || '',
        action: 'update',
        Status_mac: row.Status_mac || '',
        hostname: row.hostname || '',
        ip_address: row.ip_address || '',
        username: row.username || '',
        Users: row.Users || '',
        Dep: row.Dep || '',
        asset_no: row.asset_no || '',
        windows_version: row.windows_version || '',
        Office_Version: row.Office_Version || '',
        cpu_name: row.cpu_name || '',
        ram_total_gb: row.ram_total_gb == null ? '' : String(row.ram_total_gb),
        Detail: row.Detail || '',
        user_check: row.user_check || userCheck,
      })
      setExistingImages(splitImages(row.img_png))
      setRemovedImages([])
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เปิดข้อมูลไม่สำเร็จ')
    }
  }

  function closeModal() {
    setModalOpen(false)
    clearPendingImages()
    setRemovedImages([])
  }

  function updateForm(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onImageSelect(files: FileList | null) {
    if (!files?.length) return
    const incoming = Array.from(files)
    if (existingImages.length + pendingImages.length + incoming.length > 3) {
      setError('แนบรูปได้สูงสุด 3 รูป')
      return
    }

    try {
      const compressed = await Promise.all(incoming.map((file) => compressImage(file)))
      setPendingImages((current) => [...current, ...compressed])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เตรียมรูปภาพไม่สำเร็จ')
    }
  }

  function removeExistingImage(src: string) {
    setExistingImages((current) => current.filter((item) => item !== src))
    setRemovedImages((current) => [...current, src])
  }

  function removePendingImage(index: number) {
    setPendingImages((current) => {
      const image = current[index]
      if (image) URL.revokeObjectURL(image.previewUrl)
      return current.filter((_, i) => i !== index)
    })
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res =
        pendingImages.length === 0
          ? await fetchWithTimeout(
              mutationApiURL('/agents'),
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, removed_images: removedImages.join(',') }),
              },
              30000,
            )
          : await fetchWithTimeout(mutationApiURL('/agents'), { method: 'POST', body: buildFormData() }, 30000)
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || result.error || 'บันทึกไม่สำเร็จ')

      setMessage(result.message || 'บันทึกสำเร็จ')
      closeModal()
      await loadRecords(filter, { silent: true })
      await loadExportUserChecks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(row: AgentRecord) {
    const displayName = row.hostname || row.asset_no || `#${row.id}`
    const detail = [row.asset_no, row.ip_address, typeLabels[row.Status_mac || ''] || row.Status_mac].filter(Boolean).join(' / ')
    const confirmation = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล',
      html: `<div class="delete-alert-content"><strong>${escapeHtml(displayName)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ''}<small>เมื่อลบแล้วข้อมูลรายการนี้จะถูกนำออกจากระบบ</small></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusCancel: true,
      buttonsStyling: false,
      customClass: {
        popup: 'sso-delete-alert',
        icon: 'sso-delete-alert-icon',
        title: 'sso-delete-alert-title',
        actions: 'sso-delete-alert-actions',
        confirmButton: 'sso-delete-alert-confirm',
        cancelButton: 'sso-delete-alert-cancel',
      },
    })

    if (!confirmation.isConfirmed) return

    setError('')
    setMessage('')
    try {
      const res = await fetchWithTimeout(
        mutationApiURL('/agents'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: String(row.id) }),
        },
        30000,
      )
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || 'ลบไม่สำเร็จ')
      setMessage(result.message || 'ลบข้อมูลเรียบร้อย')
      void Swal.fire({
        title: 'ลบข้อมูลเรียบร้อย',
        text: result.message || `${displayName} ถูกลบออกจากระบบแล้ว`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: 'sso-delete-alert',
          title: 'sso-delete-alert-title',
        },
      })
      await loadRecords(filter, { silent: true })
      await loadExportUserChecks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ลบไม่สำเร็จ'
      setError(errorMessage)
      void Swal.fire({
        title: 'ลบไม่สำเร็จ',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'รับทราบ',
        buttonsStyling: false,
        customClass: {
          popup: 'sso-delete-alert',
          title: 'sso-delete-alert-title',
          confirmButton: 'sso-delete-alert-cancel',
        },
      })
    }
  }

  async function exportExcel() {
    setError('')
    setMessage('')
    try {
      const params = new URLSearchParams()
      if (exportAll || selectedExportChecks.length === 0) {
        params.set('all', '1')
      } else {
        selectedExportChecks.forEach((item) => params.append('userCheck', item))
      }
      const res = await fetch(apiURL(`/export${params.toString() ? `?${params}` : ''}`))
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export Excel ไม่สำเร็จ')
      }
      const blob = await res.blob()
      const filename =
        !exportAll && selectedExportChecks.length === 1
          ? `SSO_Checker_${safeFilename(selectedExportChecks[0])}.xlsx`
          : !exportAll && selectedExportChecks.length > 1
            ? 'SSO_Checker_Selected.xlsx'
            : 'SSO_Check.xlsx'
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(href)
      setMessage(`Export ${filename} สำเร็จ`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export Excel ไม่สำเร็จ')
    }
  }

  function buildFormData() {
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('removed_images', removedImages.join(','))
    pendingImages.forEach((image) => data.append('images[]', image.blob, image.name))
    return data
  }

  function toggleExportUserCheck(value: string) {
    setExportAll(false)
    setSelectedExportChecks((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  function clearPendingImages() {
    setPendingImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      return []
    })
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef2f7_0%,#f8fafc_46%,#e7f3f1_100%)] p-2 text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
        <header className="flex h-14 shrink-0 items-center justify-between rounded-lg border border-white/70 bg-white/70 px-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold leading-4">SSO CHECK</h1>
              <p className="text-xs font-semibold text-slate-500">Agent workspace</p>
            </div>
          </div>

          <nav className="hidden h-12 min-w-[264px] items-center justify-center gap-1 rounded-md border border-white/70 bg-white/45 px-2 shadow-inner sm:flex">
            {['Tools', 'Assets', 'Reports'].map((item, index) => (
              <button
                key={item}
                type="button"
                className={`h-9 rounded-md px-5 text-sm font-bold ${index === 1 ? 'bg-white/90 text-teal-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-50">
              <Circle size={8} className="fill-teal-500 text-teal-500" />
            </span>
            {loading ? 'Loading assets' : 'Ready'}
          </div>
        </header>

        <main className="grid grid-cols-1 gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-white/70 bg-white/62 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:min-h-0 lg:overflow-y-auto">
            <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">Agent TNLX</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Check Asset</h2>
            <p className="mt-2 text-sm text-slate-600">จัดการข้อมูลเครื่องและอุปกรณ์ในระบบ SSO</p>

            <button
              type="button"
              onClick={openCreate}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(15,118,110,0.22)] hover:bg-teal-800"
            >
              <Plus size={18} />
              เพิ่มอุปกรณ์
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-teal-200/80 bg-white/70 px-4 text-sm font-extrabold text-teal-800 shadow-sm backdrop-blur hover:bg-teal-50/80"
            >
              <Download size={17} />
              Export Excel
            </button>

            <div className="mt-4 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหา..."
                  className="h-11 w-full rounded-md border border-white/80 bg-white/75 pl-10 pr-3 text-sm outline-none shadow-inner backdrop-blur focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="ทั้งหมด" value={stats.total} />
                <Stat label="Computer" value={stats.computers} />
                <Stat label="อื่น ๆ" value={stats.other} />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/70 bg-white/50 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-extrabold">ประเภท</h3>
                <button type="button" onClick={() => loadRecords()} className="rounded-md p-1.5 text-slate-500 hover:bg-white/70" title="Refresh">
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {typeOptions.map((item) => {
                  const Icon = item.icon
                  const active = filter === item.value
                  return (
                    <button
                      key={item.value || 'all'}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-xs font-extrabold transition ${
                        active
                          ? 'border-teal-500 bg-teal-50/85 text-teal-800 shadow-sm ring-2 ring-teal-100'
                          : 'border-white/75 bg-white/55 text-slate-700 shadow-sm backdrop-blur hover:border-teal-300 hover:bg-white/75'
                      }`}
                    >
                      <Icon size={19} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/70 bg-white/50 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-extrabold">Export Scope</h3>
                <span className="text-xs font-semibold text-slate-500">{exportAll ? 'ทั้งหมด' : `${selectedExportChecks.length} selected`}</span>
              </div>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/75 bg-white/55 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
                  <input
                    type="checkbox"
                    checked={exportAll}
                    onChange={(event) => {
                      setExportAll(event.target.checked)
                      if (event.target.checked) setSelectedExportChecks([])
                    }}
                    className="h-4 w-4 accent-teal-700"
                  />
                  Export ทั้งหมด
                </label>
                <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                  {userCheckOptions.length ? (
                    userCheckOptions.map((item) => (
                      <label key={item} className="flex cursor-pointer items-center gap-2 rounded-md border border-white/75 bg-white/60 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white/85">
                        <input
                          type="checkbox"
                          checked={!exportAll && selectedExportChecks.includes(item)}
                          onChange={() => toggleExportUserCheck(item)}
                          className="h-4 w-4 accent-teal-700"
                        />
                        {item}
                      </label>
                    ))
                  ) : (
                    <p className="rounded-md bg-white/55 px-3 py-2 text-xs font-semibold text-slate-500">ยังไม่มี user_check ให้เลือก</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/70 bg-white/50 p-4 shadow-sm backdrop-blur">
              <h3 className="text-sm font-extrabold">Session</h3>
              <div className="mt-3 flex items-center gap-3 rounded-md border border-white/70 bg-white/55 p-3 shadow-inner">
                <Server size={18} className="text-teal-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{userCheck || '-'}</p>
                  <p className="text-xs text-slate-500">User check</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex flex-col rounded-lg border border-white/70 bg-white/58 shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:min-h-0 lg:overflow-hidden">
            <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/70 bg-white/62 px-4 backdrop-blur">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold leading-5">Asset List</h2>
                  {refreshing && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">
                      <Loader2 className="animate-spin" size={12} />
                      Sync
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {visibleRecords.length} รายการ {filter ? `ใน ${typeLabels[filter]}` : 'ทั้งหมด'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => loadRecords()} className="h-9 rounded-md border border-white/70 bg-white/65 px-3 text-sm font-bold shadow-sm backdrop-blur hover:bg-white/90">
                  Refresh
                </button>
                <button type="button" onClick={openCreate} className="h-9 rounded-md bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800">
                  Add
                </button>
              </div>
            </div>

            {(error || message) && (
              <div className={`mx-4 mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error ? <X size={16} /> : <Check size={16} />}
                {error || message}
              </div>
            )}

            <div className="overflow-auto bg-slate-100/45 lg:min-h-0 lg:flex-1">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white/78 text-xs font-extrabold uppercase tracking-wide text-slate-500 backdrop-blur">
                  <tr>
                    {['#', 'Asset No', 'Hostname', 'IP', 'Username', 'Type', 'Dep', 'Windows', 'CPU', 'RAM', 'Office', 'Detail', 'Users', 'Images', 'Check', 'Action'].map((head) => (
                      <th key={head} className="whitespace-nowrap border-b border-slate-200 px-3 py-3">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 bg-white/68 backdrop-blur">
                  {loading && records.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-16 text-center text-slate-500">
                        <Loader2 className="mx-auto mb-2 animate-spin text-teal-700" size={26} />
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : visibleRecords.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-16 text-center text-slate-500">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    visibleRecords.map((row, index) => (
                      <tr key={row.id} className="hover:bg-white/85">
                        <td className="px-3 py-3 font-bold text-slate-500">{index + 1}</td>
                        <td className="px-3 py-3 font-bold text-slate-700">{row.asset_no || '-'}</td>
                        <td className="px-3 py-3 font-extrabold text-slate-950">{row.hostname || '-'}</td>
                        <td className="px-3 py-3 text-slate-600">{row.ip_address || '-'}</td>
                        <td className="px-3 py-3 text-slate-600">{row.username || '-'}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-extrabold ring-1 ${badgeClasses[row.Status_mac || ''] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                            {typeLabels[row.Status_mac || ''] || row.Status_mac || '-'}
                          </span>
                        </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{row.Dep || '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{row.windows_version || '-'}</td>
                        <td className="max-w-[150px] truncate px-3 py-3 text-xs text-slate-600">{row.cpu_name || '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{row.ram_total_gb ?? '-'}</td>
                        <td className="max-w-[150px] truncate px-3 py-3 text-xs text-slate-600">{row.Office_Version || '-'}</td>
                        <td className="max-w-[130px] truncate px-3 py-3 text-xs text-slate-600">{row.Detail || '-'}</td>
                        <td className="px-3 py-3 text-xs text-slate-600">{row.Users || '-'}</td>
                      <td className="px-3 py-3">
                          <div className="flex justify-center gap-1">
                            {splitImages(row.img_png).length ? (
                              splitImages(row.img_png).map((src) => (
                                <button key={src} type="button" onClick={() => setViewerImage(toImageURL(src))} className="group relative">
                                  <img src={toImageURL(src)} alt="" className="h-11 w-11 rounded-md border border-slate-200 object-cover group-hover:border-teal-500" />
                                </button>
                              ))
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600">{row.user_check || '-'}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-1">
                            <button type="button" title="แก้ไข" onClick={() => openEdit(row.id)} className="rounded-md p-2 text-sky-700 hover:bg-sky-50">
                              <Edit3 size={16} />
                            </button>
                            <button type="button" title="ลบ" onClick={() => deleteRecord(row)} className="rounded-md p-2 text-red-600 hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold leading-5 text-slate-950">{form.action === 'create' ? 'เพิ่มอุปกรณ์ใหม่' : 'แก้ไขอุปกรณ์'}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {form.action === 'create' ? 'บันทึกอุปกรณ์เข้า Agent_TNLX' : `บันทึกเข้าเมื่อ ${formatInsertedAt(form.created_at)}`}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-md p-2 text-slate-500 hover:bg-white hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitForm} className="max-h-[calc(92vh-73px)] overflow-y-auto bg-white">
              <div className="space-y-4 p-5">
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">ข้อมูลหลัก</h3>
                      <p className="text-xs font-medium text-slate-500">ข้อมูลระบุตัวตนและผู้ใช้งาน</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{typeLabels[form.Status_mac] || 'เลือกประเภท'}</span>
                  </div>

                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-bold text-slate-700">ประเภทอุปกรณ์</label>
                    <select required value={form.Status_mac} onChange={(event) => updateForm('Status_mac', event.target.value)} className={inputClass}>
                      <option value="">-- เลือกประเภท --</option>
                      {typeOptions
                        .filter((item) => item.value)
                        .map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField label="Asset No. (รหัสทรัพย์สิน)" value={form.asset_no} onChange={(value) => updateForm('asset_no', value)} placeholder="เช่น 5100000...." maxLength={20} />
                    <TextField label="Hostname" required value={form.hostname} onChange={(value) => updateForm('hostname', value)} placeholder="เช่น TNLX0001" />
                    <TextField label="IP Address" required value={form.ip_address} onChange={(value) => updateForm('ip_address', value)} placeholder="เช่น 10.X.X.X" />
                    <TextField label="Username" value={form.username} onChange={(value) => updateForm('username', value)} placeholder="THANULUX\TXXXX" />
                    <TextField label="Users" value={form.Users} onChange={(value) => updateForm('Users', value)} placeholder="ชื่อผู้ใช้งาน" />
                    <TextField label="Dep (แผนก)" value={form.Dep} onChange={(value) => updateForm('Dep', value)} placeholder="เช่น 2AM04" />
                  </div>
                </section>

                {form.Status_mac === 'C' && (
                  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900">ข้อมูล Computer</h3>
                      <p className="text-xs font-medium text-slate-500">Spec เครื่อง, Windows และ Office</p>
                    </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField label="Windows Version" value={form.windows_version} options={windowsOptions} onChange={(value) => updateForm('windows_version', value)} />
                    <SelectField label="Office Version" value={form.Office_Version} options={officeOptions} onChange={(value) => updateForm('Office_Version', value)} />
                    <TextField label="CPU" value={form.cpu_name} onChange={(value) => updateForm('cpu_name', value)} placeholder="12th Gen Intel i5-1235U" />
                    <TextField label="RAM (GB)" type="number" value={form.ram_total_gb} onChange={(value) => updateForm('ram_total_gb', value)} placeholder="16" />
                  </div>
                  </section>
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">รายละเอียดเพิ่มเติม</h3>
                    <p className="text-xs font-medium text-slate-500">บันทึกลง Detail</p>
                  </div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Detail</label>
                  <textarea
                    value={form.Detail}
                    onChange={(event) =>
                      updateForm('Detail', event.target.value.toUpperCase())
                    }
                    rows={3}
                    maxLength={100}
                    className={`${inputClass} h-auto min-h-24 py-3 leading-6 uppercase`}
                  />
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <ImageIcon size={16} className="text-teal-700" />
                    รูปภาพ
                  </div>
                  <span className="text-xs font-semibold text-slate-500">สูงสุด 3 รูป</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-teal-200 bg-teal-50 px-4 py-5 text-center text-sm font-semibold text-slate-600 transition hover:border-teal-500 hover:bg-teal-100/60">
                    <ImageIcon className="mb-2 text-teal-700" size={24} />
                    เลือกรูปจากคลังภาพ
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onImageSelect(event.target.files)} />
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-600 transition hover:border-teal-500 hover:bg-slate-100">
                    <Camera className="mb-2 text-teal-700" size={24} />
                    ถ่ายรูปด้วยกล้อง
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(event) => onImageSelect(event.target.files)} />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {existingImages.map((src) => (
                    <ImageThumb key={src} src={toImageURL(src)} onView={() => setViewerImage(toImageURL(src))} onRemove={() => removeExistingImage(src)} />
                  ))}
                  {pendingImages.map((image, index) => (
                    <ImageThumb key={image.previewUrl} src={image.previewUrl} onView={() => setViewerImage(image.previewUrl)} onRemove={() => removePendingImage(index)} />
                  ))}
                </div>
                </section>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="h-10 rounded-md px-5 font-bold text-slate-600 hover:bg-white">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 font-extrabold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewerImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={() => setViewerImage('')}>
          <div className="relative max-h-[90vh] max-w-4xl">
            <button type="button" className="absolute -top-11 right-0 rounded-md p-2 text-white hover:bg-white/10" onClick={() => setViewerImage('')}>
              <X size={26} />
            </button>
            <img src={viewerImage} alt="" className="max-h-[88vh] w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/75 bg-white/62 px-2 py-2 shadow-sm backdrop-blur">
      <p className="text-lg font-extrabold leading-5">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-extrabold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClass}
      />
    </label>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-extrabold text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">-- เลือก --</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function ImageThumb({ src, onView, onRemove }: { src: string; onView: () => void; onRemove: () => void }) {
  return (
    <div className="relative">
      <button type="button" onClick={onView} className="block rounded-md border border-white/80 bg-white/55 p-0.5 shadow-sm backdrop-blur hover:border-teal-500" title="ดูรูป">
        <img src={src} alt="" className="h-20 w-20 rounded object-cover" />
        <Eye className="absolute bottom-2 left-2 rounded bg-white/90 p-1 text-slate-700" size={22} />
      </button>
      <button type="button" onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700" title="ลบรูป">
        <X size={14} />
      </button>
    </div>
  )
}

function emptyForm(userCheck: string): FormState {
  return {
    id: '',
    created_at: '',
    action: 'create',
    Status_mac: '',
    hostname: '',
    ip_address: '',
    username: '',
    Users: '',
    Dep: '',
    asset_no: '',
    windows_version: '',
    Office_Version: '',
    cpu_name: '',
    ram_total_gb: '',
    Detail: '',
    user_check: userCheck,
  }
}

function getUserCheck() {
  return new URLSearchParams(window.location.search).get('userCheck') || ''
}

function safeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'export'
}

function splitImages(value?: string | null) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toImageURL(src: string) {
  if (/^https?:\/\//i.test(src)) return src
  return mutationApiURL(`/${src.replace(/^\/+/, '')}`)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char]
  })
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

function formatInsertedAt(value?: string | null) {
  if (!value) return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!match) return value
  const [, year, month, day, hour, minute, second] = match
  return `${day}/${month}/${Number(year) + 543} ${hour}:${minute}:${second}`
}

function compressImage(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    if (file.size > 30 * 1024 * 1024) {
      reject(new Error('ไฟล์รูปใหญ่เกิน 30MB'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('รูปไม่ถูกต้อง'))
      image.onload = () => {
        const maxDim = 1600
        let width = image.width
        let height = image.height
        if (width > maxDim || height > maxDim) {
          const ratio = maxDim / Math.max(width, height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('บีบอัดรูปไม่สำเร็จ'))
          return
        }
        context.drawImage(image, 0, 0, width, height)
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('บีบอัดรูปไม่สำเร็จ'))
              return
            }
            const ext = mime === 'image/png' ? 'png' : 'jpg'
            const name = `${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 8)}.${ext}`
            resolve({ blob, name, previewUrl: URL.createObjectURL(blob) })
          },
          mime,
          mime === 'image/jpeg' ? 0.75 : 1,
        )
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default App
