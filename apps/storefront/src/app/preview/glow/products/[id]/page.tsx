import { notFound } from "next/navigation"
import { PRODUCTS } from "../../_data"
import { ProductDetailClient } from "./_product-client"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = PRODUCTS.find(p => p.id === id)
  if (!product) return notFound()

  const related = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)

  return <ProductDetailClient product={product} related={related} config={null} />
}
