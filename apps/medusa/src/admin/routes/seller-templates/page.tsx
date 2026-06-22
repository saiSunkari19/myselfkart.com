import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types (mirrored from src/platform — admin bundle can't import server modules)
// ---------------------------------------------------------------------------

type TemplateId = "eventpass" | "thread" | "aurum" | "volt" | "glow"

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

type SectionFieldType = "text" | "richtext" | "image" | "icon" | "number"

type SectionFieldDef = {
  key: string
  label: string
  type: SectionFieldType
  required?: boolean
}

type SectionDef = {
  id: string
  type: "hero" | "testimonial-list" | "feature-list" | "editorial-banner" | "newsletter"
  label: string
  list: boolean
  minItems?: number
  maxItems?: number
  maxImages?: number
  fields: SectionFieldDef[]
}

type Template = {
  id: TemplateId
  name: string
  description: string
  good_for: string
  preview_path: string
  thumbnail_url: string
  is_default: boolean
  sections: SectionDef[]
}

const STOREFRONT_BASE =
  (typeof window !== "undefined" &&
    (window as any).__STOREFRONT_BASE__) ||
  "http://localhost:3000"

// Per-template suggested brand colours — shown as hints during quick setup
const TEMPLATE_COLORS: Record<TemplateId, string> = {
  aurum: "#B8860B",
  thread: "#111111",
  volt: "#2563EB",
  eventpass: "#7C3AED",
  glow: "#96986d",
}

type HeroCta = {
  primary_label: string
  primary_link: string
  secondary_label?: string
  secondary_link?: string
}

type TrustBadge = {
  icon: string
  title: string
  description: string
}

type FilterConfig = {
  enabled: string[]
  order: string[]
  labels: Record<string, string>
}

type StoreConfig = {
  tenant_id: string
  template_id: TemplateId | null
  // Branding
  logo_url: string | null
  store_name: string | null
  tagline: string | null
  favicon_url: string | null
  // Theme
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  color_mode: "light" | "dark"
  font_heading: string | null
  font_body: string | null
  // Homepage
  announcement_enabled: boolean
  announcement_text: string | null
  hero_image_url: string | null
  hero_heading: string | null
  hero_subtext: string | null
  hero_cta: HeroCta | null
  trust_badges: TrustBadge[] | null
  // Policies
  return_policy: string | null
  shipping_policy: string | null
  privacy_policy: string | null
  terms_policy: string | null
  // Contact
  about_text: string | null
  contact_email: string | null
  contact_phone: string | null
  whatsapp_number: string | null
  instagram_url: string | null
  youtube_url: string | null
  gst_number: string | null
  business_address: string | null
  // SEO
  seo_title: string | null
  seo_description: string | null
  seo_og_image_url: string | null
  // Commerce
  free_shipping_threshold: number | null
  cod_enabled: boolean
  whatsapp_notifications_enabled: boolean
  custom_domain: string | null
  is_published: boolean
  // Filters
  filter_config: FilterConfig | null
  // Per-template homepage section content (testimonials, banners, etc.)
  sections: Record<string, any> | null
}

type ConfigResponse = {
  config: StoreConfig | null
  templates: Template[]
  storefront_url: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "playfair", label: "Playfair Display" },
  { value: "lato", label: "Lato" },
  { value: "raleway", label: "Raleway" },
  { value: "montserrat", label: "Montserrat" },
]

const ALL_FILTERS = [
  { key: "category", label: "Category" },
  { key: "price", label: "Price range" },
  { key: "availability", label: "Availability (in stock)" },
  { key: "brand", label: "Brand" },
  { key: "rating", label: "Customer rating" },
  { key: "discount", label: "Discount / Offers" },
  { key: "color", label: "Color" },
  { key: "size", label: "Size" },
  { key: "material", label: "Material" },
  { key: "weight", label: "Weight" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${res.status}`
    )
  }
  return body as T
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

const SectionBlock = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-4 rounded-lg border border-ui-border-base p-6">
    <Text size="small" weight="plus" className="text-ui-fg-base">
      {title}
    </Text>
    {children}
  </div>
)

const FieldRow = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="grid gap-1.5">
    <Label className="text-ui-fg-subtle text-sm">{label}</Label>
    {children}
    {hint && (
      <Text size="xsmall" className="text-ui-fg-muted">
        {hint}
      </Text>
    )}
  </div>
)

const StyledTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full resize-y rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 font-sans text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
  />
)

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) => (
  <label className="flex cursor-pointer items-center gap-3">
    <div
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-ui-border-strong"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </div>
    <Text size="small" className="text-ui-fg-base">
      {label}
    </Text>
  </label>
)

// ---------------------------------------------------------------------------
// ColorInput — inline colour picker + hex text field
// ---------------------------------------------------------------------------

const ColorInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) => (
  <FieldRow label={label}>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-ui-border-base bg-transparent p-0.5"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  </FieldRow>
)

// ---------------------------------------------------------------------------
// LogoUpload — file picker that uploads to /admin/uploads and returns URL
// ---------------------------------------------------------------------------

const LogoUpload = ({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 5MB.`)
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message ?? "Upload failed")
      const url: string = body.files?.[0]?.url ?? ""
      if (url) onChange(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt="Logo preview"
            className="h-10 max-w-[120px] rounded border border-ui-border-base object-contain bg-ui-bg-subtle p-1"
          />
        )}
        <Button
          variant="secondary"
          size="small"
          type="button"
          isLoading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "Replace logo" : "Upload logo"}
        </Button>
        {value && (
          <Button
            variant="transparent"
            size="small"
            type="button"
            onClick={() => onChange("")}
          >
            Remove
          </Button>
        )}
      </div>
      <Text size="xsmall" className="text-ui-fg-muted">
        PNG, SVG, or ICO.
      </Text>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TemplateCard
