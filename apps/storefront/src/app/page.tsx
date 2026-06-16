import Link from "next/link"

import { formatMoney } from "../lib/format"
import { listTenantProducts } from "../lib/medusa/products"
import { resolveTenant } from "../lib/tenant/resolve-tenant"

// The tenant is derived from the request Host, so this page is per-tenant and
// must never be statically cached or shared across tenants.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const tenant = await resolveTenant()

  if (!tenant) {
    return (
      <main>
        <p className="state">This store could not be found.</p>
      </main>
    )
  }

  if (tenant.status === "draft") {
    return (
      <main>
        <p className="state">This store is coming soon.</p>
      </main>
    )
  }

  if (tenant.status === "suspended") {
    return (
      <main>
        <p className="state">This store is currently unavailable.</p>
      </main>
    )
  }

  const products = await listTenantProducts(tenant)

  return (
    <main>
      <h1>Shop</h1>
      {products.length === 0 ? (
        <p className="state">No products are available yet.</p>
      ) : (
        <ul className="product-grid">
          {products.map((product) => {
            const price = product.variants?.find(
              (v) => v.calculated_price?.calculated_amount != null
            )?.calculated_price
            return (
              <li key={product.id} className="product-card">
                <Link href={product.handle ? `/products/${product.handle}` : "#"}>
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail} alt={product.title} />
                  ) : null}
                  <strong>{product.title}</strong>
                  {price ? (
                    <span className="price">
                      {formatMoney(price.calculated_amount, price.currency_code)}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
