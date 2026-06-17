import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"

import { runWithTenantContext } from "../modules/tenant-context"
import {
  assertTenantMediaKey,
  buildTenantMediaPrefix,
  buildTenantMediaUploadPrefix,
  sanitizeMediaFilename,
  TenantR2FileService,
} from "../modules/tenant-media"

const TENANT_A = "00000000-0000-0000-0000-0000000000d1"
const TENANT_B = "00000000-0000-0000-0000-0000000000d2"

export default async function assertTenantMediaPrefix({
  container,
}: ExecArgs): Promise<void> {
  const logger = container.resolve("logger")

  logger.info("Tenant media assertions: checking R2 key prefixing")

  if (
    process.env.R2_FILE_URL &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_ENDPOINT
  ) {
    const fileModule = container.resolve<any>("file")
    const fileProvider = fileModule.getProvider().fileProvider_

    assert.equal(
      fileProvider.getIdentifier(),
      "tenant-r2",
      "configured file module must use the tenant-aware R2 provider"
    )
  }

  const tenantAPrefix = buildTenantMediaPrefix(TENANT_A)
  const tenantBPrefix = buildTenantMediaPrefix(TENANT_B)

  assert.equal(tenantAPrefix, `tenants/${TENANT_A}/media`)
  assert.equal(tenantBPrefix, `tenants/${TENANT_B}/media`)

  assert.equal(
    sanitizeMediaFilename("../../Summer Drop HERO Image.PNG"),
    "Summer-Drop-HERO-Image.PNG",
    "filenames must be pathless and URL-safe"
  )

  const uploadPrefix = runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () =>
    buildTenantMediaUploadPrefix()
  )
  assert.equal(uploadPrefix, `${tenantAPrefix}/`)

  assert.throws(
    () => buildTenantMediaUploadPrefix(),
    /Tenant context is required/,
    "uploads without tenant context must fail closed"
  )

  assert.doesNotThrow(() =>
    runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () => {
      assertTenantMediaKey(`${tenantAPrefix}/product-hero.png`)
    })
  )
  assert.throws(
    () =>
      runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () => {
        assertTenantMediaKey(`${tenantBPrefix}/product-hero.png`)
      }),
    /does not belong to tenant/,
    "tenant A must not read or delete tenant B media keys"
  )
  assert.throws(
    () =>
      runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () => {
        assertTenantMediaKey("product-hero.png")
      }),
    /must be tenant-prefixed/,
    "unprefixed object keys must not be accepted"
  )

  const sentCommands: any[] = []
  const provider = new TenantR2FileService(
    { logger },
    {
      file_url: "https://media.selfkart.test",
      access_key_id: "test-access-key",
      secret_access_key: "test-secret-key",
      region: "auto",
      bucket: "selfkart-test",
      endpoint: "https://example-account.r2.cloudflarestorage.com",
    }
  )
  ;(provider as any).client_ = {
    send: async (command: any) => {
      sentCommands.push(command)
      return {}
    },
  }

  const uploadResult = await runWithTenantContext(
    { tenantId: TENANT_A, source: "test" },
    () =>
      provider.upload({
        filename: "../../Hero Image.PNG",
        mimeType: "image/png",
        content: Buffer.from("image-bytes").toString("base64"),
        access: "public",
      })
  )

  assert.match(
    uploadResult.key,
    new RegExp(`^tenants/${TENANT_A}/media/Hero-Image-[0-9A-HJKMNP-TV-Z]{26}\\.PNG$`),
    "provider upload keys must include the active tenant prefix"
  )
  assert.equal(
    uploadResult.url,
    `https://media.selfkart.test/${uploadResult.key}`,
    "provider upload URLs must include the prefixed R2 object key"
  )
  assert.equal(sentCommands.length, 1)
  assert.equal(sentCommands[0].input.Key, uploadResult.key)
  assert.equal(sentCommands[0].input.Bucket, "selfkart-test")
  assert.equal(sentCommands[0].input.ACL, "public-read")

  await assert.rejects(
    () =>
      runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () =>
        provider.delete({ fileKey: `${tenantBPrefix}/product-hero.png` })
      ),
    /does not belong to tenant/,
    "provider delete must reject cross-tenant R2 keys before reaching S3"
  )

  logger.info("Tenant media assertions passed")
}
