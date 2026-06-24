/**
 * One branded, theme-tokened email layout, skinned per store. Table-based +
 * inline styles (the only thing email clients render reliably), with a plain-text
 * alternative. Used by buyer mail (order/shipping) and platform mail. All
 * caller-supplied strings are HTML-escaped to prevent injection. See F-4 in
 * docs/email-shipping-backlog.md.
 */

export type EmailButton = { label: string; url: string }
export type EmailRow = { label: string; value: string }
export type EmailItem = { name: string; quantity: number; price?: string | null }

export type StoreEmailTemplateInput = {
  storeName: string
  logoUrl?: string | null
  /** Brand accent (buttons, headings). Falls back to a neutral dark. */
  primaryColor?: string | null
  /** Hidden inbox-preview line. */
  preheader?: string
  heading: string
  intro?: string
  /** Key/value summary block (e.g. Order #, Total). */
  rows?: EmailRow[]
  itemsTitle?: string
  items?: EmailItem[]
  button?: EmailButton
  /** Already-escaped/safe extra HTML appended after the body. */
  outroHtml?: string
  supportEmail?: string | null
  footerNote?: string
}

export type RenderedEmail = { html: string; text: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const DEFAULT_COLOR = "#111827"

function isValidColor(c: string | null | undefined): c is string {
  return typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c.trim())
}

export function renderStoreEmail(input: StoreEmailTemplateInput): RenderedEmail {
  const color = isValidColor(input.primaryColor) ? input.primaryColor!.trim() : DEFAULT_COLOR
  const store = escapeHtml(input.storeName || "Store")

  const headerHtml = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="${store}" height="40" style="height:40px;max-height:40px;display:block;border:0;" />`
    : `<span style="font-size:20px;font-weight:700;color:${color};">${store}</span>`

  const rowsHtml = (input.rows ?? [])
    .map(
      (r) =>
        `<tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">${escapeHtml(
          r.label
        )}</td><td style="padding:4px 0;text-align:right;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(
          r.value
        )}</td></tr>`
    )
    .join("")

  const itemsHtml = (input.items ?? [])
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;border-top:1px solid #f0f0f0;color:#111827;font-size:14px;">${escapeHtml(
          it.name
        )} <span style="color:#9ca3af;">× ${it.quantity}</span></td><td style="padding:8px 0;border-top:1px solid #f0f0f0;text-align:right;color:#111827;font-size:14px;">${
          it.price ? escapeHtml(it.price) : ""
        }</td></tr>`
    )
    .join("")

  const buttonHtml = input.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background:${color};"><a href="${escapeHtml(
        input.button.url
      )}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${escapeHtml(
        input.button.label
      )}</a></td></tr></table>`
    : ""

  const supportHtml = input.supportEmail
    ? `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Questions about your order? Contact <a href="mailto:${escapeHtml(
        input.supportEmail
      )}" style="color:${color};">${escapeHtml(input.supportEmail)}</a></p>`
    : ""

  const preheaderHtml = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>`
    : ""

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">${headerHtml}</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
          input.heading
        )}</h1>
        ${input.intro ? `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(input.intro)}</p>` : ""}
        ${itemsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">${input.itemsTitle ? `<tr><td colspan="2" style="padding:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(input.itemsTitle)}</td></tr>` : ""}${itemsHtml}</table>` : ""}
        ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #f0f0f0;padding-top:8px;">${rowsHtml}</table>` : ""}
        ${buttonHtml}
        ${input.outroHtml ?? ""}
        ${supportHtml}
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
        <p style="margin:0;color:#9ca3af;font-size:12px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
          input.footerNote ?? `Sent by ${input.storeName}.`
        )}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  // Plain-text alternative
  const textParts: string[] = [input.heading]
  if (input.intro) textParts.push("", input.intro)
  if (input.items?.length) {
    textParts.push("", input.itemsTitle ?? "Items:")
    for (const it of input.items) {
      textParts.push(`- ${it.name} x ${it.quantity}${it.price ? `  ${it.price}` : ""}`)
    }
  }
  if (input.rows?.length) {
    textParts.push("")
    for (const r of input.rows) textParts.push(`${r.label}: ${r.value}`)
  }
  if (input.button) textParts.push("", `${input.button.label}: ${input.button.url}`)
  if (input.supportEmail) textParts.push("", `Questions? Contact ${input.supportEmail}`)
  textParts.push("", input.footerNote ?? `Sent by ${input.storeName}.`)

  return { html, text: textParts.join("\n") }
}
