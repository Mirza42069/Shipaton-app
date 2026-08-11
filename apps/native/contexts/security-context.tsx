import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

const BIOMETRIC_SETTING_KEY = "pocketproof.biometric-lock.v1";

type SecurityContextValue = {
  biometricEnabled: boolean;
  isLocked: boolean;
  isLoading: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  unlock: () => Promise<boolean>;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: PropsWithChildren) {
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Pocketproof",
      promptSubtitle: "Your document vault is private",
      cancelLabel: "Keep locked",
      disableDeviceFallback: false,
    });
    if (result.success) setIsLocked(false);
    return result.success;
  }

  useEffect(() => {
    let mounted = true;

    async function loadSetting() {
      const enabled = (await SecureStore.getItemAsync(BIOMETRIC_SETTING_KEY)) === "true";
      if (!mounted) return;
      setBiometricEnabledState(enabled);
      setIsLocked(enabled);
      setIsLoading(false);
      if (enabled) await authenticate();
    }

    void loadSetting();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleAppState(state: AppStateStatus) {
      if (state !== "active" && biometricEnabled) setIsLocked(true);
      if (state === "active" && biometricEnabled && isLocked) void authenticate();
    }

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [biometricEnabled, isLocked]);

  async function setBiometricEnabled(enabled: boolean) {
    if (enabled) {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hasHardware || !isEnrolled) return false;
      if (!(await authenticate())) return false;
    }

    await SecureStore.setItemAsync(BIOMETRIC_SETTING_KEY, String(enabled));
    setBiometricEnabledState(enabled);
    setIsLocked(false);
    return true;
  }

  return (
    <SecurityContext
      value={{
        biometricEnabled,
        isLocked,
        isLoading,
        setBiometricEnabled,
        unlock: authenticate,
      }}
    >
      {children}
    </SecurityContext>
  );
}

export function useSecurity() {
  const context = use(SecurityContext);
  if (!context) throw new Error("useSecurity must be used inside SecurityProvider");
  return context;
}
