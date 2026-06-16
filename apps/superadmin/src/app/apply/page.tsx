import { ApplyForm } from "@/components/apply-form"

// Public, server-rendered. Reads the base domain server-side for the live URL
// preview in the subdomain field.
export const dynamic = "force-dynamic"

export default function ApplyPage() {
  const baseDomain = process.env.SELFKART_STOREFRONT_BASE_DOMAIN || "selfkart.com"

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-28">
      {/* The form is the page's single job — the heading sets it up, then gets
          out of the way. */}
      <div className="mb-12">
        <p className="text-sm text-ink-subtle">Selfkart</p>
        <h1 className="text-display mt-3">Open your store</h1>
        <p className="mt-4 max-w-md text-ink-muted">
          Tell us about your store. Once approved, you&rsquo;ll get a login to add
          products and go live on your own domain.
        </p>
      </div>

      <ApplyForm baseDomain={baseDomain} />
    </main>
  )
}
