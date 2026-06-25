export type TemplateId = "eventpass" | "thread" | "aurum" | "volt" | "glow"

/**
 * Field shapes for each section "type". A section's `type` determines which
 * shape its items must have — this is the contract the Customize UI and the
 * backend validator both read from.
 */
export type SectionFieldType = "text" | "richtext" | "image" | "icon" | "number"

export type SectionFieldDef = {
  key: string
  label: string
  type: SectionFieldType
  required?: boolean
  /** For type "number" — input step, e.g. 0.5 to allow half-star ratings. */
  step?: number
}

/**
 * One customizable homepage section for a template. `list: true` means the
 * seller edits a repeatable array of items (e.g. testimonials); `list: false`
 * means a single item (e.g. an editorial banner, or hero copy).
 *
 * `maxImages` only applies to the "hero" section type and distinguishes a
 * single hero image (most templates) from a multi-slide hero (Glow).
 */
export type SectionDef = {
  id: string
  type: "hero" | "testimonial-list" | "feature-list" | "editorial-banner" | "newsletter"
  label: string
  list: boolean
  minItems?: number
  maxItems?: number
  maxImages?: number
  fields: SectionFieldDef[]
}

export type Template = {
  id: TemplateId
  name: string
  description: string
  good_for: string
  preview_path: string
  thumbnail_url: string
  is_default: boolean
  /** Homepage sections this template actually renders, in display order. */
  sections: SectionDef[]
}

/**
 * Hardcoded template registry. preview_path is relative — the admin UI
 * prepends the storefront base URL (localhost in dev, live domain in prod).
 * To go live: update VITE_STOREFRONT_URL env var only, paths stay the same.
 */
