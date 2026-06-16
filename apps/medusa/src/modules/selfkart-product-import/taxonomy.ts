import { createHash } from "node:crypto"

import type { Knex } from "knex"

import type { CsvRow } from "./csv"

export type CollectionSeed = {
  id: string
  title: string
  handle: string
}

export type TypeSeed = {
  id: string
  value: string
}

export type TagSeed = {
  id: string
  value: string
}

export type CategorySeed = {
  id: string
  name: string
  handle: string
  parentId: string | null
}

export type AssociationSeed = {
  productHandle: string
  collectionId: string
  typeId: string
  tagIds: string[]
  categoryId: string
}

export type SellerImportSeeds = {
  collections: CollectionSeed[]
  types: TypeSeed[]
  tags: TagSeed[]
  categories: CategorySeed[]
  associations: AssociationSeed[]
}

export function scopedImportId(tenantId: string, id: string): string {
  const hash = createHash("sha1").update(`${tenantId}:${id}`).digest("hex").slice(0, 10)
  return `${id}_${hash}`
}

function titleFromId(id: string): string {
  return id
    .replace(/^(pcol|ptyp|pcat)_selfkart_cloth_/, "")
    .replace(/^cloth-/, "")
    .replace(/^material-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function metadata(kind: string, tenantId: string): Record<string, unknown> {
  return {
    selfkart_seeded: true,
    kind,
    tenant_id: tenantId,
  }
}

function upsertMap<T extends { id: string }>(map: Map<string, T>, value: T) {
  if (value.id) {
    map.set(value.id, value)
  }
}

export function extractSellerImportSeeds(
  rows: CsvRow[],
  tenantId: string
): SellerImportSeeds {
  const collections = new Map<string, CollectionSeed>()
  const types = new Map<string, TypeSeed>()
  const tags = new Map<string, TagSeed>()
  const categories = new Map<string, CategorySeed>()
  const associations = new Map<string, AssociationSeed>()

  for (const row of rows) {
    const collectionId = row["Product Collection Id"] ?? ""
    const typeId = row["Product Type Id"] ?? ""
    const tagValues = Object.entries(row)
      .filter(([header, value]) => /^Product Tag \d+$/.test(header) && value)
      .map(([, value]) => value)
    const parentCategoryId = row["Parent Category Id"] ?? ""
    const categoryId = row["Category Id"] ?? ""
    const productHandle = row["Product Handle"] ?? ""
    const scopedCollectionId = collectionId ? scopedImportId(tenantId, collectionId) : ""
    const scopedTypeId = typeId ? scopedImportId(tenantId, typeId) : ""
    const scopedTagIds = tagValues.map((tag) => scopedImportId(tenantId, tag))
    const scopedParentCategoryId = parentCategoryId
      ? scopedImportId(tenantId, parentCategoryId)
      : ""
    const scopedCategoryId = categoryId ? scopedImportId(tenantId, categoryId) : ""

    upsertMap(collections, {
      id: scopedCollectionId,
      title: row["Product Collection Title"] || titleFromId(collectionId),
      handle: collectionId.replace(/^pcol_selfkart_/, "").replace(/_/g, "-"),
    })

    upsertMap(types, {
      id: scopedTypeId,
      value: row["Product Type Value"] || titleFromId(typeId),
    })

    for (const [index, tag] of tagValues.entries()) {
      upsertMap(tags, {
        id: scopedTagIds[index],
        value: titleFromId(tag),
      })
    }

    upsertMap(categories, {
      id: scopedParentCategoryId,
      name: row["Parent Category Name"] || titleFromId(parentCategoryId),
      handle: row["Parent Category Handle"] || parentCategoryId,
      parentId: null,
    })

    upsertMap(categories, {
      id: scopedCategoryId,
      name: row["Category Name"] || titleFromId(categoryId),
      handle: row["Category Handle"] || categoryId,
      parentId: scopedParentCategoryId || null,
    })

    if (
      productHandle &&
      (scopedCollectionId || scopedTypeId || scopedTagIds.length || scopedCategoryId)
    ) {
      associations.set(`${productHandle}:${categoryId}`, {
        productHandle,
        collectionId: scopedCollectionId,
        typeId: scopedTypeId,
        tagIds: scopedTagIds,
        categoryId: scopedCategoryId,
      })
    }
  }

  return {
    collections: [...collections.values()],
    types: [...types.values()],
    tags: [...tags.values()],
    categories: [...categories.values()],
    associations: [...associations.values()],
  }
}

export async function upsertSellerImportTaxonomy(
  trx: Knex.Transaction,
  tenantId: string,
  seeds: SellerImportSeeds
) {
  for (const collection of seeds.collections) {
    await trx("product_collection")
      .insert({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        metadata: metadata("product_collection", tenantId),
      })
      .onConflict("id")
      .merge({
        title: collection.title,
        handle: collection.handle,
        metadata: metadata("product_collection", tenantId),
        updated_at: trx.fn.now(),
      })
  }

  for (const type of seeds.types) {
    await trx("product_type")
      .insert({
        id: type.id,
        value: type.value,
        metadata: metadata("product_type", tenantId),
      })
      .onConflict("id")
      .merge({
        value: type.value,
        metadata: metadata("product_type", tenantId),
        updated_at: trx.fn.now(),
      })
  }

  for (const tag of seeds.tags) {
    await trx("product_tag")
      .insert({
        id: tag.id,
        value: tag.value,
        metadata: metadata("product_tag", tenantId),
      })
      .onConflict("id")
      .merge({
        value: tag.value,
        metadata: metadata("product_tag", tenantId),
        updated_at: trx.fn.now(),
      })
  }

  const sortedCategories = [...seeds.categories].sort((left, right) => {
    if (!left.parentId && right.parentId) {
      return -1
    }
    if (left.parentId && !right.parentId) {
      return 1
    }
    return left.handle.localeCompare(right.handle)
  })

  for (const category of sortedCategories) {
    const mpath = category.parentId ? `${category.parentId}.${category.id}` : category.id

    await trx("product_category")
      .insert({
        id: category.id,
        name: category.name,
        description: "",
        handle: category.handle,
        mpath,
        is_active: true,
        is_internal: false,
        rank: 0,
        parent_category_id: category.parentId,
        metadata: metadata("product_category", tenantId),
      })
      .onConflict("id")
      .merge({
        name: category.name,
        handle: category.handle,
        mpath,
        is_active: true,
        is_internal: false,
        parent_category_id: category.parentId,
        metadata: metadata("product_category", tenantId),
        updated_at: trx.fn.now(),
      })
  }
}

export async function linkSellerImportProducts(
  trx: Knex.Transaction,
  associations: AssociationSeed[]
): Promise<number> {
  let linked = 0

  for (const association of associations) {
    const product = await trx("product")
      .where({ handle: association.productHandle })
      .whereNull("deleted_at")
      .first("id")

    if (!product?.id) {
      continue
    }

    await trx("product")
      .where({ id: product.id })
      .update({
        collection_id: association.collectionId || null,
        type_id: association.typeId || null,
        updated_at: trx.fn.now(),
      })

    for (const tagId of association.tagIds) {
      const existingTagLink = await trx("product_tags")
        .where({
          product_id: product.id,
          product_tag_id: tagId,
        })
        .first("product_id")

      if (!existingTagLink) {
        await trx("product_tags")
          .insert({
            product_id: product.id,
            product_tag_id: tagId,
          })
          .onConflict(["product_id", "product_tag_id"])
          .ignore()
      }
    }

    if (association.categoryId) {
      const existingCategoryLink = await trx("product_category_product")
        .where({
          product_id: product.id,
          product_category_id: association.categoryId,
        })
        .first("product_id")

      if (!existingCategoryLink) {
        await trx("product_category_product")
          .insert({
            product_id: product.id,
            product_category_id: association.categoryId,
          })
          .onConflict(["product_id", "product_category_id"])
          .ignore()
      }
    }

    linked += 1
  }

  return linked
}
