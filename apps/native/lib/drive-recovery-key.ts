import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DRIVE_RECOVERY_KEY_NAME = "berkas.drive-recovery-key.v1";
const RECOVERY_KEY_PATTERN = /^[0-9a-f]{64}$/i;
let recoveryKeyOperation = Promise.resolve();

export async function withDriveRecoveryKeyLock<T>(operation: () => Promise<T>) {
  const previous = recoveryKeyOperation;
  let release!: () => void;
  recoveryKeyOperation = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeDriveRecoveryKey(value: string) {
  return value.replace(/[^0-9a-f]/gi, "").toLowerCase();
}

export function formatDriveRecoveryKey(value: string) {
  return normalizeDriveRecoveryKey(value).toUpperCase().match(/.{1,8}/g)?.join("-") ?? "";
}

export function isValidDriveRecoveryKey(value: string) {
  return RECOVERY_KEY_PATTERN.test(normalizeDriveRecoveryKey(value));
}

export async function getDriveRecoveryKeyHex() {
  return SecureStore.getItemAsync(DRIVE_RECOVERY_KEY_NAME);
}

export async function getOrCreateDriveRecoveryKeyHex() {
  return withDriveRecoveryKeyLock(async () => {
    const current = await getDriveRecoveryKeyHex();
    if (current) return current;
    const key = bytesToHex(await getRandomBytesAsync(32));
    await saveDriveRecoveryKeyHex(key);
    return key;
  });
}

export async function setDriveRecoveryKeyHex(value: string) {
  return withDriveRecoveryKeyLock(() => saveDriveRecoveryKeyHex(value));
}

async function saveDriveRecoveryKeyHex(value: string) {
  const key = normalizeDriveRecoveryKey(value);
  if (!RECOVERY_KEY_PATTERN.test(key)) throw new Error("Enter the complete 64-character recovery key.");
  await SecureStore.setItemAsync(DRIVE_RECOVERY_KEY_NAME, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
