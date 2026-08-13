import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

const BIOMETRIC_SETTING_KEY = "berkas.biometric-lock.v1";

type SecurityContextValue = {
  biometricEnabled: boolean;
  isLocked: boolean;
  isLoading: boolean;
  initializationError: string | null;
  retryInitialization: () => void;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  unlock: () => Promise<boolean>;
  runWithAutoLockPaused: <T>(action: () => Promise<T>) => Promise<T>;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: PropsWithChildren) {
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const autoLockPaused = useRef(false);

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Berkas",
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
      try {
        const enabled = (await SecureStore.getItemAsync(BIOMETRIC_SETTING_KEY)) === "true";
        if (!mounted) return;
        setInitializationError(null);
        setBiometricEnabledState(enabled);
        setIsLocked(enabled);
        setIsLoading(false);
        if (enabled) await authenticate();
      } catch {
        if (!mounted) return;
        setInitializationError("Berkas could not access Android secure storage.");
        setIsLoading(false);
      }
    }

    void loadSetting();
    return () => {
      mounted = false;
    };
  }, [initializationAttempt]);

  useEffect(() => {
    function handleAppState(state: AppStateStatus) {
      if (state !== "active" && biometricEnabled && !autoLockPaused.current) setIsLocked(true);
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

  async function runWithAutoLockPaused<T>(action: () => Promise<T>) {
    autoLockPaused.current = true;
    try {
      return await action();
    } finally {
      autoLockPaused.current = false;
      if (biometricEnabled && AppState.currentState !== "active") setIsLocked(true);
    }
  }

  return (
    <SecurityContext
      value={{
        biometricEnabled,
        isLocked,
        isLoading,
        initializationError,
        retryInitialization: () => {
          setIsLoading(true);
          setInitializationAttempt((attempt) => attempt + 1);
        },
        setBiometricEnabled,
        unlock: authenticate,
        runWithAutoLockPaused,
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
