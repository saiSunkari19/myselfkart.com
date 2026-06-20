import type { TemplateId } from "./templates"
import type { TrustBadge, HeroCta, FilterConfig, StoreCustomizationFields } from "./repository"

// ---------------------------------------------------------------------------
// Per-template visual defaults
// ---------------------------------------------------------------------------

type TemplateDefaults = {
  primary_color: string
  accent_color: string
  font_heading: string
  font_body: string
  hero_heading: string
  hero_subtext: string
  hero_cta: HeroCta
  announcement_text: string
}

const TEMPLATE_DEFAULTS: Record<TemplateId, TemplateDefaults> = {
  aurum: {
    primary_color: "#B8860B",
    accent_color: "#8B6914",
    font_heading: "playfair",
    font_body: "inter",
    hero_heading: "Timeless Elegance",
    hero_subtext: "Handcrafted jewellery for every occasion",
    hero_cta: { primary_label: "Shop Now", primary_link: "/shop", secondary_label: "Our Collections", secondary_link: "/collections" },
    announcement_text: "Free delivery on orders above ₹999 · Hallmark certified jewellery",
  },
  thread: {
    primary_color: "#111111",
    accent_color: "#374151",
    font_heading: "poppins",
    font_body: "lato",
    hero_heading: "New Season, New Style",
    hero_subtext: "Discover the latest trends in fashion",
    hero_cta: { primary_label: "Shop Now", primary_link: "/shop", secondary_label: "New Arrivals", secondary_link: "/new" },
    announcement_text: "Free delivery on orders above ₹499 · Easy 7-day returns",
  },
  volt: {
    primary_color: "#2563EB",
    accent_color: "#1D4ED8",
    font_heading: "inter",
    font_body: "inter",
    hero_heading: "Premium Electronics",
    hero_subtext: "Genuine products, unbeatable prices",
    hero_cta: { primary_label: "Shop Deals", primary_link: "/deals", secondary_label: "All Products", secondary_link: "/shop" },
    announcement_text: "Free delivery on orders above ₹999 · 100% genuine products",
  },
  glow: {
    primary_color: "#283616",
    accent_color: "#96986d",
    font_heading: "playfair",
    font_body: "inter",
    hero_heading: "Unlock your skin's true glow.",
    hero_subtext: "Science-backed skincare rooted in nature. Every formula, a ritual.",
    hero_cta: { primary_label: "Shop Serums", primary_link: "/shop", secondary_label: "Find My Routine", secondary_link: "/routine" },
    announcement_text: "Free delivery on orders above ₹999 · Dermatologist tested · Cruelty-free",
  },
  eventpass: {
    primary_color: "#7C3AED",
    accent_color: "#6D28D9",
    font_heading: "poppins",
    font_body: "inter",
    hero_heading: "Discover Amazing Events",
    hero_subtext: "Book tickets for the best experiences near you",
    hero_cta: { primary_label: "Browse Events", primary_link: "/events", secondary_label: "Learn More", secondary_link: "/about" },
    announcement_text: "Secure online booking · Instant confirmation",
  },
}

// ---------------------------------------------------------------------------
// Shared defaults (same across all templates)
// ---------------------------------------------------------------------------

const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  { icon: "✅", title: "100% Genuine", description: "All products are verified and authentic" },
  { icon: "🚚", title: "Free Delivery", description: "On orders above ₹999" },
  { icon: "↩️", title: "Easy Returns", description: "Hassle-free 7-day return policy" },
  { icon: "🔒", title: "Secure Payment", description: "256-bit SSL encrypted checkout" },
]

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  enabled: ["category", "price", "availability"],
  order: ["category", "price", "availability"],
  labels: {},
}

// ---------------------------------------------------------------------------
// Policy templates  ([STORE_NAME] is replaced at write time)
// ---------------------------------------------------------------------------

function returnPolicy(storeName: string, year: number): string {
  return `Return & Exchange Policy — ${storeName}

At ${storeName}, we want you to love what you receive. If you're not completely satisfied, here's how we can help.

Returns
We accept returns within 7 days of delivery. Items must be unused, unwashed, in their original condition, and in original packaging with all tags intact.

Exchanges
Exchange requests can be raised within 7 days of delivery, subject to stock availability. Contact us and we'll arrange a pickup and re-delivery at no extra charge.

Refunds
Once we receive and inspect your return, approved refunds will be credited to your original payment method within 5–7 business days.

Non-Returnable Items
• Customised or personalised items
• Items marked as "Final Sale"
• Items without original packaging or missing tags

How to Raise a Return
Contact our support team with your order ID and reason for return. We'll guide you through the process.

© ${year} ${storeName}. All rights reserved.`
}

