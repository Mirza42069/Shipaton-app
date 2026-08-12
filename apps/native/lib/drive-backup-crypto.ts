import { Directory, File, Paths } from "expo-file-system";
import {
  AESSealedData,
  AESEncryptionKey,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";

import {
  getDriveRecoveryKeyHex,
} from "@/lib/drive-recovery-key";
import { assertSafeDocumentId, assertSafeFileExtension } from "@/lib/document-file";
import { writeTemporarySource } from "@/lib/vault-crypto";

const FILE_MAGIC_V1 = new Uint8Array([0x42, 0x4b, 0x43, 0x31]);
const FILE_MAGIC_V2 = new Uint8Array([0x42, 0x4b, 0x43, 0x32]);
const TEXT_PREFIX = "BKC1:";
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

function hasFileMagic(bytes: Uint8Array, magic: Uint8Array) {
  return magic.every((byte, index) => bytes[index] === byte);
}

function backupDirectory() {
  const directory = new Directory(Paths.cache, "berkas-drive-backup");
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

async function existingRecoveryKey() {
  const key = await getDriveRecoveryKeyHex();
  if (!key) throw new Error("Enter your Drive recovery key before restoring this encrypted backup.");
  return AESEncryptionKey.import(key, "hex");
}

export async function encryptFileForDrive(source: File, documentId: string) {
  const safeDocumentId = assertSafeDocumentId(documentId);
  const sealed = await aesEncryptAsync(await source.bytes(), await existingRecoveryKey(), {
    nonce: { length: IV_LENGTH },
    tagLength: TAG_LENGTH,
    additionalData: new TextEncoder().encode(safeDocumentId),
  });
  const destination = new File(backupDirectory(), `${safeDocumentId}.berkas`);
  destination.create({ overwrite: true, intermediates: true });
  destination.write(joinBytes(FILE_MAGIC_V2, await sealed.combined()));
  return destination;
}

export function isEncryptedDriveFile(bytes: Uint8Array) {
  return hasFileMagic(bytes, FILE_MAGIC_V1) || hasFileMagic(bytes, FILE_MAGIC_V2);
}

export async function decryptDriveFile(
  bytes: Uint8Array,
  documentId: string,
  extension: string,
  expectedVersion?: string,
) {
  const safeDocumentId = assertSafeDocumentId(documentId);
  const safeExtension = assertSafeFileExtension(extension);
  const isV2 = hasFileMagic(bytes, FILE_MAGIC_V2);
  if (!isV2 && !hasFileMagic(bytes, FILE_MAGIC_V1)) {
    throw new Error("This Drive backup is not an encrypted Berkas file.");
  }
  if (expectedVersion === "aes-gcm-v2" && !isV2) {
    throw new Error("This Drive backup does not match its encrypted file version.");
  }
  if (expectedVersion && expectedVersion !== "aes-gcm-v1" && expectedVersion !== "aes-gcm-v2") {
    throw new Error("This Drive backup uses an unsupported encryption version.");
  }
  const sealed = AESSealedData.fromCombined(bytes.slice(FILE_MAGIC_V1.length), {
    ivLength: IV_LENGTH,
    tagLength: TAG_LENGTH,
  });
  let plain: Uint8Array;
  try {
    plain = await aesDecryptAsync(
      sealed,
      await existingRecoveryKey(),
      isV2 ? { additionalData: new TextEncoder().encode(safeDocumentId) } : undefined,
    );
  } catch {
    throw new Error("This backup could not be decrypted. Check that the Drive recovery key is correct.");
  }
  return writeTemporarySource(plain, safeExtension);
}

export async function encryptDriveManifest(content: string) {
  const sealed = await aesEncryptAsync(new TextEncoder().encode(content), await existingRecoveryKey(), {
    nonce: { length: IV_LENGTH },
    tagLength: TAG_LENGTH,
  });
  return `${TEXT_PREFIX}${await sealed.combined("base64")}`;
}

export async function decryptDriveManifest(content: string) {
  if (!content.startsWith(TEXT_PREFIX)) return content;
  const sealed = AESSealedData.fromCombined(content.slice(TEXT_PREFIX.length), {
    ivLength: IV_LENGTH,
    tagLength: TAG_LENGTH,
  });
  let plain: Uint8Array;
  try {
    plain = await aesDecryptAsync(sealed, await existingRecoveryKey());
  } catch {
    throw new Error("This backup could not be decrypted. Enter the recovery key used on the original device.");
  }
  return new TextDecoder().decode(plain);
}

export function deleteDriveBackupFile(file: File) {
  if (file.exists) file.delete();
}

export function clearDriveBackupFiles() {
  const directory = new Directory(Paths.cache, "berkas-drive-backup");
  if (directory.exists) directory.delete();
}
