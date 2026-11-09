import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Almacenamiento de objetos.
 *  - "local": disco del servidor (solo desarrollo / un único servidor).
 *  - "s3": cualquier servicio compatible con S3 (AWS S3, Cloudflare R2, MinIO).
 * Las claves se generan en el servidor (UUID) para impedir rutas arbitrarias.
 */

const driver = (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3";
const localDir = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_DIR ?? "./storage",
);

let s3: S3Client | null = null;
function getS3() {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return s3;
}

export function buildKey(prefix: "products" | "service-orders" | "deliveries", ext: string) {
  return `${prefix}/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
}

const KEY_RE = /^(products|service-orders|deliveries)\/\d{4}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;
export function isValidKey(key: string) {
  return KEY_RE.test(key);
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  if (!isValidKey(key)) throw new Error("Clave de almacenamiento inválida");
  if (driver === "s3") {
    await getS3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }
  const full = path.join(/*turbopackIgnore: true*/ localDir, key);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(full), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ full, body);
}

export async function getObject(key: string): Promise<Uint8Array | null> {
  if (!isValidKey(key)) return null;
  if (driver === "s3") {
    const res = await getS3().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
    return res.Body ? new Uint8Array(await res.Body.transformToByteArray()) : null;
  }
  try {
    return new Uint8Array(
      await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ localDir, key)),
    );
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  if (!isValidKey(key)) return;
  if (driver === "s3") {
    await getS3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return;
  }
  await unlink(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ localDir, key)).catch(
    () => undefined,
  );
}

/** URL para imágenes públicas de productos. */
export function publicUrl(key: string) {
  if (driver === "s3" && process.env.STORAGE_PUBLIC_URL) {
    return `${process.env.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/api/files/${key}`;
}

/** URL firmada de corta duración para archivos privados (S3), o ruta protegida (local). */
export async function privateUrl(key: string, expiresInSeconds = 300) {
  if (driver === "s3") {
    return getSignedUrl(
      getS3(),
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      {
        expiresIn: expiresInSeconds,
      },
    );
  }
  return `/api/files/${key}`;
}
