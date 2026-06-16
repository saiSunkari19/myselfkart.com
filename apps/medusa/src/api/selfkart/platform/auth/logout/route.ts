import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { hashSessionToken } from "../../../../../platform/auth"
import { deleteSession } from "../../../../../platform/repository"

/** Revokes the current platform session (the middleware already validated it). */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const header = req.headers["x-platform-session"]
  const token = Array.isArray(header) ? header[0] : header

  if (typeof token === "string" && token.length > 0) {
    const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
    await deleteSession(knex, hashSessionToken(token))
  }

  res.json({ ok: true })
}