export const TEMPLATES: Template[] = [
  {
    id: "eventpass",
    name: "EventPass",
    description: "Premium event discovery and ticket booking experience.",
    good_for: "Ticketing platforms, events, experiences",
    preview_path: "/preview/eventpass",
    thumbnail_url: "/templates/eventpass.png",
    is_default: true,
    sections: [
      // Hero is customized via the dedicated Branding tab (hero_image_url /
      // hero_heading / hero_subtext / hero_cta), not here — see InvalidSectionError
      // history: a "hero" entry here was a dead duplicate since _live.tsx never
      // reads config.sections.hero.
      {
        id: "how_it_works",
        type: "feature-list",
        label: "How It Works",
        list: true,
        minItems: 3,
        maxItems: 5,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "step", label: "Step number", type: "text" },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "desc", label: "Description", type: "text" },
        ],
      },
      {
        id: "about_stats",
        type: "feature-list",
        label: "About Page — Stats",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "value", label: "Stat value (e.g. 500+)", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "sub", label: "Subtext", type: "text" },
        ],
      },
    ],
  },
  {
    id: "thread",
    name: "Thread",
    description: "Modern fashion storefront for men, women, and kids.",
    good_for: "Clothing, apparel, accessories",
    preview_path: "/preview/thread",
    thumbnail_url: "/templates/thread.png",
    is_default: false,
    sections: [
      // Hero is customized via the dedicated Branding tab, not here — see note above.
      {
        id: "editorial_banner",
        type: "editorial-banner",
        label: "Editorial Banner",
        list: false,
        maxImages: 1,
        fields: [
          { key: "image", label: "Banner image", type: "image", required: true },
          { key: "label", label: "Label", type: "text" },
          { key: "title", label: "Title", type: "richtext" },
          { key: "body", label: "Body text", type: "text" },
          { key: "cta_label", label: "Button label", type: "text" },
        ],
      },
      {
        id: "testimonials",
        type: "testimonial-list",
        label: "Testimonials",
        list: true,
        minItems: 1,
        maxItems: 6,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "city", label: "City", type: "text" },
          { key: "stars", label: "Stars (1-5)", type: "number", step: 0.5 },
          { key: "text", label: "Quote", type: "text", required: true },
        ],
      },
      // Newsletter intentionally removed — Thread's homepage no longer has one.
      {
        id: "about_values",
        type: "feature-list",
        label: "About Page — Values",
        list: true,
        minItems: 3,
        maxItems: 6,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "text", label: "Description", type: "text" },
        ],
      },
      {
        id: "about_stats",
        type: "feature-list",
        label: "About Page — Stats",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "value", label: "Stat value (e.g. 15,000+)", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "sub", label: "Subtext", type: "text" },
        ],
      },
    ],
  },
  {
    id: "aurum",
    name: "Aurum",
    description: "Elegant, image-led store with a luxury feel.",
    good_for: "Jewellery, high-end goods, premium accessories",
    preview_path: "/preview/aurum",
    thumbnail_url: "/templates/aurum.png",
    is_default: false,
    sections: [
      // Hero is customized via the dedicated Branding tab, not here — see note above.
      {
        id: "trust_strip",
        type: "feature-list",
        label: "Trust Strip",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "sub", label: "Subtext", type: "text" },
        ],
      },
      {
        id: "craftsmanship",
        type: "editorial-banner",
        label: "Craftsmanship",
        list: false,
        maxImages: 1,
        fields: [
          { key: "image", label: "Image", type: "image", required: true },
          { key: "label", label: "Label", type: "text" },
          { key: "title", label: "Title", type: "richtext" },
          { key: "body", label: "Body text", type: "text" },
          { key: "cta_label", label: "Button label", type: "text" },
        ],
      },
      {
        id: "certification",
        type: "feature-list",
        label: "Certification",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "desc", label: "Description", type: "text" },
        ],
      },
      {
        id: "testimonials",
        type: "testimonial-list",
        label: "Testimonials",
        list: true,
        minItems: 1,
        maxItems: 6,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "city", label: "City", type: "text" },
          { key: "stars", label: "Stars (1-5)", type: "number", step: 0.5 },
          { key: "piece", label: "Product / piece name", type: "text" },
          { key: "text", label: "Quote", type: "text", required: true },
        ],
      },
      {
        id: "newsletter",
        type: "newsletter",
        label: "Newsletter",
        list: false,
        fields: [
          { key: "label", label: "Label", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "sub", label: "Subtext", type: "text" },
          { key: "button_label", label: "Button label", type: "text" },
        ],
      },
      {
        id: "about_values",
        type: "feature-list",
        label: "About Page — Values",
        list: true,
        minItems: 3,
        maxItems: 6,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "text", label: "Description", type: "text" },
        ],
      },
      {
        id: "about_stats",
        type: "feature-list",
        label: "About Page — Stats",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "value", label: "Stat value (e.g. 37)", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
          { key: "sub", label: "Subtext", type: "text" },
        ],
      },
    ],
  },
  {
    id: "volt",
    name: "Volt",
    description: "Structured, high-density grid built for large catalogs.",
    good_for: "Electronics, plastic goods, general retail",
    preview_path: "/preview/volt",
    thumbnail_url: "/templates/volt.png",
    is_default: false,
    sections: [
      // Hero is customized via the dedicated Branding tab, not here — see note above.
      {
        id: "why_buy",
        type: "feature-list",
        label: "Why Buy",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "icon", label: "Icon (emoji)", type: "icon" },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "text", label: "Description", type: "text" },
        ],
      },
      {
        id: "testimonials",
        type: "testimonial-list",
        label: "What Customers Say",
        list: true,
        minItems: 1,
        maxItems: 6,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "rating", label: "Rating (1-5)", type: "number", step: 0.5 },
          { key: "text", label: "Quote", type: "text", required: true },
          { key: "product", label: "Product purchased", type: "text" },
          { key: "avatar", label: "Avatar image", type: "image" },
        ],
      },
      {
        id: "newsletter",
        type: "newsletter",
        label: "Newsletter",
        list: false,
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "sub", label: "Subtext", type: "text" },
          { key: "button_label", label: "Button label", type: "text" },
        ],
      },
      {
        id: "about_stats",
        type: "feature-list",
        label: "About Page — Stats",
        list: true,
        minItems: 4,
        maxItems: 4,
        fields: [
          { key: "value", label: "Stat value (e.g. 50L+)", type: "text", required: true },
          { key: "label", label: "Label", type: "text", required: true },
        ],
      },
    ],
  },
  {
    id: "glow",
    name: "Glow",
    description: "Premium skincare & beauty storefront with a luxury editorial feel.",
    good_for: "Skincare, beauty, wellness, cosmetics",
    preview_path: "/preview/glow",
    thumbnail_url: "/templates/glow.png",
    is_default: false,
    // Set aside for now — not offered in the picker yet (see SELECTABLE_TEMPLATE_IDS).
    sections: [
      // Hero is customized via the dedicated Branding tab, not here — see note above.
      // (Glow's _live.tsx only reads config.hero_image_url today, a single image —
      // the slider concept isn't wired up yet either, so there's nothing to keep here.)
      {
        id: "testimonials",
        type: "testimonial-list",
        label: "Real People, Real Results",
        list: true,
        minItems: 1,
        maxItems: 6,
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "text", label: "Quote", type: "text", required: true },
          { key: "stars", label: "Stars (1-5)", type: "number", step: 0.5 },
          { key: "avatar", label: "Avatar image", type: "image" },
        ],
      },
    ],
  },
]

