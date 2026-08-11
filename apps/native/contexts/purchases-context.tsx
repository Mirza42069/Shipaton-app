import { GALAXY_BILLING_MODE } from "react-native-purchases-store-galaxy";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfoUpdateListener,
  type PurchasesPackage,
} from "react-native-purchases";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

const ENTITLEMENT_ID = "pro";
const galaxyApiKey = process.env.EXPO_PUBLIC_REVENUECAT_GALAXY_API_KEY;

type PurchasesContextValue = {
  isConfigured: boolean;
  isPro: boolean;
  isLoading: boolean;
  packages: PurchasesPackage[];
  purchase: (item: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function hasProEntitlement(customerInfo: Parameters<CustomerInfoUpdateListener>[0]) {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export function PurchasesProvider({ children }: PropsWithChildren) {
  const isConfigured = Platform.OS === "android" && Boolean(galaxyApiKey);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (!isConfigured || !galaxyApiKey) return;

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({
      apiKey: galaxyApiKey,
      store: "GALAXY",
      galaxyBillingMode: __DEV__ ? GALAXY_BILLING_MODE.TEST : GALAXY_BILLING_MODE.PRODUCTION,
      automaticDeviceIdentifierCollectionEnabled: false,
    });

    const listener: CustomerInfoUpdateListener = (customerInfo) => {
      setIsPro(hasProEntitlement(customerInfo));
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    function refreshPurchases() {
      void Purchases.getCustomerInfo()
        .then((customerInfo) => setIsPro(hasProEntitlement(customerInfo)))
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
      void Purchases.getOfferings()
        .then((offerings) => setPackages(offerings.current?.availablePackages ?? []))
        .catch(() => undefined);
    }

    refreshPurchases();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPurchases();
    });

    return () => {
      appStateSubscription.remove();
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  async function purchase(item: PurchasesPackage) {
    const { customerInfo } = await Purchases.purchasePackage(item);
    setIsPro(hasProEntitlement(customerInfo));
  }

  async function restore() {
    const customerInfo = await Purchases.restorePurchases();
    setIsPro(hasProEntitlement(customerInfo));
  }

  return (
    <PurchasesContext value={{ isConfigured, isPro, isLoading, packages, purchase, restore }}>
      {children}
    </PurchasesContext>
  );
}

export function usePurchases() {
  const context = use(PurchasesContext);
  if (!context) throw new Error("usePurchases must be used inside PurchasesProvider");
  return context;
}