// ---------------------------------------------------------------------------

const TemplateCard = ({
  template,
  isDefault,
  storefrontBase,
  onSelect,
}: {
  template: Template
  isDefault: boolean
  storefrontBase: string
  onSelect: (t: Template) => void
}) => (
  <div
    className={`flex flex-col gap-3 rounded-lg border p-5 transition-colors ${
      isDefault
        ? "border-ui-border-interactive bg-ui-bg-highlight"
        : "border-ui-border-base bg-ui-bg-base"
    }`}
  >
    <div className="relative overflow-hidden rounded-md bg-ui-bg-subtle" style={{ height: 144 }}>
      <iframe
        src={`${storefrontBase}${template.preview_path}`}
        title={`${template.name} preview`}
        scrolling="no"
        style={{
          width: 1280,
          height: 900,
          border: "none",
          transformOrigin: "top left",
          transform: "scale(0.235)",
          pointerEvents: "none",
        }}
      />
      <div className="absolute inset-0" />
    </div>

    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Text size="small" weight="plus" className="text-ui-fg-base">
          {template.name}
        </Text>
        {isDefault && (
          <Badge color="blue" size="2xsmall">
            Default
          </Badge>
        )}
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        {template.description}
      </Text>
      <Text size="xsmall" className="text-ui-fg-muted">
        Good for: {template.good_for}
      </Text>
    </div>

    <div className="flex gap-2 mt-auto">
      <Button
        variant="secondary"
        size="small"
        onClick={() => window.open(`${storefrontBase}${template.preview_path}`, "_blank")}
      >
        Preview
      </Button>
      <Button variant="primary" size="small" onClick={() => onSelect(template)}>
        Select
      </Button>
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// TemplatePicker
// ---------------------------------------------------------------------------

const TemplatePicker = ({
  templates,
  storefrontBase,
  onConfirmed,
}: {
  templates: Template[]
  storefrontBase: string
  onConfirmed: (config: StoreConfig) => void
}) => {
  const [pending, setPending] = useState<Template | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)

  const handleConfirm = async () => {
    if (!pending) return
    setConfirming(true)
    setError(null)
    try {
      const data = await apiFetch<{ config: StoreConfig }>(
        "/admin/selfkart/store-config/template",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: pending.id }),
        }
      )
      toast.success(`${pending.name} template selected. Let's set up your store.`)
      onConfirmed(data.config)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Choose your store template</Heading>
        <Text className="text-ui-fg-subtle mt-1" size="small">
          Preview each template and pick the one that fits your store. This
          choice cannot be changed later.
        </Text>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isDefault={t.is_default}
              storefrontBase={storefrontBase}
              onSelect={(tpl) => {
                setPending(tpl)
                setError(null)
                setTimeout(() => confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
              }}
            />
          ))}
        </div>
      </div>

      {pending && (
        <div ref={confirmRef} className="flex flex-col gap-3 bg-ui-bg-highlight px-6 py-4">
          <div className="flex items-start gap-3 rounded-md border border-ui-border-caution bg-ui-bg-base p-4">
            <div className="flex flex-col gap-1">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                You selected: {pending.name}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                This choice is final. You cannot change your template later.
                Make sure you've previewed all options before confirming.
              </Text>
            </div>
          </div>

          {error && (
            <Text size="small" className="text-ui-fg-error">
              {error}
            </Text>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setPending(null)}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleConfirm}
              isLoading={confirming}
            >
              Confirm — use {pending.name}
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

// ---------------------------------------------------------------------------
// QuickSetupView — 3-field quick setup between picker and advanced tabs
// ---------------------------------------------------------------------------

const QuickSetupView = ({
  initialConfig,
  onDone,
  onBack,
  storefrontUrl,
}: {
  initialConfig: StoreConfig
  onDone: (config: StoreConfig) => void
  onBack: () => void
  storefrontUrl: string | null
}) => {
  const templateId = initialConfig.template_id as TemplateId
  const suggestedColor = TEMPLATE_COLORS[templateId] ?? "#000000"

  const [storeName, setStoreName] = useState(initialConfig.store_name ?? "")
  const [logoUrl, setLogoUrl] = useState(initialConfig.logo_url ?? "")
  const [brandColor, setBrandColor] = useState(
    initialConfig.primary_color ?? suggestedColor
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [savedConfig, setSavedConfig] = useState<StoreConfig | null>(null)

  const handleLaunch = async () => {
    if (!storeName.trim()) {
      setError("Please enter your store name.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const data = await apiFetch<{ config: StoreConfig }>(
        "/admin/selfkart/store-config/quick-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_name: storeName.trim(),
            logo_url: logoUrl.trim() || undefined,
            primary_color: brandColor,
          }),
        }
      )
      setSavedConfig(data.config)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (done && savedConfig) {
    return (
      <Container className="p-0">
        <div className="flex flex-col items-center gap-6 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ui-tag-green-bg text-4xl">
            🎉
          </div>
          <div className="flex flex-col gap-2">
            <Heading level="h1">Your store is ready!</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {savedConfig.store_name} has been set up with your template and branding.
            </Text>
          </div>

          {storefrontUrl && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-6 py-4 w-full max-w-md">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                Your store URL
              </Text>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-ui-fg-interactive hover:underline break-all"
              >
                {storefrontUrl}
              </a>
              <Button
                variant="secondary"
                size="small"
                onClick={() => window.open(storefrontUrl, "_blank")}
              >
                Open store ↗
              </Button>
            </div>
          )}

          <Button
            variant="primary"
            size="base"
            onClick={() => onDone(savedConfig)}
          >
            Continue to Store Design →
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Set up your store</Heading>
          <Text className="text-ui-fg-subtle mt-1" size="small">
            Fill in three basics and we'll pre-fill the rest — policies, SEO, hero
            text and more. You can change everything later.
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={onBack}>
          ← Back to templates
        </Button>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-lg flex flex-col gap-6">
          {/* Store name */}
          <FieldRow
            label="Store name *"
            hint="This appears on your storefront, policies, emails, and SEO. Choose carefully."
          >
            <Input
              placeholder="e.g. Priya Fashion House"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              autoFocus
            />
          </FieldRow>

          {/* Logo */}
          <FieldRow label="Logo" hint="You can add or change this later.">
            <LogoUpload value={logoUrl} onChange={setLogoUrl} />
          </FieldRow>

          {/* Brand colour */}
          <FieldRow
            label="Brand colour"
            hint={`Suggested for ${templateId}: ${suggestedColor}. Used for buttons, links, and accents.`}
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-ui-border-base bg-transparent p-0.5"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder={suggestedColor}
                className="font-mono"
              />
              <Button
                variant="transparent"
                size="small"
                onClick={() => setBrandColor(suggestedColor)}
                className="whitespace-nowrap"
              >
                Reset to suggested
              </Button>
            </div>
          </FieldRow>

          {/* What gets pre-filled info box */}
          <div className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4">
            <Text size="small" weight="plus" className="text-ui-fg-base mb-2">
              What we'll pre-fill for you
            </Text>
            <ul className="flex flex-col gap-1">
              {[
                "Return, shipping, privacy & terms policies (with your store name inserted)",
                "Hero banner text and call-to-action buttons",
                "SEO title and meta description",
                "Trust badges (Genuine · Free delivery · Easy returns · Secure payment)",
                "Announcement bar text",
                "About us text",
                "Shop filters (category, price, availability)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <Text size="xsmall" className="text-ui-fg-muted leading-relaxed">
                    · {item}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <Text size="small" className="text-ui-fg-error">
              {error}
            </Text>
          )}

          <Button
            variant="primary"
            size="base"
            onClick={handleLaunch}
            isLoading={saving}
            className="w-full"
          >
            Set up my store →
          </Button>
        </div>
      </div>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId =
  | "branding"
  | "theme"
  | "homepage"
  | "sections"
  | "policies"
  | "contact"
  | "seo"
  | "commerce"
  | "filters"

const TABS: { id: TabId; label: string }[] = [
  { id: "branding", label: "Branding" },
  { id: "theme", label: "Theme" },
  { id: "homepage", label: "Homepage" },
  { id: "sections", label: "Sections" },
  { id: "policies", label: "Policies" },
  { id: "contact", label: "Contact" },
  { id: "seo", label: "SEO" },
  { id: "commerce", label: "Commerce" },
  { id: "filters", label: "Filters" },
]

// ---------------------------------------------------------------------------
// BrandingTab
// ---------------------------------------------------------------------------

const BrandingTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    store_name: config.store_name ?? "",
    tagline: config.tagline ?? "",
    logo_url: config.logo_url ?? "",
    favicon_url: config.favicon_url ?? "",
  })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: form.store_name || null,
          tagline: form.tagline || null,
          logo_url: form.logo_url || null,
          favicon_url: form.favicon_url || null,
        }),
      })
      toast.success("Branding saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Store identity">
        <FieldRow label="Store name">
          <Input
            placeholder="My Awesome Store"
            value={form.store_name}
            onChange={set("store_name")}
          />
        </FieldRow>
        <FieldRow label="Tagline" hint="Shown beneath your logo on the storefront.">
          <Input
            placeholder="Quality you can trust"
            value={form.tagline}
            onChange={set("tagline")}
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Images">
        <FieldRow label="Logo">
          <LogoUpload
            value={form.logo_url}
            onChange={(url) => setForm((p) => ({ ...p, logo_url: url }))}
          />
        </FieldRow>
        <FieldRow label="Favicon" hint="16×16 or 32×32 .ico or .png — the small icon shown in browser tabs.">
          <LogoUpload
            value={form.favicon_url}
            onChange={(url) => setForm((p) => ({ ...p, favicon_url: url }))}
          />
        </FieldRow>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save branding
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ThemeTab
// ---------------------------------------------------------------------------

const ThemeTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    primary_color: config.primary_color ?? "#000000",
    secondary_color: config.secondary_color ?? "#ffffff",
    accent_color: config.accent_color ?? "#6366f1",
    color_mode: config.color_mode ?? "light",
    font_heading: config.font_heading ?? "inter",
    font_body: config.font_body ?? "inter",
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      toast.success("Theme saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Colours">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ColorInput
            label="Primary colour"
            value={form.primary_color}
            onChange={(v) => setForm((p) => ({ ...p, primary_color: v }))}
            placeholder="#000000"
          />
          <ColorInput
            label="Secondary colour"
            value={form.secondary_color}
            onChange={(v) => setForm((p) => ({ ...p, secondary_color: v }))}
            placeholder="#ffffff"
          />
          <ColorInput
            label="Accent colour"
            value={form.accent_color}
            onChange={(v) => setForm((p) => ({ ...p, accent_color: v }))}
            placeholder="#6366f1"
          />
        </div>
        <FieldRow label="Colour mode">
          <Select
            value={form.color_mode}
            onValueChange={(v) =>
              setForm((p) => ({ ...p, color_mode: v as "light" | "dark" }))
            }
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="light">Light</Select.Item>
              <Select.Item value="dark">Dark</Select.Item>
            </Select.Content>
          </Select>
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Typography">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Heading font">
            <Select
              value={form.font_heading}
              onValueChange={(v) => setForm((p) => ({ ...p, font_heading: v }))}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {FONT_OPTIONS.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    {f.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </FieldRow>
          <FieldRow label="Body font">
            <Select
              value={form.font_body}
              onValueChange={(v) => setForm((p) => ({ ...p, font_body: v }))}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {FONT_OPTIONS.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    {f.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </FieldRow>
        </div>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save theme
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HomepageTab
// ---------------------------------------------------------------------------

const HomepageTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    announcement_enabled: config.announcement_enabled ?? true,
    announcement_text: config.announcement_text ?? "",
    hero_image_url: config.hero_image_url ?? "",
    hero_heading: config.hero_heading ?? "",
    hero_subtext: config.hero_subtext ?? "",
    hero_cta_primary_label: config.hero_cta?.primary_label ?? "",
    hero_cta_primary_link: config.hero_cta?.primary_link ?? "",
    hero_cta_secondary_label: config.hero_cta?.secondary_label ?? "",
    hero_cta_secondary_link: config.hero_cta?.secondary_link ?? "",
  })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const hero_cta: HeroCta = {
        primary_label: form.hero_cta_primary_label,
        primary_link: form.hero_cta_primary_link,
        secondary_label: form.hero_cta_secondary_label || undefined,
        secondary_link: form.hero_cta_secondary_link || undefined,
      }
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement_enabled: form.announcement_enabled,
          announcement_text: form.announcement_text || null,
          hero_image_url: form.hero_image_url || null,
          hero_heading: form.hero_heading || null,
          hero_subtext: form.hero_subtext || null,
          hero_cta,
        }),
      })
      toast.success("Homepage saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Announcement bar">
        <Toggle
          checked={form.announcement_enabled}
          onChange={(v) => setForm((p) => ({ ...p, announcement_enabled: v }))}
          label="Show announcement bar at the top of the page"
        />
        {form.announcement_enabled && (
          <FieldRow label="Announcement text">
            <Input
              placeholder="Free delivery on orders above ₹999"
              value={form.announcement_text}
              onChange={set("announcement_text")}
            />
          </FieldRow>
        )}
      </SectionBlock>

      <SectionBlock title="Hero banner">
        <FieldRow label="Banner image" hint="Full-width background image for the hero section.">
          <LogoUpload
            value={form.hero_image_url}
            onChange={(url) => setForm((p) => ({ ...p, hero_image_url: url }))}
          />
        </FieldRow>
        <FieldRow label="Heading">
          <Input
            placeholder="Welcome to our store"
            value={form.hero_heading}
            onChange={set("hero_heading")}
          />
        </FieldRow>
        <FieldRow label="Subtext">
          <Input
            placeholder="Discover our latest collection"
            value={form.hero_subtext}
            onChange={set("hero_subtext")}
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Hero buttons">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Primary button label">
            <Input
              placeholder="Shop Now"
              value={form.hero_cta_primary_label}
              onChange={set("hero_cta_primary_label")}
            />
          </FieldRow>
          <FieldRow label="Primary button link">
            <Input
              placeholder="/shop"
              value={form.hero_cta_primary_link}
              onChange={set("hero_cta_primary_link")}
            />
          </FieldRow>
          <FieldRow label="Secondary button label (optional)">
            <Input
              placeholder="New Arrivals"
              value={form.hero_cta_secondary_label}
              onChange={set("hero_cta_secondary_label")}
            />
          </FieldRow>
          <FieldRow label="Secondary button link (optional)">
            <Input
              placeholder="/new"
              value={form.hero_cta_secondary_link}
              onChange={set("hero_cta_secondary_link")}
            />
          </FieldRow>
        </div>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save homepage
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PoliciesTab
// ---------------------------------------------------------------------------

const PoliciesTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    return_policy: config.return_policy ?? "",
    shipping_policy: config.shipping_policy ?? "",
    privacy_policy: config.privacy_policy ?? "",
    terms_policy: config.terms_policy ?? "",
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_policy: form.return_policy || null,
          shipping_policy: form.shipping_policy || null,
          privacy_policy: form.privacy_policy || null,
          terms_policy: form.terms_policy || null,
        }),
      })
      toast.success("Policies saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Text size="small" className="text-ui-fg-muted">
        These policies were pre-filled with your store name. Edit them to match
        your actual terms before going live.
      </Text>

      {(
        [
          { key: "return_policy" as const, label: "Return & Exchange policy" },
          { key: "shipping_policy" as const, label: "Shipping policy" },
          { key: "privacy_policy" as const, label: "Privacy policy" },
          { key: "terms_policy" as const, label: "Terms & Conditions" },
        ] as const
      ).map(({ key, label }) => (
        <SectionBlock key={key} title={label}>
          <StyledTextarea
            value={form[key]}
            onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
            rows={10}
            placeholder={`Enter your ${label.toLowerCase()}…`}
          />
        </SectionBlock>
      ))}

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save policies
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContactTab
// ---------------------------------------------------------------------------

const ContactTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    about_text: config.about_text ?? "",
    contact_email: config.contact_email ?? "",
    contact_phone: config.contact_phone ?? "",
    whatsapp_number: config.whatsapp_number ?? "",
    instagram_url: config.instagram_url ?? "",
    youtube_url: config.youtube_url ?? "",
    gst_number: config.gst_number ?? "",
    business_address: config.business_address ?? "",
  })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_text: form.about_text || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          whatsapp_number: form.whatsapp_number || null,
          instagram_url: form.instagram_url || null,
          youtube_url: form.youtube_url || null,
          gst_number: form.gst_number || null,
          business_address: form.business_address || null,
        }),
      })
      toast.success("Contact details saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="About your store">
        <FieldRow label="About us text" hint="Shown on your About page and store footer.">
          <StyledTextarea
            value={form.about_text}
            onChange={(v) => setForm((p) => ({ ...p, about_text: v }))}
            rows={4}
            placeholder="Tell customers who you are and what you sell…"
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Contact details">
        <FieldRow label="Contact email">
          <Input
            placeholder="hello@yourstore.com"
            value={form.contact_email}
            onChange={set("contact_email")}
          />
        </FieldRow>
        <FieldRow label="Contact phone">
          <Input
            placeholder="+91 98765 43210"
            value={form.contact_phone}
            onChange={set("contact_phone")}
          />
        </FieldRow>
        <FieldRow label="WhatsApp number" hint="Used for WhatsApp chat button and order notifications.">
          <Input
            placeholder="+91 98765 43210"
            value={form.whatsapp_number}
            onChange={set("whatsapp_number")}
          />
        </FieldRow>
        <FieldRow label="Business address" hint="Shown on invoices and your contact page.">
          <StyledTextarea
            value={form.business_address}
            onChange={(v) => setForm((p) => ({ ...p, business_address: v }))}
            rows={3}
            placeholder="123, Street Name, City, State - PIN"
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Social media">
        <FieldRow label="Instagram URL">
          <Input
            placeholder="https://instagram.com/yourstore"
            value={form.instagram_url}
            onChange={set("instagram_url")}
          />
        </FieldRow>
        <FieldRow label="YouTube URL">
          <Input
            placeholder="https://youtube.com/@yourstore"
            value={form.youtube_url}
            onChange={set("youtube_url")}
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Business registration">
        <FieldRow label="GST number" hint="Displayed on invoices if provided.">
          <Input
            placeholder="22AAAAA0000A1Z5"
            value={form.gst_number}
            onChange={set("gst_number")}
          />
        </FieldRow>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save contact details
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SEOTab
// ---------------------------------------------------------------------------

const SEOTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    seo_title: config.seo_title ?? "",
    seo_description: config.seo_description ?? "",
    seo_og_image_url: config.seo_og_image_url ?? "",
  })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          seo_og_image_url: form.seo_og_image_url || null,
        }),
      })
      toast.success("SEO settings saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  const titleLen = form.seo_title.length
  const descLen = form.seo_description.length

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Search engine listing">
        <FieldRow
          label={`Page title (${titleLen}/60)`}
          hint="Shown as the clickable title in Google results. Keep it under 60 characters."
        >
          <Input
            placeholder="My Store — Quality you can trust"
            value={form.seo_title}
            onChange={set("seo_title")}
          />
        </FieldRow>
        <FieldRow
          label={`Meta description (${descLen}/160)`}
          hint="Short description shown below the title in search results. Aim for 120–160 characters."
        >
          <StyledTextarea
            value={form.seo_description}
            onChange={(v) => setForm((p) => ({ ...p, seo_description: v }))}
            rows={3}
            placeholder="Shop quality products at great prices. Free delivery on orders above ₹999…"
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Social sharing image">
        <FieldRow label="Social sharing image" hint="Shown when your store link is shared on WhatsApp, Facebook, Twitter. Recommended: 1200×630 px.">
          <LogoUpload
            value={form.seo_og_image_url}
            onChange={(url) => setForm((p) => ({ ...p, seo_og_image_url: url }))}
          />
        </FieldRow>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save SEO settings
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CommerceTab
// ---------------------------------------------------------------------------

const CommerceTab = ({ config }: { config: StoreConfig }) => {
  const [form, setForm] = useState({
    free_shipping_threshold: String(config.free_shipping_threshold ?? 999),
    cod_enabled: config.cod_enabled ?? false,
    whatsapp_notifications_enabled: config.whatsapp_notifications_enabled ?? false,
    custom_domain: config.custom_domain ?? "",
    is_published: config.is_published ?? false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          free_shipping_threshold: Number(form.free_shipping_threshold) || null,
          cod_enabled: form.cod_enabled,
          whatsapp_notifications_enabled: form.whatsapp_notifications_enabled,
          custom_domain: form.custom_domain || null,
          is_published: form.is_published,
        }),
      })
      toast.success("Commerce settings saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Shipping">
        <FieldRow label="Free shipping above (₹)" hint="Orders above this amount get free shipping. Set to 0 to always offer free shipping.">
          <Input
            type="number"
            placeholder="999"
            value={form.free_shipping_threshold}
            onChange={(e) => setForm((p) => ({ ...p, free_shipping_threshold: e.target.value }))}
            className="max-w-xs"
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Payment options">
        <Toggle
          checked={form.cod_enabled}
          onChange={(v) => setForm((p) => ({ ...p, cod_enabled: v }))}
          label="Cash on Delivery (COD) enabled"
        />
      </SectionBlock>

      <SectionBlock title="Notifications">
        <Toggle
          checked={form.whatsapp_notifications_enabled}
          onChange={(v) => setForm((p) => ({ ...p, whatsapp_notifications_enabled: v }))}
          label="Send order updates via WhatsApp"
        />
        <Text size="xsmall" className="text-ui-fg-muted">
          Requires a valid WhatsApp number in the Contact tab.
        </Text>
      </SectionBlock>

      <SectionBlock title="Custom domain">
        <FieldRow label="Your domain" hint="e.g. shop.mystore.in — point your domain DNS to our servers before enabling.">
          <Input
            placeholder="shop.mystore.in"
            value={form.custom_domain}
            onChange={(e) => setForm((p) => ({ ...p, custom_domain: e.target.value }))}
          />
        </FieldRow>
      </SectionBlock>

      <SectionBlock title="Store visibility">
        <Toggle
          checked={form.is_published}
          onChange={(v) => setForm((p) => ({ ...p, is_published: v }))}
          label="Store is live and visible to customers"
        />
        {!form.is_published && (
          <Text size="xsmall" className="text-ui-fg-muted">
            Your store is in draft mode. Customers cannot access it.
          </Text>
        )}
        {form.is_published && (
          <Text size="xsmall" className="text-ui-fg-muted">
            Your store is live. Make sure all settings and products are ready.
          </Text>
        )}
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save commerce settings
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FiltersTab
// ---------------------------------------------------------------------------

const FiltersTab = ({ config }: { config: StoreConfig }) => {
  const initialEnabled = new Set(config.filter_config?.enabled ?? ["category", "price", "availability"])
  const [enabled, setEnabled] = useState<Set<string>>(initialEnabled)
  const [saving, setSaving] = useState(false)

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const enabledArr = ALL_FILTERS.map((f) => f.key).filter((k) => enabled.has(k))
      await apiFetch("/admin/selfkart/store-config/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter_config: {
            enabled: enabledArr,
            order: enabledArr,
            labels: {},
          },
        }),
      })
      toast.success("Filter settings saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SectionBlock title="Shop page filters">
        <Text size="small" className="text-ui-fg-muted">
          Choose which filters appear on your shop page. Customers use these to
          narrow down products. Only enable filters that are relevant to what
          you sell.
        </Text>

        <div className="flex flex-col gap-3 mt-2">
          {ALL_FILTERS.map(({ key, label }) => (
            <Toggle
              key={key}
              checked={enabled.has(key)}
              onChange={() => toggle(key)}
              label={label}
            />
          ))}
        </div>

        <Text size="xsmall" className="text-ui-fg-muted mt-2">
          {enabled.size} of {ALL_FILTERS.length} filters enabled.
        </Text>
      </SectionBlock>

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save filter settings
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SectionsTab — schema-driven editor for the locked template's homepage
// sections. The form shown is generated from `template.sections`, so a
// template with a single-image hero gets one upload slot, a template with a
// slider hero gets a repeatable image list, a template with no testimonials
// section gets no testimonial editor, etc.
// ---------------------------------------------------------------------------

const GenericImageUpload = ({
  value,
  onChange,
  uploadLabel = "Upload image",
}: {
  value: string
  onChange: (url: string) => void
  uploadLabel?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 5MB.`)
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message ?? "Upload failed")
      const url: string = body.files?.[0]?.url ?? ""
      if (url) onChange(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />
      {value && (
        <img
          src={value}
          alt=""
          className="h-14 w-20 rounded border border-ui-border-base object-cover bg-ui-bg-subtle"
        />
      )}
      <Button
        variant="secondary"
        size="small"
        type="button"
        isLoading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {value ? "Replace" : uploadLabel}
      </Button>
      {value && (
        <Button variant="transparent" size="small" type="button" onClick={() => onChange("")}>
          Remove
        </Button>
      )}
    </div>
  )
}

/** Renders a single field per its SectionFieldDef.type. */
const SectionField = ({
  field,
  value,
  onChange,
}: {
  field: SectionFieldDef
  value: any
  onChange: (v: any) => void
}) => {
  switch (field.type) {
    case "image":
      return (
        <FieldRow label={field.label}>
          <GenericImageUpload value={value ?? ""} onChange={onChange} />
        </FieldRow>
      )
    case "richtext":
      return (
        <FieldRow label={field.label}>
          <StyledTextarea value={value ?? ""} onChange={onChange} rows={2} />
        </FieldRow>
      )
    case "number":
      return (
        <FieldRow label={field.label}>
          <Input
            type="number"
            min={1}
            max={5}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        </FieldRow>
      )
    case "icon":
      return (
        <FieldRow label={field.label} hint="Paste an emoji, e.g. 🏆">
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-20" />
        </FieldRow>
      )
    default:
      return (
        <FieldRow label={field.label}>
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </FieldRow>
      )
  }
}

const emptyItem = (fields: SectionFieldDef[]): Record<string, any> =>
  Object.fromEntries(fields.map((f) => [f.key, f.type === "number" ? null : ""]))

/** One section block — single form, repeatable list, or multi-image hero. */
const SectionEditor = ({
  def,
  value,
  onSave,
}: {
  def: SectionDef
  value: any
  onSave: (sectionId: string, value: any) => Promise<void>
}) => {
  const [saving, setSaving] = useState(false)

  // Hero with maxImages > 1 — repeatable image-only list (slider slides)
  const isImageSlider = def.type === "hero" && (def.maxImages ?? 1) > 1

  const [items, setItems] = useState<Record<string, any>[]>(() => {
    if (def.list) return Array.isArray(value?.items) ? value.items : []
    if (isImageSlider) return Array.isArray(value?.images) ? value.images.map((url: string) => ({ image: url })) : []
    return []
  })
  const [single, setSingle] = useState<Record<string, any>>(() =>
    !def.list && !isImageSlider ? (value ?? emptyItem(def.fields)) : {}
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      let payload: any
      if (def.list) {
        payload = { items }
      } else if (isImageSlider) {
        payload = { images: items.map((it) => it.image).filter(Boolean) }
      } else {
        payload = single
      }
      await onSave(def.id, payload)
      toast.success(`${def.label} saved.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save section.")
    } finally {
      setSaving(false)
    }
  }

  const canAddMore = def.maxItems === undefined || items.length < def.maxItems
  const canRemove = def.minItems === undefined || items.length > def.minItems

  return (
    <SectionBlock title={def.label}>
      {def.list && (
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 rounded-md border border-ui-border-base p-4">
              {def.fields.map((f) => (
                <SectionField
                  key={f.key}
                  field={f}
                  value={item[f.key]}
                  onChange={(v) =>
                    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [f.key]: v } : it)))
                  }
                />
              ))}
              <div className="flex justify-end">
                <Button
                  variant="transparent"
                  size="small"
                  type="button"
                  disabled={!canRemove}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="small"
            type="button"
            disabled={!canAddMore}
            onClick={() => setItems((prev) => [...prev, emptyItem(def.fields)])}
          >
            Add {def.label.toLowerCase()} item
          </Button>
          {def.minItems !== undefined && (
            <Text size="xsmall" className="text-ui-fg-muted">
              {items.length} of {def.minItems}–{def.maxItems ?? "∞"} items.
            </Text>
          )}
        </div>
      )}

      {isImageSlider && (
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <GenericImageUpload
                value={item.image ?? ""}
                onChange={(v) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, image: v } : it)))}
                uploadLabel="Upload slide"
              />
              <Button variant="transparent" size="small" type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="small"
            type="button"
            disabled={items.length >= (def.maxImages ?? 1)}
            onClick={() => setItems((prev) => [...prev, { image: "" }])}
          >
            Add slide
          </Button>
          <Text size="xsmall" className="text-ui-fg-muted">
            {items.length} of {def.maxImages} slides.
          </Text>
        </div>
      )}

      {!def.list && !isImageSlider && (
        <div className="flex flex-col gap-4">
          {def.fields.map((f) => (
            <SectionField
              key={f.key}
              field={f}
              value={single[f.key]}
              onChange={(v) => setSingle((prev) => ({ ...prev, [f.key]: v }))}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>
          Save {def.label.toLowerCase()}
        </Button>
      </div>
    </SectionBlock>
  )
}

const SectionsTab = ({ config, template }: { config: StoreConfig; template: Template | undefined }) => {
  if (!template) {
    return (
      <div className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Select a template before customizing sections.
        </Text>
      </div>
    )
  }

  const saved = config.sections ?? {}

  const handleSave = async (sectionId: string, value: any) => {
    const updated = await apiFetch<{ config: StoreConfig }>(
      "/admin/selfkart/store-config/customize",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: { [sectionId]: value } }),
      }
    )
    config.sections = updated.config.sections
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Text size="small" className="text-ui-fg-subtle">
        These are the sections {template.name} actually has on its homepage —
        only what's listed here can be customized for this template.
      </Text>
      {template.sections.map((def) => (
        <SectionEditor key={def.id} def={def} value={saved[def.id]} onSave={handleSave} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CustomizeView — tabbed advanced settings
// ---------------------------------------------------------------------------

const CustomizeView = ({
  initialConfig,
  templates,
  storefrontBase,
}: {
  initialConfig: StoreConfig
  templates: Template[]
  storefrontBase: string
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("branding")
  const [config] = useState<StoreConfig>(initialConfig)
  const selectedTemplate = templates.find((t) => t.id === config.template_id)

  const renderTab = () => {
    switch (activeTab) {
      case "branding":  return <BrandingTab config={config} />
      case "theme":     return <ThemeTab config={config} />
      case "homepage":  return <HomepageTab config={config} />
      case "sections":  return <SectionsTab config={config} template={selectedTemplate} />
      case "policies":  return <PoliciesTab config={config} />
      case "contact":   return <ContactTab config={config} />
      case "seo":       return <SEOTab config={config} />
      case "commerce":  return <CommerceTab config={config} />
      case "filters":   return <FiltersTab config={config} />
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <Heading level="h1">Store Design</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Customise your storefront. Each tab saves independently.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {selectedTemplate && (
            <Badge color="grey" size="2xsmall">
              {selectedTemplate.name} — locked
            </Badge>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={() => window.open(storefrontBase || "/", "_blank")}
          >
            Preview store
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-ui-border-base px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-ui-fg-base text-ui-fg-base"
                : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {renderTab()}
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Main page — loads config, routes to picker → quick setup → tabs
// ---------------------------------------------------------------------------

const SellerTemplatesPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<StoreConfig | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [storefrontUrl, setStorefrontUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await apiFetch<ConfigResponse>("/admin/selfkart/store-config")
        if (!cancelled) {
          setConfig(data.config)
          setTemplates(data.templates)
          setStorefrontUrl(data.storefront_url ?? null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load store configuration."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle" size="small">
          Loading…
        </Text>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error" size="small">
          {error}
        </Text>
      </Container>
    )
  }

  // Prefer the tenant's real storefront origin (e.g. https://cloth.myselfkart.com)
  // returned by the API; fall back to the dev default only when it's missing.
  const storefrontBase = storefrontUrl || STOREFRONT_BASE

  // State 1: no template yet → pick one. Glow is set aside for now — not
  // offered in the picker, but its template entry (with section schema)
  // still exists for when it's re-enabled.
  if (!config?.template_id || showPicker) {
    return (
      <TemplatePicker
        templates={templates.filter((t) => t.id !== "glow")}
        storefrontBase={storefrontBase}
        onConfirmed={(updated) => { setConfig(updated); setShowPicker(false) }}
      />
    )
  }

  // State 2: template picked but not set up yet → quick setup
  if (!config.store_name) {
    return (
      <QuickSetupView
        initialConfig={config}
        onDone={(updated) => setConfig(updated)}
        onBack={() => setShowPicker(true)}
        storefrontUrl={storefrontUrl}
      />
    )
  }

  // State 3: fully set up → tabbed advanced settings
  return (
    <CustomizeView
      initialConfig={config}
      templates={templates}
      storefrontBase={storefrontBase}
    />
  )
}

export const config = defineRouteConfig({
  label: "Store Design",
  icon: Swatch,
})

export default SellerTemplatesPage
