import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const VAULT_KEY_NAME = "berkas.vault-key.v1";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getVaultKeyHex() {
  const existingKey = await SecureStore.getItemAsync(VAULT_KEY_NAME);
  if (existingKey) return existingKey;

  const key = bytesToHex(await getRandomBytesAsync(32));
  await SecureStore.setItemAsync(VAULT_KEY_NAME, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}
