import { PRODUCTS, type Product } from "../_data"
import { resolveTenant } from "../../../../lib/tenant/resolve-tenant"
import { listTenantProducts } from "../../../../lib/medusa/products"
import type { StoreProduct } from "../../../../lib/medusa/products"
import { fetchStoreConfig } from "../../../../lib/store-config"
import { ShopClient } from "./_shop-client"

export const dynamic = "force-dynamic"

function toGlowProduct(p: StoreProduct, index: number): Product {
  const price = p.variants?.find(v => v.calculated_price?.calculated_amount != null)
    ?.calculated_price?.calculated_amount ?? 0
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
    "https://images.unsplash.com/photo-1570194065650-d99fb4abbd90?w=600&q=80",
    "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600&q=80",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",
    "https://images.unsplash.com/photo-1631390783071-1c11b9edadf5?w=600&q=80",
  ]
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: p.id,
    name: p.title,
    subtitle: p.description?.slice(0, 60) ?? "",
    category: "Skincare",
    price,
    image: img,
    hoverImage: img,
    rating: 4.5,
    reviews: 128,
    skinTypes: [],
    concerns: [],
    description: p.description ?? "",
    keyIngredients: [],
    size: "",
  }
}

export default async function ShopPage() {
  const tenant = await resolveTenant()
  const [rawProducts, config] = await Promise.all([
    tenant ? listTenantProducts(tenant) : Promise.resolve([]),
    tenant ? fetchStoreConfig(tenant) : Promise.resolve(null),
  ])
  const products: Product[] = rawProducts.length > 0
    ? rawProducts.map(toGlowProduct)
    : PRODUCTS

  return <ShopClient products={products} config={config} />
}
