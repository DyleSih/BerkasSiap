import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { ServiceTemplate } from './types'

type Tab = 'home' | 'plans' | 'reminders'
type PlanDocument = {
  id: string
  name: string
  description?: string
  done: boolean
  hasFile: boolean
  fileName?: string
}
type Plan = {
  id: string
  title: string
  templateSlug?: string
  deadline: string
  documents: PlanDocument[]
  reminder: boolean
  createdAt: string
}

const accentStyles: Record<ServiceTemplate['accent'], { bg: string; icon: string }> = {
  orange: { bg: 'bg-[#fff0e8]', icon: 'text-[#ee5e2f]' },
  green: { bg: 'bg-[#e8f3ea]', icon: 'text-[#2f7350]' },
  blue: { bg: 'bg-[#e8f1f7]', icon: 'text-[#286581]' },
  purple: { bg: 'bg-[#f0ebf8]', icon: 'text-[#7657a3]' },
  yellow: { bg: 'bg-[#fff5d9]', icon: 'text-[#a36b18]' },
}

const categories = [
  { value: 'all', label: 'Semua' },
  { value: 'government', label: 'Pemerintahan' },
  { value: 'travel', label: 'Perjalanan' },
  { value: 'career', label: 'Karier' },
  { value: 'education', label: 'Pendidikan' },
] as const

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    folder: (
      <>
        <path d="M3 6.5h6l2 2h10v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M3 10h18" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h11" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M5 15v5h14v-5" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v12M7 11l5 5 5-5" />
        <path d="M5 20h14" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    passport: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="11" r="3.5" />
        <path d="M8.5 11h7M12 7.5c1.4 1.5 1.4 5.5 0 7M12 7.5c-1.4 1.5-1.4 5.5 0 7M9 17h6" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h8l4 4v14H6Z" />
        <path d="M14 3v5h4M9 13h6M9 17h5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.document}
    </svg>
  )
}

function openFileDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('berkassiap-files', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('files')) {
        request.result.createObjectStore('files')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveLocalFile(key: string, file: File) {
  const db = await openFileDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite')
    transaction.objectStore('files').put(file, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

async function getLocalFile(key: string) {
  const db = await openFileDatabase()
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(key)
    request.onsuccess = () => resolve(request.result as File | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return file
}

async function deleteLocalFiles(plan: Plan) {
  const db = await openFileDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite')
    plan.documents.forEach((document) =>
      transaction.objectStore('files').delete(`${plan.id}:${document.id}`),
    )
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

function createDeadline(days = 30) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  if (!value) return 'Belum ditentukan'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function daysUntil(value: string) {
  if (!value) return null
  const target = new Date(`${value}T23:59:59`).getTime()
  return Math.ceil((target - Date.now()) / 86_400_000)
}

function progressOf(plan: Plan) {
  if (!plan.documents.length) return 0
  return Math.round(
    (plan.documents.filter((item) => item.done).length / plan.documents.length) * 100,
  )
}

export default function App({ templates }: { templates: ServiceTemplate[] }) {
  const [tab, setTab] = useState<Tab>('home')
  const [plans, setPlans] = useState<Plan[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]['value']>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('berkassiap-plans')
      if (stored) setPlans(JSON.parse(stored) as Plan[])
    } catch {
      localStorage.removeItem('berkassiap-plans')
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem('berkassiap-plans', JSON.stringify(plans))
  }, [hydrated, plans])

  const notify = (message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesCategory = category === 'all' || template.category === category
      const matchesQuery =
        !normalized ||
        `${template.title} ${template.summary} ${template.institution}`
          .toLowerCase()
          .includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [category, query, templates])

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null

  const startTemplate = (template: ServiceTemplate) => {
    const existing = plans.find((plan) => plan.templateSlug === template.slug)
    if (existing) {
      setSelectedTemplate(null)
      setSelectedPlanId(existing.id)
      setTab('plans')
      notify('Checklist ini sudah ada di Berkas Saya')
      return
    }
    const plan: Plan = {
      id: crypto.randomUUID(),
      title: template.title,
      templateSlug: template.slug,
      deadline: createDeadline(template.category === 'travel' ? 45 : 30),
      reminder: true,
      createdAt: new Date().toISOString(),
      documents: template.requirements.map((requirement) => ({
        id: requirement.id || crypto.randomUUID(),
        name: requirement.name,
        description: requirement.description,
        done: false,
        hasFile: false,
      })),
    }
    setPlans((current) => [plan, ...current])
    setSelectedTemplate(null)
    setSelectedPlanId(plan.id)
    setTab('plans')
    notify('Checklist berhasil ditambahkan')
  }

  const updatePlan = (id: string, updater: (plan: Plan) => Plan) => {
    setPlans((current) => current.map((plan) => (plan.id === id ? updater(plan) : plan)))
  }

  const toggleDocument = (planId: string, documentId: string) => {
    updatePlan(planId, (plan) => ({
      ...plan,
      documents: plan.documents.map((document) =>
        document.id === documentId ? { ...document, done: !document.done } : document,
      ),
    }))
  }

  const uploadDocument = async (planId: string, documentId: string, file?: File) => {
    if (!file) return
    try {
      await saveLocalFile(`${planId}:${documentId}`, file)
      updatePlan(planId, (plan) => ({
        ...plan,
        documents: plan.documents.map((document) =>
          document.id === documentId
            ? { ...document, hasFile: true, fileName: file.name }
            : document,
        ),
      }))
      notify('File tersimpan aman di perangkat ini')
    } catch {
      notify('File belum berhasil disimpan')
    }
  }

  const downloadDocument = async (planId: string, document: PlanDocument) => {
    const file = await getLocalFile(`${planId}:${document.id}`)
    if (!file) {
      notify('File tidak ditemukan di perangkat ini')
      return
    }
    const url = URL.createObjectURL(file)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = document.fileName || file.name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const removePlan = async (plan: Plan) => {
    await deleteLocalFiles(plan).catch(() => undefined)
    setPlans((current) => current.filter((item) => item.id !== plan.id))
    setSelectedPlanId(null)
    notify('Checklist dihapus dari perangkat')
  }

  const submitManualPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '').trim()
    const deadline = String(form.get('deadline') || '')
    const lines = String(form.get('documents') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (!title || !lines.length) {
      notify('Isi nama persiapan dan minimal satu dokumen')
      return
    }
    const plan: Plan = {
      id: crypto.randomUUID(),
      title,
      deadline,
      reminder: Boolean(deadline),
      createdAt: new Date().toISOString(),
      documents: lines.map((line) => ({
        id: crypto.randomUUID(),
        name: line,
        done: false,
        hasFile: false,
      })),
    }
    setPlans((current) => [plan, ...current])
    setShowManualForm(false)
    setSelectedPlanId(plan.id)
    setTab('plans')
    notify('Checklist manual berhasil dibuat')
  }

  const changeTab = (nextTab: Tab) => {
    setSelectedPlanId(null)
    setSelectedTemplate(null)
    setTab(nextTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] overflow-x-hidden bg-[#f8f5ef] text-[#17251f] shadow-[0_0_60px_rgba(23,37,31,0.10)]">
      {selectedTemplate ? (
        <TemplateDetail
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
          onStart={() => startTemplate(selectedTemplate)}
          alreadyStarted={plans.some((plan) => plan.templateSlug === selectedTemplate.slug)}
        />
      ) : selectedPlan ? (
        <PlanDetail
          plan={selectedPlan}
          onBack={() => setSelectedPlanId(null)}
          onToggle={(documentId) => toggleDocument(selectedPlan.id, documentId)}
          onUpload={(documentId, file) => uploadDocument(selectedPlan.id, documentId, file)}
          onDownload={(document) => downloadDocument(selectedPlan.id, document)}
          onDeadline={(deadline) =>
            updatePlan(selectedPlan.id, (plan) => ({
              ...plan,
              deadline,
              reminder: Boolean(deadline),
            }))
          }
          onReminder={() =>
            updatePlan(selectedPlan.id, (plan) => ({ ...plan, reminder: !plan.reminder }))
          }
          onRemove={() => removePlan(selectedPlan)}
        />
      ) : (
        <>
          {tab === 'home' && (
            <Home
              templates={filteredTemplates}
              allTemplates={templates}
              category={category}
              query={query}
              onCategory={setCategory}
              onQuery={setQuery}
              onSelect={setSelectedTemplate}
              onOpenPlans={() => changeTab('plans')}
              planCount={plans.length}
            />
          )}
          {tab === 'plans' && (
            <Plans
              plans={plans}
              onSelect={setSelectedPlanId}
              onManual={() => setShowManualForm(true)}
              onBrowse={() => changeTab('home')}
            />
          )}
          {tab === 'reminders' && (
            <Reminders
              plans={plans}
              onSelect={(id) => {
                setSelectedPlanId(id)
                setTab('plans')
              }}
              onToggle={(id) => updatePlan(id, (plan) => ({ ...plan, reminder: !plan.reminder }))}
            />
          )}
          <BottomNav current={tab} onChange={changeTab} />
        </>
      )}

      {showManualForm && (
        <ManualPlanForm onClose={() => setShowManualForm(false)} onSubmit={submitManualPlan} />
      )}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-[70] w-[calc(100%-40px)] max-w-[470px] -translate-x-1/2 rounded-2xl bg-[#17251f] px-5 py-3.5 text-center text-sm font-semibold text-white shadow-xl"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function Home({
  templates,
  allTemplates,
  category,
  query,
  onCategory,
  onQuery,
  onSelect,
  onOpenPlans,
  planCount,
}: {
  templates: ServiceTemplate[]
  allTemplates: ServiceTemplate[]
  category: (typeof categories)[number]['value']
  query: string
  onCategory: (value: (typeof categories)[number]['value']) => void
  onQuery: (value: string) => void
  onSelect: (template: ServiceTemplate) => void
  onOpenPlans: () => void
  planCount: number
}) {
  const featured = allTemplates.find((template) => template.featured) ?? allTemplates[0]
  return (
    <main className="pb-28">
      <section className="relative overflow-hidden rounded-b-[36px] bg-[#f56a3d] px-5 pb-7 pt-6 text-white">
        <div className="absolute -right-10 top-4 h-40 w-40 rounded-full border-[30px] border-white/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-white text-[#f05f32] shadow-sm">
              <Icon name="folder" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-[-0.03em]">BerkasSiap</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/70">
                Urus tanpa cemas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPlans}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur-sm"
            aria-label="Buka berkas saya"
          >
            <Icon name="folder" className="h-5 w-5" />
            {planCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#173c32] px-1 text-[9px] font-bold">
                {planCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative mt-8 max-w-[330px]">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5b2413]/70">
            Semua berkas, siap.
          </p>
          <h1 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em]">
            Mau urus apa hari ini?
          </h1>
          <p className="mt-3 max-w-[290px] text-sm leading-6 text-white/85">
            Cek persyaratan, pantau progres, dan simpan salinan dokumen di satu tempat.
          </p>
        </div>
        <label className="relative mt-6 flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-[#63706b] shadow-[0_10px_30px_rgba(94,34,15,0.18)]">
          <Icon name="search" className="h-5 w-5 text-[#f05f32]" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#17251f] outline-none placeholder:text-[#9ca49f]"
            placeholder="Cari CPNS, visa, paspor..."
            aria-label="Cari layanan"
          />
        </label>
      </section>

      <section className="px-5 pt-7">
        <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onCategory(item.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                category === item.value
                  ? 'border-[#173c32] bg-[#173c32] text-white'
                  : 'border-[#dedbd3] bg-white text-[#5f6964]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {!query && category === 'all' && featured && (
        <section className="px-5 pt-7">
          <SectionHeading eyebrow="Paling dicari" title="Mulai dari sini" />
          <button
            type="button"
            onClick={() => onSelect(featured)}
            className="relative mt-4 w-full overflow-hidden rounded-[26px] bg-[#173c32] p-5 text-left text-white shadow-[0_14px_35px_rgba(23,60,50,0.18)]"
          >
            <div className="absolute -bottom-9 -right-7 h-32 w-32 rounded-full border-[24px] border-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f8c85b] text-[#173c32]">
                <Icon name={featured.icon} className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold tracking-[-0.03em]">{featured.title}</h3>
                  <Icon name="chevron" className="h-5 w-5 shrink-0 text-white/60" />
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/65">
                  {featured.summary}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#f8c85b]">
                  <Icon name="clock" className="h-4 w-4" />
                  {featured.durationEstimate}
                </div>
              </div>
            </div>
          </button>
        </section>
      )}

      <section className="px-5 pt-8">
        <SectionHeading
          eyebrow={query || category !== 'all' ? `${templates.length} hasil` : 'Panduan lengkap'}
          title={query ? `Hasil untuk “${query}”` : 'Pilih kebutuhanmu'}
        />
        {templates.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <ServiceCard
                key={template.id}
                template={template}
                onClick={() => onSelect(template)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-dashed border-[#cbc8c0] bg-white px-6 py-10 text-center">
            <Icon name="search" className="mx-auto h-8 w-8 text-[#a5aaa6]" />
            <h3 className="mt-3 font-extrabold">Layanan belum ditemukan</h3>
            <p className="mt-1 text-sm leading-5 text-[#76807b]">
              Coba kata kunci lain atau buat checklist manual di Berkas Saya.
            </p>
          </div>
        )}
      </section>

      <section className="mx-5 mt-8 flex items-center gap-3 rounded-[22px] border border-[#e4ded4] bg-[#fffdf9] p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3ea] text-[#2f7350]">
          <Icon name="lock" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold">Privasi tetap milikmu</p>
          <p className="mt-0.5 text-xs leading-5 text-[#748079]">
            Checklist dan file pribadi hanya tersimpan di perangkat ini.
          </p>
        </div>
      </section>
    </main>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ef6335]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.035em]">{title}</h2>
    </div>
  )
}

function ServiceCard({ template, onClick }: { template: ServiceTemplate; onClick: () => void }) {
  const style = accentStyles[template.accent]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[190px] flex-col rounded-[24px] border border-[#e8e3da] bg-white p-4 text-left shadow-[0_5px_18px_rgba(37,42,38,0.04)] transition active:scale-[0.98]"
    >
      <div className={`grid h-11 w-11 place-items-center rounded-[15px] ${style.bg} ${style.icon}`}>
        <Icon name={template.icon} className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-extrabold leading-5 tracking-[-0.025em]">
        {template.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-[18px] text-[#7b837f]">
        {template.summary}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4 text-[11px] font-bold text-[#45524c]">
        <span>{template.requirements.length} dokumen</span>
        <Icon name="chevron" className="h-4 w-4 text-[#ef6335]" />
      </div>
    </button>
  )
}

function TemplateDetail({
  template,
  onBack,
  onStart,
  alreadyStarted,
}: {
  template: ServiceTemplate
  onBack: () => void
  onStart: () => void
  alreadyStarted: boolean
}) {
  const style = accentStyles[template.accent]
  return (
    <main className="min-h-dvh pb-28">
      <header className="relative overflow-hidden rounded-b-[34px] bg-[#173c32] px-5 pb-7 pt-5 text-white">
        <div className="absolute -right-12 -top-8 h-44 w-44 rounded-full border-[32px] border-white/5" />
        <button
          type="button"
          onClick={onBack}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10"
          aria-label="Kembali"
        >
          <Icon name="back" className="h-5 w-5" />
        </button>
        <div className="relative mt-7 flex items-start gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-[20px] ${style.bg} ${style.icon}`}
          >
            <Icon name={template.icon} className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#f8c85b]">
              {template.institution}
            </p>
            <h1 className="mt-1.5 text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em]">
              {template.title}
            </h1>
          </div>
        </div>
        <p className="relative mt-5 text-sm leading-6 text-white/70">{template.summary}</p>
        <div className="relative mt-5 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/8 px-3.5 py-3">
            <Icon name="document" className="h-4 w-4 text-[#f8c85b]" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/45">Kebutuhan</p>
              <p className="text-xs font-bold">{template.requirements.length} dokumen</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/8 px-3.5 py-3">
            <Icon name="clock" className="h-4 w-4 text-[#f8c85b]" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/45">Estimasi</p>
              <p className="text-xs font-bold">
                {template.durationEstimate.replace('Siapkan ', '')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="px-5 pt-7">
        <SectionHeading eyebrow="Checklist awal" title="Dokumen yang dibutuhkan" />
        <div className="mt-4 space-y-2.5">
          {template.requirements.map((requirement, index) => (
            <div
              key={requirement.id}
              className="flex gap-3 rounded-[20px] border border-[#e5e1d9] bg-white p-4"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f3eee5] text-[11px] font-extrabold text-[#59645f]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold">{requirement.name}</p>
                  {requirement.recommended && (
                    <span className="rounded-full bg-[#fff1da] px-2 py-0.5 text-[9px] font-bold text-[#956016]">
                      Jika berlaku
                    </span>
                  )}
                </div>
                {requirement.description && (
                  <p className="mt-1 text-xs leading-[18px] text-[#7a837f]">
                    {requirement.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {template.tips.length > 0 && (
        <section className="mx-5 mt-6 rounded-[22px] bg-[#fff0e8] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#c9512c]">
            Catatan penting
          </p>
          <ul className="mt-3 space-y-2">
            {template.tips.map((tip) => (
              <li key={tip.id} className="flex gap-2.5 text-xs leading-5 text-[#704132]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef6335]" />
                {tip.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[520px] border-t border-[#e8e2d8] bg-[#fffdf9]/95 p-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onStart}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f26438] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,100,56,0.25)] active:scale-[0.99]"
        >
          {alreadyStarted ? 'Buka checklist saya' : 'Mulai checklist'}
          <Icon name="chevron" className="h-4 w-4" />
        </button>
      </div>
    </main>
  )
}

function Plans({
  plans,
  onSelect,
  onManual,
  onBrowse,
}: {
  plans: Plan[]
  onSelect: (id: string) => void
  onManual: () => void
  onBrowse: () => void
}) {
  return (
    <main className="min-h-dvh px-5 pb-32 pt-7">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ef6335]">
            Ruang pribadimu
          </p>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-[-0.045em]">Berkas Saya</h1>
          <p className="mt-1 text-sm text-[#7c8580]">Pantau semua persiapanmu di sini.</p>
        </div>
        <button
          type="button"
          onClick={onManual}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f26438] text-white shadow-lg shadow-[#f26438]/20"
          aria-label="Buat checklist manual"
        >
          <Icon name="plus" className="h-6 w-6" />
        </button>
      </div>

      {plans.length ? (
        <div className="mt-7 space-y-3">
          {plans.map((plan) => {
            const progress = progressOf(plan)
            const days = daysUntil(plan.deadline)
            return (
              <button
                type="button"
                key={plan.id}
                onClick={() => onSelect(plan.id)}
                className="w-full rounded-[24px] border border-[#e5e1d8] bg-white p-5 text-left shadow-[0_6px_20px_rgba(30,39,34,0.04)] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#e8f3ea] text-[#2f7350]">
                      <Icon name="folder" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-extrabold">{plan.title}</h2>
                      <p className="mt-1 text-xs text-[#7c8580]">
                        {plan.documents.filter((item) => item.done).length} dari{' '}
                        {plan.documents.length} dokumen siap
                      </p>
                    </div>
                  </div>
                  <Icon name="chevron" className="mt-2 h-4 w-4 shrink-0 text-[#a4aaa6]" />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eeeae3]">
                  <div
                    className="h-full rounded-full bg-[#ef6335] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#ef6335]">{progress}% lengkap</span>
                  <span
                    className={days !== null && days <= 7 ? 'text-[#bd4d32]' : 'text-[#7b847f]'}
                  >
                    {days === null
                      ? 'Tanpa tenggat'
                      : days < 0
                        ? `Lewat ${Math.abs(days)} hari`
                        : `${days} hari lagi`}
                  </span>
                </div>
              </button>
            )
          })}
          <button
            type="button"
            onClick={onManual}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-[#c7c8c1] py-4 text-sm font-bold text-[#65706a]"
          >
            <Icon name="plus" className="h-4 w-4" />
            Buat checklist manual
          </button>
        </div>
      ) : (
        <div className="mt-14 text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-[30px] bg-[#e9f1ea] text-[#2f7350]">
            <div className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-xl bg-[#f8c85b] text-[#173c32]">
              <Icon name="plus" className="h-4 w-4" />
            </div>
            <Icon name="folder" className="h-11 w-11" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold tracking-[-0.03em]">Belum ada checklist</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#7b847f]">
            Pilih panduan layanan atau buat daftar persiapanmu sendiri.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="mt-6 rounded-2xl bg-[#173c32] px-6 py-3.5 text-sm font-extrabold text-white"
          >
            Cari panduan
          </button>
          <button
            type="button"
            onClick={onManual}
            className="mt-3 block w-full text-sm font-bold text-[#ef6335]"
          >
            Atau buat manual
          </button>
        </div>
      )}
    </main>
  )
}

function PlanDetail({
  plan,
  onBack,
  onToggle,
  onUpload,
  onDownload,
  onDeadline,
  onReminder,
  onRemove,
}: {
  plan: Plan
  onBack: () => void
  onToggle: (documentId: string) => void
  onUpload: (documentId: string, file?: File) => void
  onDownload: (document: PlanDocument) => void
  onDeadline: (value: string) => void
  onReminder: () => void
  onRemove: () => void
}) {
  const progress = progressOf(plan)
  return (
    <main className="min-h-dvh pb-12">
      <header className="rounded-b-[34px] bg-[#173c32] px-5 pb-7 pt-5 text-white">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
            aria-label="Kembali"
          >
            <Icon name="back" className="h-5 w-5" />
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Berkas saya</p>
          <button
            type="button"
            onClick={onRemove}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/70"
            aria-label="Hapus checklist"
          >
            <Icon name="trash" className="h-[18px] w-[18px]" />
          </button>
        </div>
        <h1 className="mt-7 text-[30px] font-extrabold leading-tight tracking-[-0.045em]">
          {plan.title}
        </h1>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-4xl font-extrabold tracking-[-0.05em]">{progress}%</p>
            <p className="mt-1 text-xs text-white/55">persiapan selesai</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-[#f8c85b]">
              {plan.documents.filter((item) => item.done).length}/{plan.documents.length}
            </p>
            <p className="mt-1 text-white/50">dokumen siap</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#f8c85b] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="px-5 pt-6">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="flex items-center gap-3 rounded-[18px] border border-[#e3ded5] bg-white px-4 py-3">
            <Icon name="calendar" className="h-5 w-5 text-[#ef6335]" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#909793]">
                Tenggat
              </p>
              <input
                type="date"
                value={plan.deadline}
                onChange={(event) => onDeadline(event.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-extrabold outline-none"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={onReminder}
            className={`grid w-[58px] place-items-center rounded-[18px] border ${
              plan.reminder
                ? 'border-[#f26438] bg-[#fff0e8] text-[#ef6335]'
                : 'border-[#e3ded5] bg-white text-[#9ba19e]'
            }`}
            aria-label={plan.reminder ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat'}
          >
            <Icon name="bell" className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="px-5 pt-7">
        <SectionHeading eyebrow="Daftar dokumen" title="Siapkan satu per satu" />
        <div className="mt-4 space-y-3">
          {plan.documents.map((document) => (
            <div
              key={document.id}
              className={`rounded-[22px] border p-4 transition ${
                document.done ? 'border-[#bcd6c3] bg-[#f2f8f3]' : 'border-[#e5e1d9] bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggle(document.id)}
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border-2 ${
                    document.done
                      ? 'border-[#327553] bg-[#327553] text-white'
                      : 'border-[#cfd2ce] text-transparent'
                  }`}
                  aria-label={`Tandai ${document.name} ${document.done ? 'belum selesai' : 'selesai'}`}
                >
                  <Icon name="check" className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-extrabold ${
                      document.done ? 'text-[#557064] line-through decoration-[#91aa9e]' : ''
                    }`}
                  >
                    {document.name}
                  </p>
                  {document.description && (
                    <p className="mt-1 text-xs leading-[18px] text-[#7c8580]">
                      {document.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-10 mt-3 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#f1eee7] px-3 py-2 text-[10px] font-extrabold text-[#59645f]">
                  <Icon name="upload" className="h-3.5 w-3.5" />
                  {document.hasFile ? 'Ganti file' : 'Simpan file'}
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event) => onUpload(document.id, event.target.files?.[0])}
                  />
                </label>
                {document.hasFile && (
                  <button
                    type="button"
                    onClick={() => onDownload(document)}
                    className="flex min-w-0 items-center gap-1.5 rounded-xl bg-[#e8f3ea] px-3 py-2 text-[10px] font-extrabold text-[#2f7350]"
                  >
                    <Icon name="download" className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-[120px] truncate">
                      {document.fileName || 'Buka file'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-7 flex items-start gap-3 rounded-[20px] bg-[#fff0e8] p-4">
        <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-[#d65a34]" />
        <p className="text-xs leading-5 text-[#754333]">
          File disimpan di penyimpanan browser perangkat ini, bukan di server. Jangan hapus data
          browser sebelum membuat salinan di tempat lain.
        </p>
      </section>
    </main>
  )
}

function Reminders({
  plans,
  onSelect,
  onToggle,
}: {
  plans: Plan[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const datedPlans = [...plans]
    .filter((plan) => plan.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  return (
    <main className="min-h-dvh px-5 pb-32 pt-7">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ef6335]">
        Jangan sampai terlewat
      </p>
      <h1 className="mt-1 text-[30px] font-extrabold tracking-[-0.045em]">Pengingat</h1>
      <p className="mt-1 text-sm text-[#7c8580]">Semua tenggat persiapanmu.</p>

      {datedPlans.length ? (
        <div className="mt-7 space-y-3">
          {datedPlans.map((plan) => {
            const days = daysUntil(plan.deadline) ?? 0
            const urgent = days <= 7
            return (
              <div
                key={plan.id}
                className={`rounded-[24px] border p-4 ${
                  urgent ? 'border-[#f0c2b2] bg-[#fff7f3]' : 'border-[#e5e1d8] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      urgent ? 'bg-[#f26438] text-white' : 'bg-[#e8f3ea] text-[#2f7350]'
                    }`}
                  >
                    <span className="text-base font-extrabold">
                      {new Date(`${plan.deadline}T12:00:00`).getDate()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(plan.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <h2 className="truncate text-sm font-extrabold">{plan.title}</h2>
                    <p className="mt-1 text-xs text-[#7a837f]">{formatDate(plan.deadline)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(plan.id)}
                    className={`relative h-7 w-12 rounded-full transition ${
                      plan.reminder ? 'bg-[#327553]' : 'bg-[#d7d8d4]'
                    }`}
                    aria-label={plan.reminder ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat'}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        plan.reminder ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] font-bold">
                  <span className={urgent ? 'text-[#c34f30]' : 'text-[#6b7670]'}>
                    {days < 0
                      ? `Terlambat ${Math.abs(days)} hari`
                      : days === 0
                        ? 'Tenggat hari ini'
                        : `${days} hari lagi`}
                  </span>
                  <span className="text-[#7b847f]">{progressOf(plan)}% selesai</span>
                </div>
              </div>
            )
          })}
          <div className="flex gap-3 rounded-[20px] bg-[#e9f1ea] p-4 text-[#315d49]">
            <Icon name="bell" className="h-5 w-5 shrink-0" />
            <p className="text-xs leading-5">
              Pengingat aktif ditandai hijau. Tenggat tetap tersimpan di perangkat meski pengingat
              dinonaktifkan.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-16 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] bg-[#fff0e8] text-[#ef6335]">
            <Icon name="calendar" className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold">Belum ada tenggat</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#7b847f]">
            Tambahkan checklist dan tentukan tanggal agar persiapan lebih teratur.
          </p>
        </div>
      )}
    </main>
  )
}

function BottomNav({ current, onChange }: { current: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: string }> = [
    { tab: 'home', label: 'Beranda', icon: 'home' },
    { tab: 'plans', label: 'Berkas', icon: 'folder' },
    { tab: 'reminders', label: 'Pengingat', icon: 'bell' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[82px] max-w-[520px] items-start justify-around border-t border-[#e6e1d7] bg-[#fffdf9]/95 px-5 pt-3 backdrop-blur-xl">
      {items.map((item) => (
        <button
          key={item.tab}
          type="button"
          onClick={() => onChange(item.tab)}
          className={`flex min-w-[76px] flex-col items-center gap-1.5 text-[10px] font-extrabold ${
            current === item.tab ? 'text-[#ef6335]' : 'text-[#8d9490]'
          }`}
        >
          <span
            className={`grid h-8 w-12 place-items-center rounded-xl ${
              current === item.tab ? 'bg-[#fff0e8]' : ''
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function ManualPlanForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#101b17]/45 p-0 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Tutup formulir"
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[90dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[32px] bg-[#fffdf9] px-5 pb-8 pt-4"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d7d4cd]" />
        <div className="mt-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ef6335]">
              Checklist baru
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Buat secara manual</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f0ede7] text-lg"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <label className="mt-7 block">
          <span className="text-xs font-extrabold">Nama persiapan</span>
          <input
            name="title"
            required
            placeholder="Contoh: Daftar beasiswa"
            className="mt-2 h-13 w-full rounded-2xl border border-[#dedbd4] bg-white px-4 text-sm outline-none focus:border-[#ef6335]"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-extrabold">Tenggat</span>
          <input
            name="deadline"
            type="date"
            defaultValue={createDeadline(30)}
            className="mt-2 h-13 w-full rounded-2xl border border-[#dedbd4] bg-white px-4 text-sm outline-none focus:border-[#ef6335]"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-extrabold">Daftar dokumen</span>
          <span className="ml-2 text-[10px] text-[#8a918d]">Satu dokumen per baris</span>
          <textarea
            name="documents"
            required
            rows={6}
            placeholder={'KTP\nKartu Keluarga\nIjazah terakhir'}
            className="mt-2 w-full resize-none rounded-2xl border border-[#dedbd4] bg-white p-4 text-sm leading-6 outline-none focus:border-[#ef6335]"
          />
        </label>
        <button
          type="submit"
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f26438] text-sm font-extrabold text-white"
        >
          <Icon name="plus" className="h-5 w-5" />
          Buat checklist
        </button>
      </form>
    </div>
  )
}
