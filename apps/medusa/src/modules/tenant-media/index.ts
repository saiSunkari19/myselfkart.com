import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { FileTypes, Logger, S3FileServiceOptions } from "@medusajs/framework/types"
import { MedusaError, ModuleProvider, Modules } from "@medusajs/framework/utils"
import { S3FileService } from "@medusajs/file-s3/dist/services/s3-file"
import path from "node:path"
import { PassThrough, type Readable } from "node:stream"
import { ulid } from "ulid"

import { requireTenantContext } from "../tenant-context"

const DEFAULT_UPLOAD_EXPIRATION_DURATION_SECONDS = 60 * 60
const TENANT_MEDIA_ROOT = "tenants"

type InjectedDependencies = {
  logger: Logger
}

export function buildTenantMediaPrefix(tenantId: string): string {
  return `${TENANT_MEDIA_ROOT}/${tenantId}/media`
}

export function buildTenantMediaUploadPrefix(): string {
  const { tenantId } = requireTenantContext()

  return `${buildTenantMediaPrefix(tenantId)}/`
}

export function sanitizeMediaFilename(filename: string): string {
  const parsed = path.parse(filename)
  const basename = `${parsed.name}${parsed.ext}`.trim()
  const pathlessName = basename || "file"
  const safe = pathlessName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "")
    .replace(/[.-]+$/, "")

  return safe || "file"
}

export function assertTenantMediaKey(fileKey: string): void {
  const { tenantId } = requireTenantContext()
  const tenantPrefix = buildTenantMediaPrefix(tenantId)

  if (!fileKey.startsWith(`${TENANT_MEDIA_ROOT}/`)) {
    throw new Error(`Media key "${fileKey}" must be tenant-prefixed`)
  }

  if (!fileKey.startsWith(`${tenantPrefix}/`)) {
    throw new Error(`Media key "${fileKey}" does not belong to tenant "${tenantId}"`)
  }
}

function encodeObjectKey(fileKey: string): string {
  return fileKey.split("/").map(encodeURIComponent).join("/")
}

export class TenantR2FileService extends S3FileService {
  static identifier = "tenant-r2"

  constructor(deps: InjectedDependencies, options: S3FileServiceOptions) {
    super(deps, options)
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No file provided")
    }
    if (!file.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No filename provided")
    }

    const parsedFilename = path.parse(sanitizeMediaFilename(file.filename))
    const fileKey = `${buildTenantMediaUploadPrefix()}${parsedFilename.name}-${ulid()}${
      parsedFilename.ext
    }`
    let content: Buffer

    try {
      const decoded = Buffer.from(file.content, "base64")
      content =
        decoded.toString("base64") === file.content
          ? decoded
          : Buffer.from(file.content, "utf8")
    } catch {
      content = Buffer.from(file.content, "binary")
    }

    const command = new PutObjectCommand({
      ACL: file.access === "public" ? "public-read" : "private",
      Bucket: this.config_.bucket,
      Body: content,
      Key: fileKey,
      ContentType: file.mimeType,
      CacheControl: this.config_.cacheControl,
      Metadata: {
        "original-filename": encodeURIComponent(file.filename),
      },
    })

    try {
      await this.client_.send(command)
    } catch (error) {
      this.logger_.error(error instanceof Error ? error : String(error))
      throw error
    }

    return {
      url: `${this.config_.fileUrl}/${encodeObjectKey(fileKey)}`,
      key: fileKey,
    }
  }

  async getUploadStream(fileData: FileTypes.ProviderUploadStreamDTO): Promise<{
    writeStream: PassThrough
    promise: Promise<FileTypes.ProviderFileResultDTO>
    url: string
    fileKey: string
  }> {
    if (!fileData.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No filename provided")
    }

    const parsedFilename = path.parse(sanitizeMediaFilename(fileData.filename))
    const fileKey = `${buildTenantMediaUploadPrefix()}${parsedFilename.name}-${ulid()}${
      parsedFilename.ext
    }`
    const pass = new PassThrough()
    const upload = new Upload({
      client: this.client_,
      params: {
        ACL: fileData.access === "public" ? "public-read" : "private",
        Bucket: this.config_.bucket,
        Key: fileKey,
        Body: pass,
        ContentType: fileData.mimeType,
        CacheControl: this.config_.cacheControl,
        Metadata: {
          "original-filename": encodeURIComponent(fileData.filename),
        },
      },
    })
    const url = `${this.config_.fileUrl}/${encodeObjectKey(fileKey)}`
    const promise = upload.done().then(() => ({ url, key: fileKey }))

    return {
      writeStream: pass,
      promise,
      url,
      fileKey,
    }
  }

  async getPresignedUploadUrl(
    fileData: FileTypes.ProviderGetPresignedUploadUrlDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!fileData?.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No filename provided")
    }

    const fileKey = `${buildTenantMediaUploadPrefix()}${sanitizeMediaFilename(
      fileData.filename
    )}`
    const command = new PutObjectCommand({
      Bucket: this.config_.bucket,
      ContentType: fileData.mimeType,
      ACL: fileData.access === "public" ? "public-read" : "private",
      Key: fileKey,
    })
    const signedUrl = await getSignedUrl(this.client_, command, {
      expiresIn: fileData.expiresIn ?? DEFAULT_UPLOAD_EXPIRATION_DURATION_SECONDS,
    })

    return {
      url: signedUrl,
      key: fileKey,
    }
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    const input = Array.isArray(files) ? files : [files]
    input.forEach((file) => assertTenantMediaKey(file.fileKey))

    try {
      if (Array.isArray(files)) {
        await this.client_.send(
          new DeleteObjectsCommand({
            Bucket: this.config_.bucket,
            Delete: {
              Objects: files.map((file) => ({
                Key: file.fileKey,
              })),
              Quiet: true,
            },
          })
        )
      } else {
        await this.client_.send(
          new DeleteObjectCommand({
            Bucket: this.config_.bucket,
            Key: files.fileKey,
          })
        )
      }
    } catch (error) {
      this.logger_.error(error instanceof Error ? error : String(error))
    }
  }

  async getPresignedDownloadUrl(fileData: FileTypes.ProviderGetFileDTO): Promise<string> {
    assertTenantMediaKey(fileData.fileKey)

    return super.getPresignedDownloadUrl(fileData)
  }

  async getDownloadStream(fileData: FileTypes.ProviderGetFileDTO): Promise<Readable> {
    assertTenantMediaKey(fileData.fileKey)

    return super.getDownloadStream(fileData)
  }

  async getAsBuffer(fileData: FileTypes.ProviderGetFileDTO): Promise<Buffer> {
    assertTenantMediaKey(fileData.fileKey)

    return super.getAsBuffer(fileData)
  }
}

export default ModuleProvider(Modules.FILE, {
  services: [TenantR2FileService],
})
