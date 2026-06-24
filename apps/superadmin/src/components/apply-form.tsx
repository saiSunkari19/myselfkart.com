"use client"

import { Check, Instagram, ShoppingBag, Store, MoreHorizontal } from "lucide-react"
import { useActionState, useState } from "react"

import { submitApplicationAction, type ApplyState } from "@/actions/apply"

const applyInitial: ApplyState = { ok: false, message: null, errors: {} }

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string
  name: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-2" htmlFor={name}>
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-ink" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

const inputClass =
  "rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-line-strong"

// Supported markets. Picking a market implies its currency and the region the
// store sells into — the seller never picks a bare country/currency. The full
// country set (e.g. the Core EU set for Europe) is derived server-side from the
// currency at provisioning time; `country` here is just the primary country.
const MARKETS = [
  { key: "india", label: "India", currency: "inr", country: "in" },
  { key: "us", label: "United States", currency: "usd", country: "us" },
  { key: "uae", label: "United Arab Emirates", currency: "aed", country: "ae" },
  { key: "europe", label: "Europe", currency: "eur", country: "de" },
] as const

const DEFAULT_MARKET = "india"

// Where the seller currently sells. Tells the operator where a lead originates;
// stored as a stable key on the application (see backend `selling_on`). The icon
// is decorative — the label carries the meaning.
const SELLING_ON = [
  { key: "instagram_whatsapp", label: "Instagram / WhatsApp", icon: Instagram },
  { key: "flipkart_amazon", label: "Flipkart / Amazon", icon: ShoppingBag },
  { key: "offline_retail", label: "Offline retail", icon: Store },
  { key: "other", label: "Somewhere else", icon: MoreHorizontal },
] as const

export function ApplyForm({ baseDomain }: { baseDomain: string }) {
  const [state, action, pending] = useActionState(submitApplicationAction, applyInitial)
  const [subdomain, setSubdomain] = useState("")
  const [sellingOn, setSellingOn] = useState<string>("")
  const [marketKey, setMarketKey] = useState<string>(DEFAULT_MARKET)
  const market = MARKETS.find((m) => m.key === marketKey) ?? MARKETS[0]

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-8 text-center">
        <p className="mx-auto flex w-fit items-center gap-2 text-emerald-ink">
          <Check className="size-5" /> Application received
        </p>
        <p className="mt-4 text-ink-muted">
          Thanks — our team will review your store and email you next steps.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm text-ink-muted">Where do you sell today?</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SELLING_ON.map((option) => {
            const selected = sellingOn === option.key
            const Icon = option.icon
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSellingOn(option.key)}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-line-strong bg-surface-2 text-ink"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
        {state.errors.selling_on ? (
          <span className="text-xs text-red-ink" role="alert">
            {state.errors.selling_on}
          </span>
        ) : null}
        <input type="hidden" name="selling_on" value={sellingOn} />
      </fieldset>

      <Field label="Store name" name="store_name" error={state.errors.store_name}>
        <input id="store_name" name="store_name" required className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Your name" name="owner_name" error={state.errors.owner_name}>
          <input id="owner_name" name="owner_name" required className={inputClass} />
        </Field>
        <Field label="Email" name="owner_email" error={state.errors.owner_email}>
          <input
            id="owner_email"
            name="owner_email"
            type="email"
            required
            placeholder="you@yourbusiness.com"
            className={inputClass}
          />
          <span className="text-xs text-ink-subtle">
            <span className="text-ink-muted">Use a valid inbox you check.</span> This
            becomes your store&apos;s contact address — your customers&apos; order &amp;
            shipping emails reply here, and we send your login and store notices to it.
          </span>
        </Field>
      </div>

      <Field label="Phone" name="phone" error={state.errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="+91 98765 43210"
          className={inputClass}
        />
        <span className="text-xs text-ink-subtle">
          So our team can reach you about your application.
        </span>
      </Field>

      <Field
        label="Store address"
        name="desired_subdomain"
        error={state.errors.desired_subdomain}
      >
        <div className="flex items-center rounded-[var(--radius-md)] border border-line bg-surface focus-within:border-line-strong">
          <input
            id="desired_subdomain"
            name="desired_subdomain"
            required
            placeholder="your-store"
            value={subdomain}
            onChange={(e) =>
              setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className="flex-1 bg-transparent px-4 py-3 text-ink outline-none"
          />
          <span className="select-none px-4 py-3 text-ink-subtle">.{baseDomain}</span>
        </div>
      </Field>

      <Field
        label="Market"
        name="market"
        error={state.errors.country || state.errors.currency}
      >
        <select
          id="market"
          name="market"
          value={marketKey}
          onChange={(e) => setMarketKey(e.target.value)}
          className={inputClass}
        >
          {MARKETS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} ({m.currency.toUpperCase()})
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-subtle">
          Sets your store currency and the countries you sell to.
        </span>
        {/* Currency + primary country are implied by the market, submitted as
            hidden fields the public application endpoint expects. */}
        <input type="hidden" name="currency" value={market.currency} />
        <input type="hidden" name="country" value={market.country} />
      </Field>

      <Field label="Anything we should know? (optional)" name="notes">
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
      </Field>

      {state.message ? (
        <p role="alert" className="text-sm text-red-ink">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !sellingOn}
        title={!sellingOn ? "Pick where you sell today first" : undefined}
        className="mt-2 cursor-pointer self-start rounded-[var(--radius-md)] bg-ink px-8 py-3 font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Submitting…" : "Apply to sell"}
      </button>
    </form>
  )
}
