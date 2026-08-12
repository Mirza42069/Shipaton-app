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
  isOfferingsLoading: boolean;
  offeringsError: string | null;
  packages: PurchasesPackage[];
  purchase: (item: PurchasesPackage) => Promise<void>;
  restore: () => Promise<void>;
  refreshOfferings: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function hasProEntitlement(customerInfo: Parameters<CustomerInfoUpdateListener>[0]) {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export function PurchasesProvider({ children }: PropsWithChildren) {
  const isConfigured = Platform.OS === "android" && Boolean(galaxyApiKey);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [isOfferingsLoading, setIsOfferingsLoading] = useState(isConfigured);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  async function refreshOfferings() {
    if (!isConfigured) return;
    setIsOfferingsLoading(true);
    setOfferingsError(null);
    try {
      const offerings = await Purchases.getOfferings();
      setPackages(offerings.current?.availablePackages ?? []);
    } catch {
      setOfferingsError("Could not load the Galaxy Store offer. Check your connection and try again.");
    } finally {
      setIsOfferingsLoading(false);
    }
  }

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
      void refreshOfferings();
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
    <PurchasesContext
      value={{
        isConfigured,
        isPro,
        isLoading,
        isOfferingsLoading,
        offeringsError,
        packages,
        purchase,
        restore,
        refreshOfferings,
      }}
    >
      {children}
    </PurchasesContext>
  );
}

export function usePurchases() {
  const context = use(PurchasesContext);
  if (!context) throw new Error("usePurchases must be used inside PurchasesProvider");
  return context;
}
