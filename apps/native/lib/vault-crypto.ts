import { Directory, File, Paths } from "expo-file-system";
import {
  AESSealedData,
  AESEncryptionKey,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";

import { assertSafeDocumentId, assertSafeFileExtension } from "@/lib/document-file";
import { getVaultKeyHex } from "@/lib/vault-key";

const MAGIC = new Uint8Array([0x42, 0x4b, 0x56, 0x31]);
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function joinBytes(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function hasMagic(bytes: Uint8Array) {
  return MAGIC.every((byte, index) => bytes[index] === byte);
}

function vaultDirectory() {
  const directory = new Directory(Paths.document, "berkas-vault");
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function previewDirectory() {
  const directory = new Directory(Paths.cache, "berkas-preview");
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function importDirectory() {
  const directory = new Directory(Paths.cache, "berkas-import");
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export async function stageTemporarySource(sourceUri: string, extension: string) {
  const safeExtension = assertSafeFileExtension(extension);
  const source = new File(sourceUri);
  const destination = new File(
    importDirectory(),
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`,
  );
  await source.copy(destination);
  deleteTemporarySource(sourceUri);
  return destination.uri;
}

export function writeTemporarySource(bytes: Uint8Array, extension: string) {
  const safeExtension = assertSafeFileExtension(extension);
  const destination = new File(
    importDirectory(),
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${safeExtension}`,
  );
  destination.create({ overwrite: false, intermediates: true });
  destination.write(bytes);
  return destination.uri;
}

export async function encryptIntoVault(sourceUri: string, documentId: string) {
  const safeDocumentId = assertSafeDocumentId(documentId);
  const source = new File(sourceUri);
  const plainBytes = await source.bytes();
  const key = await AESEncryptionKey.import(await getVaultKeyHex(), "hex");
  const sealed = await aesEncryptAsync(plainBytes, key, {
    nonce: { length: IV_LENGTH },
    tagLength: TAG_LENGTH,
  });
  const payload = joinBytes(MAGIC, await sealed.combined());
  const destination = new File(vaultDirectory(), `${safeDocumentId}.ppv`);

  destination.create({ overwrite: false, intermediates: true });
  destination.write(payload);

  return { uri: destination.uri, fileSize: plainBytes.byteLength };
}

export async function decryptForPreview(
  encryptedUri: string,
  documentId: string,
  extension: string,
) {
  const safeDocumentId = assertSafeDocumentId(documentId);
  const safeExtension = assertSafeFileExtension(extension);
  const encryptedFile = new File(encryptedUri);
  const payload = await encryptedFile.bytes();

  if (!hasMagic(payload)) {
    throw new Error("This file is not a Berkas vault file.");
  }

  const key = await AESEncryptionKey.import(await getVaultKeyHex(), "hex");
  const sealed = AESSealedData.fromCombined(payload.slice(MAGIC.length), {
    ivLength: IV_LENGTH,
    tagLength: TAG_LENGTH,
  });
  const plain = await aesDecryptAsync(sealed, key);
  const preview = new File(previewDirectory(), `${safeDocumentId}${safeExtension}`);

  preview.create({ overwrite: true, intermediates: true });
  preview.write(plain);
  return preview;
}

export function deleteVaultFile(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}

export function deleteTemporarySource(uri: string) {
  const file = new File(uri);
  try {
    if (file.exists) file.delete();
  } catch {
    // A successful vault write must not be reported as failed due to provider cleanup.
  }
}

export function deletePreviewFile(documentId: string, extension: string) {
  const safeDocumentId = assertSafeDocumentId(documentId);
  const safeExtension = assertSafeFileExtension(extension);
  const file = new File(Paths.cache, "berkas-preview", `${safeDocumentId}${safeExtension}`);
  if (file.exists) file.delete();
}

export function clearPreviewFiles() {
  const directory = new Directory(Paths.cache, "berkas-preview");
  if (directory.exists) directory.delete();
}

export function clearImportFiles() {
  const directory = new Directory(Paths.cache, "berkas-import");
  if (directory.exists) directory.delete();
}
