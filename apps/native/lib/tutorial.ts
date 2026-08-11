import * as SecureStore from "expo-secure-store";

const TUTORIAL_COMPLETE_KEY = "berkas_tutorial_v1_complete";

export async function hasCompletedTutorial() {
  return (await SecureStore.getItemAsync(TUTORIAL_COMPLETE_KEY)) === "true";
}

export async function markTutorialComplete() {
  await SecureStore.setItemAsync(TUTORIAL_COMPLETE_KEY, "true", {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
