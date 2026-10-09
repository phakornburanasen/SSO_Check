import { useEffect, useId, useMemo, useState } from 'react'
import {
  Camera,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Crop,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ScanBarcode,
  Search,
  Server,
  Trash2,
  Unlock,
  UserRound,
  X,
  Zap,
  Projector,
  Video,
  ZoomIn,
} from 'lucide-react'
import Swal from 'sweetalert2'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
  Active?: string | null
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
  Active: string
}

type PendingImage = {
  blob: Blob
  name: string
  previewUrl: string
}

type LoginResponse = {
  success?: boolean
  username?: string
  displayName?: string
  role?: string
  token?: string
  expiresAt?: number
  message?: string
  error?: string
}

type LoginSession = {
  username: string
  displayName: string
  role: string
  token: string
  expiresAt: number
}

type ActivityReportRecord = {
  title?: string | null
  Activity_Code?: string | null
  Provider?: string | null
  Provider_Department?: string | null
  Activity_Name?: string | null
  Unit?: string | null
  Rate?: number | null
  Year?: string | null
  Month?: string | null
  Department?: string | null
  Qty?: number | null
  Amount?: number | null
}

type WorkspaceView = 'assets' | 'reports'

type CropReplaceTarget = { kind: 'pending'; index: number } | { kind: 'existing'; src: string }

type CropQueueItem = {
  file: File
  url: string
  replace?: CropReplaceTarget
}

const cropAspectPresets: { label: string; value: number | null }[] = [
  { label: 'เต็มภาพ', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
]

const DEFAULT_API_BASE = `http://${window.location.hostname}:10100/api/SSO_Check`
const API_BASE = (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
const MUTATION_API_BASE = (import.meta.env.VITE_MUTATION_API_BASE || API_BASE).replace(/\/$/, '')
const apiURL = (path: string) => `${API_BASE}${path}`
const mutationApiURL = (path: string) => `${MUTATION_API_BASE}${path}`
const SAP_SEARCH_URL = 'http://10.0.32.71/SearchAsset/'
const SESSION_KEY = 'sso_check_login_session'
const LEFT_CARD_HIDDEN_KEY = 'sso_check_left_card_hidden'
const ACTIVE_VIEW_KEY = 'sso_check_active_view'

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

const badgeVariants: Record<string, 'info' | 'success' | 'violet' | 'warning' | 'rose'> = {
  C: 'info', P: 'success', M: 'violet', U: 'warning', S: 'rose', J: 'violet', VC: 'warning',
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

const inputClass = 'native-select'
const SAVE_NOTICE_MS = 2000
const pageSizeOptions = [10, 25, 50, 100]
const monthOptions = [
  { value: '', label: 'ทุกเดือน' },
  ...Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: String(index + 1).padStart(2, '0') })),
]

