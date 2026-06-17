import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  deleteTenantPaymentCredentials,
  getTenantPaymentCredentialSecret,
  getTenantPaymentCredentialSummary,
  upsertTenantPaymentCredentials,
} from "../platform/repository"

const TENANT_ID = "00000000-0000-0000-0000-00000000a701"

async function ensureTenant(knex: Knex): Promise<void> {
  await knex("tenants")
    .insert({
      id: TENANT_ID,
      name: "Razorpay Credential Test",
      slug: "razorpay-credential-test",
      status: "active",
    })
    .onConflict("id")
    .merge({
      name: "Razorpay Credential Test",
      slug: "razorpay-credential-test",
      status: "active",
      updated_at: knex.fn.now(),
    })
}

export default async function assertTenantPaymentCredentials({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Tenant payment credentials assertions: checking Razorpay storage")

  await ensureTenant(knex)
  await deleteTenantPaymentCredentials(knex, TENANT_ID, "razorpay")

  await upsertTenantPaymentCredentials(knex, TENANT_ID, {
    provider: "razorpay",
    mode: "test",
    enabled: true,
    keyId: "rzp_test_selfkart_key",
    keySecret: "selfkart_key_secret_1234",
    webhookSecret: "selfkart_webhook_secret_5678",
  })

  const summary = await getTenantPaymentCredentialSummary(knex, TENANT_ID, "razorpay")
  assert.ok(summary, "summary must exist after save")
  assert.equal(summary.provider, "razorpay")
  assert.equal(summary.mode, "test")
  assert.equal(summary.enabled, true)
  assert.equal(summary.key_id, "rzp_test_selfkart_key")
  assert.equal(summary.key_secret_hint, "1234")
  assert.equal(summary.webhook_secret_hint, "5678")
  assert.equal(summary.ready, true)
  assert.equal(
    Object.values(summary).some((value) => value === "selfkart_key_secret_1234"),
    false,
    "summary must never expose key_secret"
  )
  assert.equal(
    Object.values(summary).some((value) => value === "selfkart_webhook_secret_5678"),
    false,
    "summary must never expose webhook_secret"
  )

  assert.equal(
    await getTenantPaymentCredentialSecret(knex, TENANT_ID, "razorpay", "key_secret"),
    "selfkart_key_secret_1234",
    "provider runtime must be able to decrypt key_secret"
  )
  assert.equal(
    await getTenantPaymentCredentialSecret(
      knex,
      TENANT_ID,
      "razorpay",
      "webhook_secret"
    ),
    "selfkart_webhook_secret_5678",
    "webhook runtime must be able to decrypt webhook_secret"
  )

  await upsertTenantPaymentCredentials(knex, TENANT_ID, {
    provider: "razorpay",
    mode: "live",
    enabled: false,
    keyId: "rzp_live_selfkart_key",
  })

  const rotated = await getTenantPaymentCredentialSummary(knex, TENANT_ID, "razorpay")
  assert.ok(rotated)
  assert.equal(rotated.mode, "live")
  assert.equal(rotated.enabled, false)
  assert.equal(rotated.key_id, "rzp_live_selfkart_key")
  assert.equal(rotated.key_secret_hint, "1234", "blank update preserves key_secret")
  assert.equal(
    rotated.webhook_secret_hint,
    "5678",
    "blank update preserves webhook_secret"
  )

  await deleteTenantPaymentCredentials(knex, TENANT_ID, "razorpay")
  await knex("tenant_domains").where({ tenant_id: TENANT_ID }).del()
  await knex("seller_applications").where({ tenant_id: TENANT_ID }).del()
  await knex("tenants").where({ id: TENANT_ID }).del()

  logger.info("Tenant payment credentials assertions passed")
}