/** Templates currently offered in the picker — Glow is excluded for now. */
export const SELECTABLE_TEMPLATE_IDS = new Set<TemplateId>(
  TEMPLATES.filter((t) => t.id !== "glow").map((t) => t.id)
)

export const TEMPLATE_IDS = new Set<string>(TEMPLATES.map((t) => t.id))

export function getTemplate(templateId: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Validates a `sections` patch (as sent by the Customize UI) against the
 * given template's schema. Returns the subset of `sections` that is valid —
 * unknown section ids are dropped, lists are trimmed/rejected against
 * min/maxItems, and hero image counts are capped at maxImages.
 *
 * Throws if a known section is given content that can't be made valid
 * (e.g. zero items for a list with minItems > 0), so the API can 400 instead
 * of silently saving something the storefront can't render.
 */
export class InvalidSectionError extends Error {}

export function validateSections(
  templateId: string,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const template = getTemplate(templateId)
  if (!template) {
    throw new InvalidSectionError(`Unknown template: ${templateId}`)
  }

  const out: Record<string, unknown> = {}

  for (const [sectionId, value] of Object.entries(patch)) {
    const def = template.sections.find((s) => s.id === sectionId)
    if (!def) {
      // Section doesn't exist on this template (e.g. "testimonials" sent for
      // Eventpass) — silently drop rather than error, so partial saves from
      // a generic form don't fail the whole request.
      continue
    }

    if (value === null) {
      out[sectionId] = null
      continue
    }

    if (def.list) {
      // The Customize UI always sends list sections as { items: [...] }, not a
      // bare array — match that shape here, or every list save throws.
      const items = (value as { items?: unknown[] })?.items
      if (!Array.isArray(items)) {
        throw new InvalidSectionError(`Section "${sectionId}" must be a list of items.`)
      }
      if (def.minItems !== undefined && items.length < def.minItems) {
        throw new InvalidSectionError(
          `Section "${sectionId}" needs at least ${def.minItems} item(s).`
        )
      }
      if (def.maxItems !== undefined && items.length > def.maxItems) {
        throw new InvalidSectionError(
          `Section "${sectionId}" allows at most ${def.maxItems} item(s).`
        )
      }
      out[sectionId] = value
    } else if (def.type === "hero" && def.maxImages !== undefined) {
      const v = value as { images?: unknown[] }
      const images = Array.isArray(v?.images) ? v.images : []
      if (images.length > def.maxImages) {
        throw new InvalidSectionError(
          `"${def.label}" supports at most ${def.maxImages} image(s) on this template.`
        )
      }
      out[sectionId] = value
    } else {
      out[sectionId] = value
    }
  }

  return out
}
