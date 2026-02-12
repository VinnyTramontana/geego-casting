import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { StoredFile, StorageManifest } from "@/types";

export type { StoredFile, StorageManifest };

/**
 * Local file storage for MVP.
 *
 * Stores uploaded files in a configurable directory with a JSON manifest
 * that tracks expiry. Files expire after 7 days by default.
 *
 * PRODUCTION NOTE: Replace this module with Vercel Blob Storage or AWS S3
 * for production deployments. The interface (storeFile, getFileUrl, cleanupExpired)
 * should remain the same -- only the implementation changes.
 */

const STORAGE_DIR =
  process.env.FILE_STORAGE_DIR || path.join("/tmp", "geego-uploads");
const MANIFEST_FILE = path.join(STORAGE_DIR, "_manifest.json");
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// ─── Manifest helpers ───────────────────────────────────────────

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

async function readManifest(): Promise<StorageManifest> {
  try {
    const raw = await fs.readFile(MANIFEST_FILE, "utf-8");
    return JSON.parse(raw) as StorageManifest;
  } catch {
    return { files: {} };
  }
}

async function writeManifest(manifest: StorageManifest): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf-8");
}

// ─── Path sanitization ─────────────────────────────────────────

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Strips directory components and replaces unsafe characters.
 */
function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Store a file buffer and return a StoredFile with key, URL, and expiration.
 *
 * @param buffer       - The file contents
 * @param fileName     - Original file name (used for the stored filename suffix)
 * @returns            - { key, url, expiresAt }
 */
export async function storeFile(
  buffer: Buffer,
  fileName: string
): Promise<StoredFile> {
  await ensureStorageDir();

  const safeName = sanitizeFilename(fileName);
  const key = `${uuidv4()}-${safeName}`;
  const storedPath = path.join(STORAGE_DIR, key);

  await fs.writeFile(storedPath, buffer);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_MS).toISOString();

  // Update manifest
  const manifest = await readManifest();
  manifest.files[key] = {
    originalName: fileName,
    storedPath,
    expiresAt,
    createdAt: now.toISOString(),
  };
  await writeManifest(manifest);

  return {
    key,
    url: `/api/files/${key}`,
    expiresAt,
  };
}

/**
 * Get the URL for a stored file by its key.
 * Returns null if the file doesn't exist or has expired.
 *
 * @param key - The unique key returned by storeFile
 * @returns   - URL string or null
 */
export async function getFileUrl(key: string): Promise<string | null> {
  const manifest = await readManifest();
  const entry = manifest.files[key];

  if (!entry) {
    return null;
  }

  // Check if expired
  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    // Clean up expired file
    try {
      await fs.unlink(entry.storedPath);
    } catch {
      // File may already be gone
    }
    delete manifest.files[key];
    await writeManifest(manifest);
    return null;
  }

  // Verify file still exists on disk
  try {
    await fs.access(entry.storedPath);
  } catch {
    // File missing from disk; remove from manifest
    delete manifest.files[key];
    await writeManifest(manifest);
    return null;
  }

  return `/api/files/${key}`;
}

/**
 * Read the raw file buffer for a stored file by its key.
 * Returns null if the file doesn't exist, has expired, or can't be read.
 */
export async function getFileBuffer(key: string): Promise<Buffer | null> {
  const manifest = await readManifest();
  const entry = manifest.files[key];

  if (!entry) {
    return null;
  }

  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    try {
      await fs.unlink(entry.storedPath);
    } catch {
      // ignore
    }
    delete manifest.files[key];
    await writeManifest(manifest);
    return null;
  }

  try {
    return await fs.readFile(entry.storedPath);
  } catch {
    return null;
  }
}

/**
 * Remove all expired files from storage and clean up the manifest.
 * Returns the number of files removed.
 *
 * Call this periodically (e.g., via a cron job or on each upload) to
 * prevent unbounded disk usage.
 */
export async function cleanupExpired(): Promise<number> {
  const manifest = await readManifest();
  const now = Date.now();
  let removedCount = 0;

  for (const [key, entry] of Object.entries(manifest.files)) {
    if (new Date(entry.expiresAt).getTime() < now) {
      try {
        await fs.unlink(entry.storedPath);
      } catch {
        // File may already be deleted
      }
      delete manifest.files[key];
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await writeManifest(manifest);
  }

  return removedCount;
}

/**
 * Delete a specific file by key.
 */
export async function deleteFile(key: string): Promise<void> {
  const manifest = await readManifest();
  const entry = manifest.files[key];

  if (entry) {
    try {
      await fs.unlink(entry.storedPath);
    } catch {
      // ignore
    }
    delete manifest.files[key];
    await writeManifest(manifest);
  }
}
