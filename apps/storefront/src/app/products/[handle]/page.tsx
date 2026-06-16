import Link from "next/link"
import { notFound } from "next/navigation"

import { AddToCart } from "../../../components/add-to-cart"
import { getTenantProductByHandle } from "../../../lib/medusa/products"
import { resolveTenant } from "../../../lib/tenant/resolve-tenant"

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const tenant = await resolveTenant()

  // Only an active tenant renders products; everything else is "not found" so a
  // foreign tenant's handle can never resolve into this store.
  if (!tenant || tenant.status !== "active") {
    notFound()
  }

  const product = await getTenantProductByHandle(tenant, handle)
  if (!product) {
    notFound()
  }

  return (
    <main>
      <p>
        <Link href="/">← Back to shop</Link>
      </p>
      {product.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.thumbnail}
          alt={product.title}
          style={{ maxWidth: "320px", borderRadius: "10px" }}
        />
      ) : null}
      <h1>{product.title}</h1>
      {product.description ? <p>{product.description}</p> : null}
      <AddToCart variants={product.variants ?? []} />
    </main>
  )
}
