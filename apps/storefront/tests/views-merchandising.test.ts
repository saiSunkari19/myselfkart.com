const assert = require("node:assert/strict")
const test = require("node:test")

// merchandising.ts is the graceful-degradation engine behind every theme's
// view models (deals/new-arrivals/categories). It is self-contained (only a
// type-only import), so it runs under Node's native TS stripping.
const {
  getDeals,
  getNewArrivals,
  getCategories,
  getProductCategories,
  productsInCategoryOrTag,
  isOnSale,
  discountPercent,
  lowestPrice,
} = require("../src/lib/merchandising.ts")

// Synthetic products shaped like the real cloth catalogue: tagged Men/Women/Kids,
// INR-priced, one genuinely on sale, distinct created_at for ordering.
function variant(amount, original) {
  return {
    id: "v_" + amount,
    title: "M",
    calculated_price: {
      calculated_amount: amount,
      original_amount: original ?? amount,
      currency_code: "inr",
    },
  }
}

const products = [
  { id: "p1", handle: "men-classic-crew-t-shirt", title: "Men Classic Crew T-Shirt", created_at: "2026-06-21T09:18:03.140Z", tags: [{ id: "t_men", value: "Men" }], variants: [variant(18)] },
  { id: "p2", handle: "women-floral-midi-dress", title: "Women Floral Midi Dress", created_at: "2026-06-21T09:18:03.148Z", tags: [{ id: "t_women", value: "Women" }], variants: [variant(64)] },
  { id: "p3", handle: "kids-dino-adventure-tee", title: "Kids Dino Adventure Tee", created_at: "2026-06-21T09:18:03.130Z", tags: [{ id: "t_kids", value: "Kids" }], variants: [variant(12, 20)] }, // on sale: 20 -> 12 = 40% off
  { id: "p4", handle: "men-zip-fleece-hoodie", title: "Men Zip Fleece Hoodie", created_at: "2026-06-21T09:18:03.145Z", tags: [{ id: "t_men", value: "Men" }], variants: [variant(46)] },
]

test("isOnSale + discountPercent detect only genuine sales", () => {
  assert.equal(isOnSale(products[0]), false)
  assert.equal(discountPercent(products[0]), 0)
  const onSale = products.find(p => p.id === "p3")
  assert.equal(isOnSale(onSale), true)
  assert.equal(discountPercent(onSale), 40)
})

test("lowestPrice reads the calculated amount", () => {
  assert.equal(lowestPrice(products[0]), 18)
  assert.equal(lowestPrice(products[2]), 12)
})

test("getDeals returns only discounted products (graceful: hide when none)", () => {
  const deals = getDeals(products)
  assert.equal(deals.length, 1)
  assert.equal(deals[0].handle, "kids-dino-adventure-tee")
  assert.equal(getDeals([products[0], products[1]]).length, 0) // no fabricated deals
})

test("getNewArrivals sorts newest-first by created_at", () => {
  const order = getNewArrivals(products).map(p => p.id)
  assert.deepEqual(order, ["p2", "p4", "p1", "p3"])
})

test("getCategories groups tags with counts, most-populated first", () => {
  const cats = getCategories(products)
  assert.equal(cats[0].id, "t_men")
  assert.equal(cats.find(c => c.id === "t_men").count, 2)
  assert.equal(cats.find(c => c.id === "t_women").count, 1)
  assert.equal(cats.find(c => c.id === "t_kids").count, 1)
})

test("empty / untagged inputs degrade gracefully (no throw, empty results)", () => {
  assert.deepEqual(getCategories([]), [])
  assert.deepEqual(getDeals([]), [])
  const untagged = [{ id: "x", handle: "x", title: "X", created_at: null, tags: [], categories: [], variants: [] }]
  assert.deepEqual(getCategories(untagged), [])
  assert.deepEqual(getProductCategories(untagged), [])
  assert.equal(lowestPrice(untagged[0]), null)
})

// Real Medusa categories assigned to products (Phase 3).
const withCategories = [
  { id: "a", handle: "a", title: "A", created_at: null, tags: [{ id: "t_men", value: "Men" }], categories: [{ id: "pcat_shirts", name: "Shirts", handle: "shirts" }], variants: [variant(20)] },
  { id: "b", handle: "b", title: "B", created_at: null, tags: [{ id: "t_men", value: "Men" }], categories: [{ id: "pcat_shirts", name: "Shirts", handle: "shirts" }], variants: [variant(25)] },
  { id: "c", handle: "c", title: "C", created_at: null, tags: [{ id: "t_women", value: "Women" }], categories: [{ id: "pcat_dresses", name: "Dresses", handle: "dresses" }], variants: [variant(40)] },
]

test("getProductCategories derives real categories with counts, most-populated first", () => {
  const cats = getProductCategories(withCategories)
  assert.equal(cats.length, 2)
  assert.equal(cats[0].id, "pcat_shirts")
  assert.equal(cats[0].name, "Shirts")
  assert.equal(cats[0].count, 2)
  assert.equal(cats.find(c => c.id === "pcat_dresses").count, 1)
})

test("productsInCategoryOrTag matches a real category id OR a tag id", () => {
  // real category id
  assert.deepEqual(productsInCategoryOrTag(withCategories, "pcat_shirts").map(p => p.id), ["a", "b"])
  // tag id (fallback path when products carry no categories)
  assert.deepEqual(productsInCategoryOrTag(products, "t_men").map(p => p.id), ["p1", "p4"])
  // unknown id → empty
  assert.deepEqual(productsInCategoryOrTag(withCategories, "nope"), [])
})