const reportColumns: { key: keyof ActivityReportRecord; label: string; align?: 'right' }[] = [
  { key: 'Activity_Code', label: 'Activity Code' },
  { key: 'Provider', label: 'Provider' },
  { key: 'Provider_Department', label: 'Provider_Department' },
  { key: 'Activity_Name', label: 'Activity_Name' },
  { key: 'Unit', label: 'Unit' },
  { key: 'Rate', label: 'Rate', align: 'right' },
  { key: 'Year', label: 'Year' },
  { key: 'Month', label: 'Month' },
  { key: 'Department', label: 'Department' },
  { key: 'Qty', label: 'Qty', align: 'right' },
  { key: 'Amount', label: 'Amount', align: 'right' },
]

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
  const [form, setForm] = useState<FormState>(() => emptyForm(getInitialUserCheck()))
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([])
  const [cropTotal, setCropTotal] = useState(0)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropAspect, setCropAspect] = useState<number | null>(null)
  const [naturalAspect, setNaturalAspect] = useState(4 / 3)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropping, setCropping] = useState(false)
  const [exportAll, setExportAll] = useState(true)
  const [selectedExportChecks, setSelectedExportChecks] = useState<string[]>([])
  const [hideDriveLetter, setHideDriveLetter] = useState(false)
  const [exportUserCheckOptions, setExportUserCheckOptions] = useState<string[]>([])
  const [assetListUserCheck, setAssetListUserCheck] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [session, setSession] = useState<LoginSession | null>(() => loadLoginSession())
  const [leftCardHidden, setLeftCardHidden] = useState(() => readLeftCardHidden())
  const [activeView, setActiveView] = useState<WorkspaceView>(() => readActiveView())
  const [reportRecords, setReportRecords] = useState<ActivityReportRecord[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportRefreshing, setReportRefreshing] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [reportYear, setReportYear] = useState('')
  const [reportMonth, setReportMonth] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [reportPageSize, setReportPageSize] = useState(10)
  const [reportCurrentPage, setReportCurrentPage] = useState(1)

  const queryUserCheck = useMemo(() => getUserCheck(), [])
  const userCheck = session?.username || queryUserCheck || ''

  useEffect(() => {
    if (!userCheck) {
      setLoading(false)
      return
    }
    loadRecords(filter)
  }, [filter, userCheck])

  useEffect(() => {
    if (!userCheck) return
    loadExportUserChecks()
  }, [userCheck])

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_VIEW_KEY, activeView)
    } catch {
      // ignore storage errors
    }
  }, [activeView])

  useEffect(() => {
    if (!userCheck || activeView !== 'reports') return
    loadActivityReport()
  }, [activeView, userCheck, reportYear, reportMonth])

  useEffect(() => {
    if (!session) return
    const expiresInMs = (session.expiresAt * 1000) - Date.now()
    if (expiresInMs <= 0) {
      clearLoginSession()
      setSession(null)
      return
    }
    const timer = window.setTimeout(() => {
      clearLoginSession()
      setSession(null)
    }, expiresInMs)
    return () => window.clearTimeout(timer)
  }, [session])

  useEffect(() => {
    if (!session || queryUserCheck === session.username) return
    const base = import.meta.env.BASE_URL || '/SSO_Check/'
    window.history.replaceState(null, '', `${base}?userCheck=${encodeURIComponent(session.username)}`)
  }, [queryUserCheck, session])

  // Success notices fade out on their own; errors stay until the next action.
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), SAVE_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    if (!reportMessage) return
    const timer = window.setTimeout(() => setReportMessage(''), SAVE_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [reportMessage])

  const currentCropItem = cropQueue[0] || null

  useEffect(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropAspect(null)
    setCroppedAreaPixels(null)
  }, [currentCropItem?.url])

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
    const matchesSearch = text.includes(search.toLowerCase())
    const matchesUserCheck = !assetListUserCheck || row.user_check === assetListUserCheck
    return matchesSearch && matchesUserCheck
  })

  const stats = {
    total: records.length,
    computers: records.filter((row) => row.Status_mac === 'C').length,
    other: records.filter((row) => row.Status_mac && row.Status_mac !== 'C').length,
  }

  const userCheckOptions = exportUserCheckOptions
  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = visibleRecords.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize
  const pageEnd = Math.min(pageStart + pageSize, visibleRecords.length)
  const pagedRecords = visibleRecords.slice(pageStart, pageEnd)
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages)
  const visibleReportRecords = reportRecords.filter((row) => {
    const searchText = reportSearch.trim().toLowerCase()
    if (!searchText) return true
    return reportColumns
      .map((column) => row[column.key])
      .filter((value) => value != null)
      .join(' ')
      .toLowerCase()
      .includes(searchText)
  })
  const reportTotalQty = reportRecords.reduce((sum, row) => sum + numberValue(row.Qty), 0)
  const reportTotalAmount = reportRecords.reduce((sum, row) => sum + numberValue(row.Amount), 0)
  const reportDepartmentCount = new Set(reportRecords.map((row) => String(row.Department || '').trim()).filter(Boolean)).size
  const reportChartData = buildDepartmentQtyChart(reportRecords)
  const reportMaxQty = Math.max(1, ...reportChartData.map((item) => item.qty))
  const reportTotalPages = Math.max(1, Math.ceil(visibleReportRecords.length / reportPageSize))
  const safeReportCurrentPage = Math.min(reportCurrentPage, reportTotalPages)
  const reportPageStart = visibleReportRecords.length === 0 ? 0 : (safeReportCurrentPage - 1) * reportPageSize
  const reportPageEnd = Math.min(reportPageStart + reportPageSize, visibleReportRecords.length)
  const pagedReportRecords = visibleReportRecords.slice(reportPageStart, reportPageEnd)
  const reportPaginationItems = getPaginationItems(safeReportCurrentPage, reportTotalPages)

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

  async function loadActivityReport(options: { silent?: boolean } = {}) {
    const silent = options.silent ?? reportRecords.length > 0
    if (silent) {
      setReportRefreshing(true)
    } else {
      setReportLoading(true)
    }
    setReportError('')
    try {
      const params = new URLSearchParams()
      if (reportYear.trim()) params.set('year', reportYear.trim())
      if (reportMonth.trim()) params.set('month', reportMonth.trim())
      const res = await fetch(apiURL(`/reports/activity${params.toString() ? `?${params}` : ''}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'โหลดรายงานไม่สำเร็จ')
      setReportRecords(data)
      setReportCurrentPage(1)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'โหลดรายงานไม่สำเร็จ')
    } finally {
      if (silent) {
        setReportRefreshing(false)
      } else {
        setReportLoading(false)
      }
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
        Active: normalizeActive(row.Active),
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

  function onImageSelect(files: FileList | null) {
    if (!files?.length) return
    const incoming = Array.from(files)
    if (existingImages.length + pendingImages.length + incoming.length > 3) {
      setError('แนบรูปได้สูงสุด 3 รูป')
      return
    }

    setError('')
    const items = incoming.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setCropTotal((current) => current + items.length)
    setCropQueue((current) => [...current, ...items])
  }

  function onCropMediaLoaded(size: { width: number; height: number }) {
    if (size.width && size.height) setNaturalAspect(size.width / size.height)
  }

  async function buildCompressedFromBlob(blob: Blob, sourceName: string): Promise<PendingImage> {
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    const baseName = sourceName.replace(/\.[^.]+$/, '') || 'image'
    const file = new File([blob], `${baseName}.${ext}`, { type: blob.type })
    return compressImage(file)
  }

  async function addCroppedToPending(blob: Blob, sourceName: string) {
    const compressed = await buildCompressedFromBlob(blob, sourceName)
    setPendingImages((current) => [...current, compressed])
  }

  async function replacePendingImage(index: number, blob: Blob, sourceName: string) {
    const compressed = await buildCompressedFromBlob(blob, sourceName)
    setPendingImages((current) => {
      const next = [...current]
      const old = next[index]
      if (old) URL.revokeObjectURL(old.previewUrl)
      next[index] = compressed
      return next
    })
  }

  async function replaceExistingImage(src: string, blob: Blob, sourceName: string) {
    const compressed = await buildCompressedFromBlob(blob, sourceName)
    setExistingImages((current) => current.filter((item) => item !== src))
    setRemovedImages((current) => [...current, src])
    setPendingImages((current) => [...current, compressed])
  }

  function recropPendingImage(index: number) {
    const image = pendingImages[index]
    if (!image) return
    const url = URL.createObjectURL(image.blob)
    const item: CropQueueItem = { file: new File([image.blob], image.name, { type: image.blob.type }), url, replace: { kind: 'pending', index } }
    setCropTotal((current) => current + 1)
    setCropQueue((current) => [...current, item])
  }

  async function recropExistingImage(src: string) {
    setError('')
    try {
      const res = await fetch(toImageURL(src))
      if (!res.ok) throw new Error('โหลดรูปไม่สำเร็จ')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const name = src.split('/').pop() || 'image.jpg'
      const item: CropQueueItem = { file: new File([blob], name, { type: blob.type || 'image/jpeg' }), url, replace: { kind: 'existing', src } }
      setCropTotal((current) => current + 1)
      setCropQueue((current) => [...current, item])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดรูปไม่สำเร็จ')
    }
  }

  function dequeueCropItem() {
    setCropQueue((current) => {
      const [used, ...rest] = current
      if (used) URL.revokeObjectURL(used.url)
      if (rest.length === 0) setCropTotal(0)
      return rest
    })
  }

  async function confirmCrop() {
    if (!currentCropItem) return
    setCropping(true)
    setError('')
    try {
      const area = croppedAreaPixels
      const blob = area
        ? await getCroppedImageBlob(currentCropItem.url, area)
        : await fetch(currentCropItem.url).then((res) => res.blob())
      const replace = currentCropItem.replace
      if (replace?.kind === 'pending') {
        await replacePendingImage(replace.index, blob, currentCropItem.file.name)
      } else if (replace?.kind === 'existing') {
        await replaceExistingImage(replace.src, blob, currentCropItem.file.name)
      } else {
        await addCroppedToPending(blob, currentCropItem.file.name)
      }
      dequeueCropItem()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ตัดรูปไม่สำเร็จ')
    } finally {
      setCropping(false)
    }
  }

  function skipCropItem() {
    dequeueCropItem()
  }

  function cancelCropQueue() {
    cropQueue.forEach((item) => URL.revokeObjectURL(item.url))
    setCropQueue([])
    setCropTotal(0)
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

      const savedName = form.hostname || form.asset_no || (form.id ? `#${form.id}` : '')
      setMessage(result.message || 'บันทึกสำเร็จ')
      showSavedToast(form.action === 'create' ? 'เพิ่มอุปกรณ์เรียบร้อย' : 'บันทึกการแก้ไขเรียบร้อย', savedName)
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
      if (hideDriveLetter) params.set('hideDrive', '1')
      const res = await fetch(mutationApiURL(`/export${params.toString() ? `?${params}` : ''}`))
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

  async function exportActivityReport() {
    setReportError('')
    setReportMessage('')
    try {
      const params = new URLSearchParams()
      if (reportYear.trim()) params.set('year', reportYear.trim())
      if (reportMonth.trim()) params.set('month', reportMonth.trim())
      const res = await fetch(mutationApiURL(`/reports/activity/export${params.toString() ? `?${params}` : ''}`))
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export Excel ไม่สำเร็จ')
      }
      const blob = await res.blob()
      const suffix = reportYear.trim() && reportMonth.trim()
        ? `_${safeFilename(reportYear.trim())}_${safeFilename(reportMonth.trim())}`
        : reportYear.trim()
          ? `_${safeFilename(reportYear.trim())}`
          : ''
      const filename = `SSO_Check_Report${suffix}.xlsx`
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(href)
      setReportMessage(`Export ${filename} สำเร็จ`)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Export Excel ไม่สำเร็จ')
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
    setCropQueue((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url))
      return []
    })
    setCropTotal(0)
  }

  function handleLogin(nextSession: LoginSession) {
    saveLoginSession(nextSession)
    setSession(nextSession)
  }

  function handleLogout() {
    clearLoginSession()
    setSession(null)
    setRecords([])
    setExportUserCheckOptions([])
    const base = import.meta.env.BASE_URL || '/SSO_Check/'
    window.history.replaceState(null, '', base)
  }

  function toggleLeftCard() {
    setLeftCardHidden((current) => {
      const next = !current
      window.localStorage.setItem(LEFT_CARD_HIDDEN_KEY, next ? '1' : '0')
      return next
    })
  }

  if (!session) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <header className="workspace-header shrink-0">
        <div className="mx-auto flex min-h-20 w-full max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <img src={`${import.meta.env.BASE_URL}tnlx.svg`} alt="TNLX" className="h-8 w-24 shrink-0 object-contain" />
            <Separator orientation="vertical" className="h-7! opacity-25" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-wide sm:text-base">SSO CHECK</h1>
              <p className="header-caption mt-0.5 hidden text-xs sm:block">Asset management workspace</p>
            </div>
          </div>
          <nav aria-label="เมนูหลัก" className="hidden items-center gap-2 md:flex">
            <Button type="button" variant="nav">Tools</Button>
            <Button type="button" variant={activeView === 'assets' ? 'nav-active' : 'nav'} aria-current={activeView === 'assets' ? 'page' : undefined} onClick={() => setActiveView('assets')}>
              <LayoutGrid data-icon="inline-start" />Assets
            </Button>
            <Button type="button" variant={activeView === 'reports' ? 'nav-active' : 'nav'} aria-current={activeView === 'reports' ? 'page' : undefined} onClick={() => setActiveView('reports')}>
              <BarChart3 data-icon="inline-start" />Reports
            </Button>
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <div className="header-status flex items-center gap-2 text-xs" role="status">
              <Circle size={7} className="fill-current" />
              <span>{activeView === 'reports' ? (reportLoading ? 'Loading reports' : 'Ready') : (loading ? 'Loading assets' : 'Ready')}</span>
            </div>
            <div className="header-user flex min-w-0 items-center gap-2 text-xs" title={session.displayName || session.username}>
              <UserRound size={15} className="shrink-0" />
              <span className="max-w-32 truncate sm:max-w-44">{session.displayName || session.username}</span>
            </div>
            <Button type="button" variant="nav" size="sm" onClick={handleLogout} title="Logout" aria-label="Logout">
              <LogOut data-icon="inline-start" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className={cn('workspace-layout', activeView === 'reports' ? 'is-single-view' : leftCardHidden && 'is-left-card-hidden')}>
        {activeView === 'assets' && <aside aria-label="จัดการอุปกรณ์และการส่งออก" aria-hidden={leftCardHidden} className="check-asset-panel">
          <div className="check-asset-panel__inner">
            <Card>
            <CardHeader>
              <p className="eyebrow">AGENT TNLX</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Check Asset</h2>
              <CardDescription>จัดการข้อมูลเครื่องและอุปกรณ์ในระบบ SSO</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <Button type="button" size="lg" onClick={openCreate} className="w-full"><Plus data-icon="inline-start" />เพิ่มอุปกรณ์</Button>
                <Button type="button" variant="outline" onClick={exportExcel} className="w-full"><Download data-icon="inline-start" />Export Excel</Button>
                <label className="check-option text-xs">
                  <input type="checkbox" checked={hideDriveLetter} onChange={(event) => setHideDriveLetter(event.target.checked)} />
                  ซ่อนคอลัมน์ Drive Letter ตอน Export
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="ทั้งหมด" value={stats.total} />
                <Stat label="Computer" value={stats.computers} />
                <Stat label="อื่น ๆ" value={stats.other} />
              </div>
              <Separator />
              <section aria-labelledby="asset-types-title">
                <div className="mb-3 flex items-center justify-between">
                  <h3 id="asset-types-title" className="text-sm font-semibold">ประเภทอุปกรณ์</h3>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => loadRecords()} title="Refresh" aria-label="รีเฟรชประเภทอุปกรณ์"><RefreshCw /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button key={item.value || 'all'} type="button" variant={filter === item.value ? 'secondary' : 'outline'} aria-pressed={filter === item.value}
                        onClick={() => { setFilter(item.value); setCurrentPage(1) }} className="h-16 flex-col gap-1.5 px-1">
                        <Icon data-icon="inline-start" />{item.label}
                      </Button>
                    )
                  })}
                </div>
              </section>
              <Separator />
              <FieldSet>
                <FieldLegend variant="label" className="mb-3 flex w-full items-center justify-between gap-2">
                  <span>Export Scope</span>
                  <span className="text-xs font-normal text-muted-foreground">{exportAll ? 'ส่งออกข้อมูลทั้งหมด' : `เลือก ${selectedExportChecks.length} User check`}</span>
                </FieldLegend>
                <FieldGroup className="gap-2">
                  <label className="check-option">
                    <input type="checkbox" checked={exportAll} onChange={(event) => { setExportAll(event.target.checked); if (event.target.checked) setSelectedExportChecks([]) }} />
                    Export ทั้งหมด
                  </label>
                  <div className="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1">
                    {userCheckOptions.length ? userCheckOptions.map((item) => (
                      <label key={item} className="check-option">
                        <input type="checkbox" checked={!exportAll && selectedExportChecks.includes(item)} onChange={() => toggleExportUserCheck(item)} />{item}
                      </label>
                    )) : <p className="text-xs text-muted-foreground">ยังไม่มี user_check ให้เลือก</p>}
                  </div>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Server size={18} /></div>
              <div className="min-w-0"><p className="eyebrow">SESSION</p><p className="mt-1 truncate text-sm font-medium">{userCheck || '-'} <span className="ml-1 text-xs font-normal text-muted-foreground">User check</span></p></div>
            </CardFooter>
            </Card>
          </div>
        </aside>}

        {activeView === 'assets' ? <Card className="min-w-0 gap-0 lg:min-h-0 lg:overflow-hidden">
          <CardHeader className="shrink-0 gap-4 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">ASSET WORKSPACE</p>
                <div className="mt-1 flex items-center gap-3">
                  <Button type="button" variant="outline" size="icon-sm" onClick={toggleLeftCard} aria-pressed={leftCardHidden} title={leftCardHidden ? 'แสดง Check Asset' : 'ซ่อน Check Asset'} aria-label={leftCardHidden ? 'แสดง Check Asset' : 'ซ่อน Check Asset'}>
                    {leftCardHidden ? <PanelLeftOpen /> : <PanelLeftClose />}
                  </Button>
                  <h2 className="text-xl font-semibold tracking-tight">Asset List</h2><Badge variant="secondary">{visibleRecords.length} รายการ</Badge>
                  {refreshing && <Badge variant="outline"><Loader2 className="animate-spin" />Sync</Badge>}
                </div>
                <CardDescription className="mt-1">{filter ? typeLabels[filter] : 'อุปกรณ์ทั้งหมด'}{assetListUserCheck ? ` / User Check ${assetListUserCheck}` : ''}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm"><a href={SAP_SEARCH_URL} target="_blank" rel="noopener noreferrer"><ExternalLink data-icon="inline-start" />ค้นหาข้อมูลจาก SAP</a></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => loadRecords()}><RefreshCw data-icon="inline-start" />Refresh</Button>
                <Button type="button" size="sm" onClick={openCreate}><Plus data-icon="inline-start" />Add</Button>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <InputGroup className="sm:max-w-lg">
                <InputGroupInput aria-label="ค้นหาอุปกรณ์" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} placeholder="ค้นหา..." />
                <InputGroupAddon><Search /></InputGroupAddon>
                {search && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" title="ล้างคำค้นหา" aria-label="ล้างคำค้นหา" onClick={() => { setSearch(''); setCurrentPage(1) }}><X /></InputGroupButton></InputGroupAddon>}
              </InputGroup>
              <div className="flex shrink-0 items-center gap-3">
                <label htmlFor="asset-user-check" className="whitespace-nowrap text-sm text-muted-foreground">User check</label>
                <select id="asset-user-check" value={assetListUserCheck} onChange={(event) => { setAssetListUserCheck(event.target.value); setCurrentPage(1) }} className={cn(inputClass, 'flex-1 sm:w-44')}>
                  <option value="">ทั้งหมด</option>{userCheckOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
          </CardHeader>
          <Separator />
          {(error || message) && <div className="shrink-0 px-5 pt-4"><Alert variant={error ? 'destructive' : 'default'}>{error ? <X /> : <Check />}<AlertDescription>{error || message}</AlertDescription></Alert></div>}
          <CardContent className="min-w-0 overflow-auto p-0 lg:min-h-0 lg:flex-1">
            <table className="asset-table w-full min-w-[1120px] text-left text-sm" aria-label="รายการอุปกรณ์">
              <thead className="sticky top-0 z-10">
                <tr>{['#', 'Asset No', 'Hostname', 'IP', 'Username', 'Type', 'Dep', 'Windows', 'CPU', 'RAM', 'Office', 'Detail', 'Users', 'Images', 'Check', 'Action'].map((head) => <th key={head} scope="col">{head}</th>)}</tr>
              </thead>
              <tbody>
                {loading && records.length === 0 ? <tr><td colSpan={16}><div className="flex flex-col items-center gap-3 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin text-primary" size={26} />กำลังโหลดข้อมูล...</div></td></tr>
                : pagedRecords.length === 0 ? <tr><td colSpan={16}><Empty><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>ไม่พบข้อมูล</EmptyTitle><EmptyDescription>ลองเปลี่ยนคำค้นหาหรือตัวกรองอุปกรณ์</EmptyDescription></EmptyHeader></Empty></td></tr>
                : pagedRecords.map((row, index) => (
                  <tr key={row.id}>
                    <td className="cell-index">{pageStart + index + 1}</td>
                    <td className="font-medium">{row.asset_no || '-'}</td>
                    <td className="font-semibold text-foreground">{row.hostname || '-'}</td>
                    <td>{row.ip_address || '-'}</td><td>{row.username || '-'}</td>
                    <td><Badge variant={badgeVariants[row.Status_mac || ''] || 'outline'}>{typeLabels[row.Status_mac || ''] || '-'}</Badge></td>
                    <td>{row.Dep || '-'}</td><td>{row.windows_version || '-'}</td>
                    <td className="max-w-[150px] truncate" title={row.cpu_name || undefined}>{row.cpu_name || '-'}</td>
                    <td className="text-center">{row.ram_total_gb ?? '-'}</td>
                    <td className="max-w-[150px] truncate" title={row.Office_Version || undefined}>{row.Office_Version || '-'}</td>
                    <td className="max-w-[130px] truncate" title={row.Detail || undefined}>{row.Detail || '-'}</td>
                    <td>{row.Users || '-'}</td>
                    <td><div className="flex justify-center gap-1.5">{splitImages(row.img_png).length ? splitImages(row.img_png).slice(0, 3).map((src) => (
                      <Button key={src} type="button" variant="ghost" size="icon" className="size-11 overflow-hidden p-0" onClick={() => setViewerImage(toImageURL(src))} aria-label={`ดูรูป ${row.hostname || row.id}`}><img src={toImageURL(src)} alt="รูปอุปกรณ์" className="size-full rounded-lg border object-cover" /></Button>
                    )) : '-'}</div></td>
                    <td>{row.user_check || '-'}</td>
                    <td><div className="flex justify-center gap-1"><Button type="button" variant="ghost" size="icon-sm" title="แก้ไข" aria-label={`แก้ไข ${row.hostname || row.id}`} onClick={() => openEdit(row.id)}><Edit3 /></Button><Button type="button" variant="destructive" size="icon-sm" title="ลบ" aria-label={`ลบ ${row.hostname || row.id}`} onClick={() => deleteRecord(row)}><Trash2 /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <CardFooter className="shrink-0 flex-col items-start justify-between gap-3 xl:flex-row xl:items-center">
            <p className="text-xs text-muted-foreground">Showing <strong className="text-foreground">{visibleRecords.length === 0 ? 0 : pageStart + 1}–{pageEnd}</strong> of <strong className="text-foreground">{visibleRecords.length}</strong></p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2"><label htmlFor="page-size" className="whitespace-nowrap text-xs text-muted-foreground">Rows per page:</label><select id="page-size" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1) }} className={cn(inputClass, 'w-20')}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
              <nav aria-label="หน้าของรายการอุปกรณ์" className="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))} disabled={safeCurrentPage === 1 || visibleRecords.length === 0} aria-label="หน้าก่อนหน้า"><ChevronLeft data-icon="inline-start" /><span className="hidden sm:inline">Prev</span></Button>
                {paginationItems.map((item, index) => item === 'ellipsis' ? <span key={`ellipsis-${index}`} className="flex size-9 items-center justify-center text-muted-foreground">...</span> : <Button key={item} type="button" variant={item === safeCurrentPage ? 'default' : 'ghost'} size="icon-sm" aria-current={item === safeCurrentPage ? 'page' : undefined} onClick={() => setCurrentPage(item)}>{item}</Button>)}
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))} disabled={safeCurrentPage === totalPages || visibleRecords.length === 0} aria-label="หน้าถัดไป"><span className="hidden sm:inline">Next</span><ChevronRight data-icon="inline-end" /></Button>
              </nav>
            </div>
          </CardFooter>
        </Card> : <ReportView
          records={reportRecords}
          visibleRecords={visibleReportRecords}
          pagedRecords={pagedReportRecords}
          chartData={reportChartData}
          maxQty={reportMaxQty}
          totalQty={reportTotalQty}
          totalAmount={reportTotalAmount}
          departmentCount={reportDepartmentCount}
          loading={reportLoading}
          refreshing={reportRefreshing}
          error={reportError}
          message={reportMessage}
          year={reportYear}
          month={reportMonth}
          search={reportSearch}
          pageSize={reportPageSize}
          pageStart={reportPageStart}
          pageEnd={reportPageEnd}
          currentPage={safeReportCurrentPage}
          totalPages={reportTotalPages}
          paginationItems={reportPaginationItems}
          onYearChange={(value) => { setReportYear(value); setReportCurrentPage(1) }}
          onMonthChange={(value) => { setReportMonth(value); setReportCurrentPage(1) }}
          onSearchChange={(value) => { setReportSearch(value); setReportCurrentPage(1) }}
          onPageSizeChange={(value) => { setReportPageSize(value); setReportCurrentPage(1) }}
          onPageChange={setReportCurrentPage}
          onRefresh={() => loadActivityReport({ silent: true })}
          onExport={exportActivityReport}
        />}
      </main>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="max-h-[92dvh] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()} showCloseButton={false}>
          <DialogHeader className="relative px-5 py-5 sm:px-7">
            <p className="eyebrow">ASSET DETAILS</p>
            <DialogTitle>{form.action === 'create' ? 'เพิ่มอุปกรณ์ใหม่' : 'แก้ไขอุปกรณ์'}</DialogTitle>
            <DialogDescription>{form.action === 'create' ? 'บันทึกอุปกรณ์เข้า Agent_TNLX' : `บันทึกเข้าเมื่อ ${formatInsertedAt(form.created_at)}`}</DialogDescription>
            <Button type="button" variant="ghost" size="icon-sm" onClick={closeModal} aria-label="ปิดฟอร์ม" className="absolute right-3 top-3"><X /></Button>
          </DialogHeader>
          <Separator />
          <form onSubmit={submitForm} className="min-h-0 overflow-y-auto">
            <FieldGroup className="gap-5 p-4 sm:p-6">
              <Card size="sm">
                <CardHeader><CardTitle>ข้อมูลหลัก</CardTitle><CardDescription>ข้อมูลระบุตัวตนและผู้ใช้งาน</CardDescription><CardAction><Badge variant="secondary">{typeLabels[form.Status_mac] || 'เลือกประเภท'}</Badge></CardAction></CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field><FieldLabel htmlFor="device-type">ประเภทอุปกรณ์ <span className="text-destructive">*</span></FieldLabel>
                      <select id="device-type" required value={form.Status_mac} onChange={(event) => updateForm('Status_mac', event.target.value)} className={inputClass}><option value="">-- เลือกประเภท --</option>{typeOptions.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                    </Field>
                    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField label="Asset No. (รหัสทรัพย์สิน)" value={form.asset_no} onChange={(value) => updateForm('asset_no', value)} placeholder="เช่น 5100000...." maxLength={20} />
                      <TextField label="Hostname" required value={form.hostname} onChange={(value) => updateForm('hostname', value)} placeholder="เช่น TNLX0001" />
                      <TextField label="IP Address" required value={form.ip_address} onChange={(value) => updateForm('ip_address', value)} placeholder="เช่น 10.X.X.X" />
                      <TextField label="Username" value={form.username} onChange={(value) => updateForm('username', value)} placeholder="THANULUX\TXXXX" />
                      <TextField label="Users" value={form.Users} onChange={(value) => updateForm('Users', value)} placeholder="ชื่อผู้ใช้งาน" />
                      <TextField label="Dep (แผนก)" value={form.Dep} onChange={(value) => updateForm('Dep', value)} placeholder="เช่น 2AM04" />
                    </FieldGroup>
                  </FieldGroup>
                </CardContent>
              </Card>
              {form.Status_mac === 'C' && <Card size="sm"><CardHeader><CardTitle>ข้อมูล Computer</CardTitle><CardDescription>Spec เครื่อง, Windows และ Office</CardDescription></CardHeader><CardContent><FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Windows Version" value={form.windows_version} options={windowsOptions} onChange={(value) => updateForm('windows_version', value)} />
                <SelectField label="Office Version" value={form.Office_Version} options={officeOptions} onChange={(value) => updateForm('Office_Version', value)} />
                <TextField label="CPU" value={form.cpu_name} onChange={(value) => updateForm('cpu_name', value)} placeholder="12th Gen Intel i5-1235U" />
                <TextField label="RAM (GB)" type="number" value={form.ram_total_gb} onChange={(value) => updateForm('ram_total_gb', value)} placeholder="16" />
              </FieldGroup></CardContent></Card>}
              <Card size="sm"><CardHeader><CardTitle>รายละเอียดเพิ่มเติม</CardTitle><CardDescription>บันทึกลง Detail และ Active</CardDescription><CardAction><ActiveSwitch value={form.Active} onChange={(value) => updateForm('Active', value)} /></CardAction></CardHeader><CardContent><Field><FieldLabel htmlFor="asset-detail">Detail</FieldLabel><Textarea id="asset-detail" value={form.Detail} onChange={(event) => updateForm('Detail', event.target.value.toUpperCase())} rows={3} maxLength={100} className="min-h-24" /></Field></CardContent></Card>
              <Card size="sm"><CardHeader><CardTitle>รูปภาพ</CardTitle><CardDescription>เลือกรูปหรือถ่ายภาพอุปกรณ์ สูงสุด 3 รูป</CardDescription></CardHeader><CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="upload-option"><ImageIcon size={24} /><span>เลือกรูปจากคลังภาพ</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => onImageSelect(event.target.files)} /></label>
                  <label className="upload-option"><Camera size={24} /><span>ถ่ายรูปด้วยกล้อง</span><input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(event) => onImageSelect(event.target.files)} /></label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {existingImages.map((src) => <ImageThumb key={src} src={toImageURL(src)} onView={() => setViewerImage(toImageURL(src))} onRemove={() => removeExistingImage(src)} onCrop={() => recropExistingImage(src)} />)}
                  {pendingImages.map((image, index) => <ImageThumb key={image.previewUrl} src={image.previewUrl} onView={() => setViewerImage(image.previewUrl)} onRemove={() => removePendingImage(index)} onCrop={() => recropPendingImage(index)} />)}
                </div>
              </CardContent></Card>
            </FieldGroup>
            <div className="modal-actions sticky bottom-0 flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={closeModal}>ยกเลิก</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}บันทึกข้อมูล</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewerImage)} onOpenChange={(open) => { if (!open) setViewerImage('') }}>
        <DialogContent className="max-h-[92dvh] overflow-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>รูปภาพอุปกรณ์</DialogTitle><DialogDescription className="sr-only">ภาพอุปกรณ์ขนาดเต็ม</DialogDescription></DialogHeader>
          {viewerImage && <img src={viewerImage} alt="รูปภาพอุปกรณ์ขนาดเต็ม" className="max-h-[78dvh] w-full rounded-xl object-contain" onClick={() => setViewerImage('')} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(currentCropItem)} onOpenChange={(open) => { if (!open) cancelCropQueue() }}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg" onInteractOutside={(event) => event.preventDefault()} showCloseButton={false}>
          <DialogHeader className="relative p-5"><p className="eyebrow">IMAGE EDITOR</p><DialogTitle>ครอบตัดรูปภาพ</DialogTitle><DialogDescription>ปรับสัดส่วนและขยายภาพก่อนเพิ่มรูป {cropTotal > 1 ? `(${cropTotal - cropQueue.length + 1}/${cropTotal})` : ''}</DialogDescription><Button type="button" variant="ghost" size="icon-sm" onClick={cancelCropQueue} title="ยกเลิกทั้งหมด" aria-label="ยกเลิกการครอบตัดทั้งหมด" className="absolute right-3 top-3"><X /></Button></DialogHeader>
          <div className="crop-surface relative h-[min(36dvh,384px)] min-h-48 w-full">
            {currentCropItem && <Cropper image={currentCropItem.url} crop={crop} zoom={zoom} aspect={cropAspect ?? naturalAspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)} onMediaLoaded={onCropMediaLoaded} />}
          </div>
          <div className="flex flex-col gap-4 p-5">
            <ToggleGroup type="single" variant="outline" value={cropAspect == null ? 'full' : String(cropAspect)} onValueChange={(value) => { if (value) setCropAspect(value === 'full' ? null : Number(value)) }} aria-label="สัดส่วนรูปภาพ" className="flex-wrap">
              {cropAspectPresets.map((preset) => <ToggleGroupItem key={preset.label} value={preset.value == null ? 'full' : String(preset.value)}>{preset.label}</ToggleGroupItem>)}
            </ToggleGroup>
            <div className="flex items-center gap-3"><ZoomIn size={18} className="shrink-0 text-muted-foreground" /><input aria-label="ขยายภาพ" type="range" min={1} max={4} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="h-2 w-full accent-primary" /></div>
          </div>
          <div className="modal-actions flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={skipCropItem} disabled={cropping}>ข้ามรูปนี้</Button><Button type="button" onClick={confirmCrop} disabled={cropping}>{cropping ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Crop data-icon="inline-start" />}ตัดและเพิ่มรูป</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportView({
  records,
  visibleRecords,
  pagedRecords,
  chartData,
  maxQty,
  totalQty,
  totalAmount,
  departmentCount,
  loading,
  refreshing,
  error,
  message,
  year,
  month,
  search,
  pageSize,
  pageStart,
  pageEnd,
  currentPage,
  totalPages,
  paginationItems,
  onYearChange,
  onMonthChange,
  onSearchChange,
  onPageSizeChange,
  onPageChange,
  onRefresh,
  onExport,
}: {
  records: ActivityReportRecord[]
  visibleRecords: ActivityReportRecord[]
  pagedRecords: ActivityReportRecord[]
  chartData: { department: string; qty: number }[]
  maxQty: number
  totalQty: number
  totalAmount: number
  departmentCount: number
  loading: boolean
  refreshing: boolean
  error: string
  message: string
  year: string
  month: string
  search: string
  pageSize: number
  pageStart: number
  pageEnd: number
  currentPage: number
  totalPages: number
  paginationItems: Array<number | 'ellipsis'>
  onYearChange: (value: string) => void
  onMonthChange: (value: string) => void
  onSearchChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
  onExport: () => void
}) {
  return (
    <Card className="min-w-0 gap-0 lg:min-h-0 lg:overflow-hidden">
      <CardHeader className="shrink-0 gap-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">REPORTS</p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Activity Report</h2>
              <Badge variant="secondary">{visibleRecords.length} รายการ</Badge>
              {refreshing && <Badge variant="outline"><Loader2 className="animate-spin" />Sync</Badge>}
            </div>
            <CardDescription className="mt-1">dbo.V_2AM04_12 / Department vs Qty</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading || refreshing}><RefreshCw data-icon="inline-start" />Refresh</Button>
            <Button type="button" size="sm" onClick={onExport} disabled={loading}><Download data-icon="inline-start" />Export Excel</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_120px_140px]">
          <InputGroup>
            <InputGroupInput aria-label="ค้นหารายงาน" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="ค้นหา..." />
            <InputGroupAddon><Search /></InputGroupAddon>
            {search && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" title="ล้างคำค้นหา" aria-label="ล้างคำค้นหา" onClick={() => onSearchChange('')}><X /></InputGroupButton></InputGroupAddon>}
          </InputGroup>
          <Input aria-label="Year" value={year} onChange={(event) => onYearChange(event.target.value.replace(/[^\d]/g, '').slice(0, 4))} placeholder="Year" inputMode="numeric" />
          <select aria-label="Month" value={month} onChange={(event) => onMonthChange(event.target.value)} className={inputClass}>
            {monthOptions.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </CardHeader>
      <Separator />
      {(error || message) && <div className="shrink-0 px-5 pt-4"><Alert variant={error ? 'destructive' : 'default'}>{error ? <X /> : <Check />}<AlertDescription>{error || message}</AlertDescription></Alert></div>}
      <CardContent className="min-w-0 overflow-auto p-0 lg:min-h-0 lg:flex-1">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="report-chart-panel" aria-label="กราฟ Qty ตาม Department">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Department Qty</h3>
                <p className="mt-1 text-xs text-muted-foreground">รวม Qty ตาม Department</p>
              </div>
              <Badge variant="outline">{departmentCount} Departments</Badge>
            </div>
            {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="animate-spin" />กำลังโหลดรายงาน...</div>
            : chartData.length === 0 ? <Empty><EmptyHeader><EmptyMedia variant="icon"><BarChart3 /></EmptyMedia><EmptyTitle>ไม่พบข้อมูลกราฟ</EmptyTitle><EmptyDescription>ลองเปลี่ยน Year หรือ Month</EmptyDescription></EmptyHeader></Empty>
            : <div className="report-bar-list">
                {chartData.map((item) => (
                  <div key={item.department} className="report-bar-row">
                    <div className="report-bar-label" title={item.department}>{item.department}</div>
                    <div className="report-bar-track"><span style={{ width: `${Math.max(3, (item.qty / maxQty) * 100)}%` }} /></div>
                    <div className="report-bar-value">{formatNumber(item.qty)}</div>
                  </div>
                ))}
              </div>}
          </section>
          <aside className="grid gap-3 content-start">
            <Stat label="Rows" value={records.length} />
            <Stat label="Qty" value={formatNumber(totalQty)} />
            <Stat label="Amount" value={formatNumber(totalAmount)} />
          </aside>
        </div>
        <Separator />
        <table className="asset-table w-full min-w-[1380px] text-left text-sm" aria-label="Activity report">
          <thead className="sticky top-0 z-10">
            <tr>
              <th scope="col">#</th>
              {reportColumns.map((column) => <th key={column.key} scope="col" className={column.align === 'right' ? 'text-right' : undefined}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && records.length === 0 ? <tr><td colSpan={12}><div className="flex flex-col items-center gap-3 py-16 text-muted-foreground" role="status"><Loader2 className="animate-spin text-primary" size={26} />กำลังโหลดรายงาน...</div></td></tr>
            : pagedRecords.length === 0 ? <tr><td colSpan={12}><Empty><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>ไม่พบข้อมูล</EmptyTitle><EmptyDescription>ลองเปลี่ยนคำค้นหาหรือตัวกรอง Year/Month</EmptyDescription></EmptyHeader></Empty></td></tr>
            : pagedRecords.map((row, index) => (
              <tr key={`${row.Activity_Code || 'row'}-${pageStart + index}`}>
                <td className="cell-index">{pageStart + index + 1}</td>
                {reportColumns.map((column) => <td key={column.key} className={cn(column.align === 'right' && 'text-right tabular-nums')}>{formatReportCell(row[column.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
      <CardFooter className="shrink-0 flex-col items-start justify-between gap-3 xl:flex-row xl:items-center">
        <p className="text-xs text-muted-foreground">Showing <strong className="text-foreground">{visibleRecords.length === 0 ? 0 : pageStart + 1}-{pageEnd}</strong> of <strong className="text-foreground">{visibleRecords.length}</strong></p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2"><label htmlFor="report-page-size" className="whitespace-nowrap text-xs text-muted-foreground">Rows per page:</label><select id="report-page-size" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className={cn(inputClass, 'w-20')}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
          <nav aria-label="หน้าของรายงาน" className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || visibleRecords.length === 0} aria-label="หน้าก่อนหน้า"><ChevronLeft data-icon="inline-start" /><span className="hidden sm:inline">Prev</span></Button>
            {paginationItems.map((item, index) => item === 'ellipsis' ? <span key={`report-ellipsis-${index}`} className="flex size-9 items-center justify-center text-muted-foreground">...</span> : <Button key={item} type="button" variant={item === currentPage ? 'default' : 'ghost'} size="icon-sm" aria-current={item === currentPage ? 'page' : undefined} onClick={() => onPageChange(item)}>{item}</Button>)}
            <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || visibleRecords.length === 0} aria-label="หน้าถัดไป"><span className="hidden sm:inline">Next</span><ChevronRight data-icon="inline-end" /></Button>
          </nav>
        </div>
      </CardFooter>
    </Card>
  )
}

function LoginPage({ onLogin }: { onLogin: (session: LoginSession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetchWithTimeout(
        mutationApiURL('/login'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        },
        20000,
      )
      const result: LoginResponse = await res.json().catch(() => ({}))
      if (!res.ok || !result.success || !result.username || !result.token || !result.expiresAt) {
        throw new Error(result.error || result.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
      const nextSession: LoginSession = {
        username: result.username,
        displayName: result.displayName || result.username,
        role: result.role || 'user',
        token: result.token,
        expiresAt: result.expiresAt,
      }
      onLogin(nextSession)
      const base = import.meta.env.BASE_URL || '/SSO_Check/'
      window.location.href = `${base}?userCheck=${encodeURIComponent(result.username)}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel" aria-label="SSO CHECK">
        <img src={`${import.meta.env.BASE_URL}tnlx.svg`} alt="TNLX" className="login-logo" />
        <div className="login-brand-copy">
          <p className="login-eyebrow">TNLX · SSO CHECK</p>
          <h1>Sign in</h1>
          <p>Manage your SSO Check asset workspace.</p>
          <p>Use your Active Directory account to continue.</p>
        </div>
        <footer className="login-footer">
          <span>TNLX COMPANY LIMITED</span>
          <span>ACCOUNT SERVICES</span>
        </footer>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <form className="login-card" onSubmit={submitLogin}>
          <p className="login-card-kicker">TNLX</p>
          <h2 id="login-title">SSO CHECK</h2>
          <p className="login-card-description">ลงชื่อเข้าใช้ด้วยบัญชี AD เพื่อเข้าใช้งานระบบ</p>

          <label className="login-field">
            <span>USERNAME</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value.toUpperCase())} placeholder="TXXXX" autoComplete="username" autoFocus required />
          </label>

          <label className="login-field">
            <span>PASSWORD</span>
            <div className="login-password">
              <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="login-submit">
            {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Sign In
          </Button>
        </form>
      </section>
    </main>
  )
}

function showSavedToast(title: string, name: string) {
  void Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    text: name ? `${name} ถูกบันทึกเข้าระบบแล้ว` : 'ข้อมูลถูกบันทึกเข้าระบบแล้ว',
    timer: SAVE_NOTICE_MS,
    timerProgressBar: true,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: { popup: 'sso-save-toast', title: 'sso-save-toast-title', htmlContainer: 'sso-save-toast-text', timerProgressBar: 'sso-save-toast-progress' },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
  })
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="stat-tile"><p className="text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>
}

function TextField({ label, value, onChange, placeholder, required = false, type = 'text', maxLength }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: string; maxLength?: number
}) {
  const id = useId()
  return <Field><FieldLabel htmlFor={id}>{label}{required && <span className="text-destructive">*</span>}</FieldLabel><Input id={id} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} /></Field>
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const id = useId()
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">-- เลือก --</option>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  return sortedPages.flatMap((page, index) => {
    if (index === 0) return [page]
    const previous = sortedPages[index - 1]
    return page - previous > 1 ? ['ellipsis', page] : [page]
  })
}

function ImageThumb({ src, onView, onRemove, onCrop }: { src: string; onView: () => void; onRemove: () => void; onCrop?: () => void }) {
  return (
    <div className="relative">
      <button type="button" onClick={onView} className="block rounded-lg border border-border bg-card p-0.5 shadow-sm transition-colors hover:border-primary" title="ดูรูป" aria-label="ดูรูป">
        <img src={src} alt="" className="size-20 rounded-md object-cover" />
        <Eye className="absolute bottom-2 left-2 rounded bg-card/90 p-1 text-foreground" size={22} />
      </button>
      {onCrop && (
        <button type="button" onClick={onCrop} className="absolute -bottom-2 -right-2 rounded-full bg-primary p-1 text-primary-foreground shadow hover:bg-primary/90" title="ครอบตัดรูป" aria-label="ครอบตัดรูป">
          <Crop size={14} />
        </button>
      )}
      <button type="button" onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-primary-foreground shadow hover:bg-destructive/90" title="ลบรูป" aria-label="ลบรูป">
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
    Active: 'Y',
  }
}

function normalizeActive(value?: string | null) {
  return String(value || 'Y').trim().toUpperCase() === 'N' ? 'N' : 'Y'
}

function ActiveSwitch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const enabled = normalizeActive(value) === 'Y'

  return (
    <button
      type="button"
      className="active-switch"
      aria-label="สถานะการใช้งาน"
      aria-pressed={enabled}
      title={enabled ? 'ใช้งาน' : 'ไม่ได้ใช้งาน'}
      onClick={() => onChange(enabled ? 'N' : 'Y')}
    >
      <span className="active-switch-track" aria-hidden="true"><span /></span>
      {enabled ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
      <span>{enabled ? 'Enabled' : 'Disabled'}</span>
    </button>
  )
}

function getUserCheck() {
  return new URLSearchParams(window.location.search).get('userCheck') || ''
}

function getInitialUserCheck() {
  return loadLoginSession()?.username || getUserCheck() || ''
}

function loadLoginSession(): LoginSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Partial<LoginSession>
    if (!session.username || !session.token || !session.expiresAt) {
      clearLoginSession()
      return null
    }
    if (session.expiresAt * 1000 <= Date.now()) {
      clearLoginSession()
      return null
    }
    return {
      username: String(session.username).toUpperCase(),
      displayName: String(session.displayName || session.username),
      role: String(session.role || 'user'),
      token: String(session.token),
      expiresAt: Number(session.expiresAt),
    }
  } catch {
    clearLoginSession()
    return null
  }
}

function saveLoginSession(session: LoginSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearLoginSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

function readActiveView(): WorkspaceView {
  try {
    return window.localStorage.getItem(ACTIVE_VIEW_KEY) === 'reports' ? 'reports' : 'assets'
  } catch {
    return 'assets'
  }
}

function readLeftCardHidden() {
  return window.localStorage.getItem(LEFT_CARD_HIDDEN_KEY) === '1'
}

function numberValue(value?: number | null) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(numberValue(value))
}

function formatReportCell(value: ActivityReportRecord[keyof ActivityReportRecord]) {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return formatNumber(value)
  return value
}

function buildDepartmentQtyChart(records: ActivityReportRecord[]) {
  const totals = new Map<string, number>()
  records.forEach((row) => {
    const department = String(row.Department || 'ไม่ระบุ').trim() || 'ไม่ระบุ'
    totals.set(department, (totals.get(department) || 0) + numberValue(row.Qty))
  })
  return Array.from(totals, ([department, qty]) => ({ department, qty }))
    .filter((item) => item.qty > 0)
    .sort((a, b) => b.qty - a.qty || a.department.localeCompare(b.department))
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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'))
    image.src = src
  })
}

async function getCroppedImageBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImageElement(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(area.width))
  canvas.height = Math.max(1, Math.round(area.height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('ตัดรูปไม่สำเร็จ')
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('ตัดรูปไม่สำเร็จ'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      0.92,
    )
  })
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