function shippingPolicy(storeName: string, year: number): string {
  return `Shipping Policy — ${storeName}

We deliver across India. Here's everything you need to know about how we ship.

Delivery Timeframes
• Metro cities (Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata): 2–4 business days
• Tier 2 & Tier 3 cities: 4–7 business days
• Remote areas: 7–10 business days

Shipping Charges
• Free delivery on all orders above ₹999
• A flat fee of ₹49 applies on orders below ₹999

Order Processing
Orders are processed and dispatched within 24–48 hours of placement (excluding Sundays and public holidays). You will receive a tracking link via SMS/WhatsApp once your order is shipped.

Delays
During peak seasons (festivals, sale events) or due to factors beyond our control (weather, courier disruptions), delivery may take additional time. We'll keep you informed via SMS/email.

© ${year} ${storeName}. All rights reserved.`
}

function privacyPolicy(storeName: string, year: number): string {
  return `Privacy Policy — ${storeName}

Last updated: ${year}

At ${storeName}, we respect your privacy and are committed to protecting your personal information. This policy explains what we collect and how we use it.

Information We Collect
• Personal details: name, email address, phone number, delivery address
• Payment information: processed securely by our payment partner (we never store card details)
• Usage data: pages visited, device type, browser — used to improve your experience

How We Use Your Information
• To process and fulfil your orders
• To send order confirmations, shipping updates, and delivery notifications
• To respond to your queries and provide customer support
• To send promotional offers (only with your consent — you can opt out anytime)

Sharing Your Information
We do not sell or trade your personal data. We share information only with:
• Delivery partners (to ship your order)
• Payment processors (to complete your transaction)
All third parties are bound by confidentiality agreements.

Cookies
We use cookies to remember your preferences and improve your browsing experience. You can disable cookies in your browser settings, though some features may not work correctly.

Your Rights
You have the right to access, correct, or delete the personal data we hold about you. To exercise these rights, contact us through our website.

Data Retention
We retain your data for as long as necessary to fulfil orders and comply with legal obligations.

© ${year} ${storeName}. All rights reserved.`
}

function termsPolicy(storeName: string, year: number): string {
  return `Terms & Conditions — ${storeName}

Last updated: ${year}

By accessing or purchasing from ${storeName}, you agree to these Terms and Conditions.

Acceptance
Use of our website constitutes acceptance of these terms. If you do not agree, please do not use our services.

Products & Pricing
All products are subject to availability. Prices are in Indian Rupees and include applicable taxes unless stated otherwise. We reserve the right to change prices without prior notice.

Orders & Payment
By placing an order, you confirm you are at least 18 years old and authorised to use the selected payment method. Order confirmation does not constitute acceptance — we accept your order upon dispatch.

Returns & Refunds
Please refer to our Return Policy for full details on eligibility, process, and refund timelines.

Intellectual Property
All content on this website — including logos, images, product descriptions, and design — is the property of ${storeName} and may not be reproduced without written permission.

Limitation of Liability
Our liability for any claim shall not exceed the value of the product purchased. We are not liable for indirect or consequential damages.

Governing Law
These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of Indian courts.

© ${year} ${storeName}. All rights reserved.`
}

// ---------------------------------------------------------------------------
// Main export — builds the full default config for a new seller
// ---------------------------------------------------------------------------

export function buildDefaultConfig(
  templateId: TemplateId,
  storeName: string
): Omit<StoreCustomizationFields, "logo_url" | "primary_color"> & { primary_color: string } {
  const td = TEMPLATE_DEFAULTS[templateId]
  const year = new Date().getFullYear()
  const name = storeName.trim()

  return {
    // Branding
    store_name: name,
    tagline: "Quality you can trust",
    favicon_url: null,

    // Theme
    primary_color: td.primary_color,
    accent_color: td.accent_color,
    secondary_color: null,
    color_mode: "light",
    font_heading: td.font_heading,
    font_body: td.font_body,

    // Homepage
    announcement_enabled: true,
    announcement_text: td.announcement_text,
    hero_image_url: null,
    hero_heading: td.hero_heading,
    hero_subtext: td.hero_subtext,
    hero_cta: td.hero_cta,
    trust_badges: DEFAULT_TRUST_BADGES,

    // Policies — pre-written, store name inserted
    return_policy: returnPolicy(name, year),
    shipping_policy: shippingPolicy(name, year),
    privacy_policy: privacyPolicy(name, year),
    terms_policy: termsPolicy(name, year),

    // Contact — blank until seller fills in
    about_text: `${name} — bringing you quality products you'll love.`,
    contact_email: null,
    contact_phone: null,
    whatsapp_number: null,
    instagram_url: null,
    youtube_url: null,
    gst_number: null,
    business_address: null,

    // SEO — auto-generated from store name
    seo_title: `${name} — Quality you can trust`,
    seo_description: `Shop at ${name}. Free delivery on orders above ₹999. Easy 7-day returns. 100% genuine products.`,
    seo_og_image_url: null,

    // Commerce
    free_shipping_threshold: 999,
    cod_enabled: false,
    whatsapp_notifications_enabled: false,
    custom_domain: null,
    is_published: false,

    // Filters
    filter_config: DEFAULT_FILTER_CONFIG,
  }
}
