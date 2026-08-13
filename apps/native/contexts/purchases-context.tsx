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
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import { PRO_ENTITLEMENT_ID, PRO_OFFERING_ID, isLifetimeProPackage } from "@/lib/pro-product";

const googlePlayApiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

type PurchasesContextValue = {
  isConfigured: boolean;
  isPro: boolean;
  isLoading: boolean;
  isOfferingsLoading: boolean;
  offeringsError: string | null;
  packages: PurchasesPackage[];
  purchase: (item: PurchasesPackage) => Promise<void>;
  restore: () => Promise<boolean>;
  refreshOfferings: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function hasProEntitlement(customerInfo: Parameters<CustomerInfoUpdateListener>[0]) {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export function PurchasesProvider({ children }: PropsWithChildren) {
  const isConfigured = Platform.OS === "android" && Boolean(googlePlayApiKey);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [isOfferingsLoading, setIsOfferingsLoading] = useState(isConfigured);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const offeringsAttempt = useRef(0);
  const customerInfoAttempt = useRef(0);

  async function refreshOfferings() {
    if (!isConfigured) return;
    const attempt = offeringsAttempt.current + 1;
    offeringsAttempt.current = attempt;
    setIsOfferingsLoading(true);
    setOfferingsError(null);
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      const lifetimePackages = currentOffering?.identifier === PRO_OFFERING_ID
        ? currentOffering.availablePackages.filter(isLifetimeProPackage)
        : [];
      if (attempt !== offeringsAttempt.current) return;
      setPackages(lifetimePackages);
      if (!lifetimePackages.length) {
        setOfferingsError("The Berkas Pro lifetime offer is not available from Google Play yet.");
      }
    } catch {
      if (attempt === offeringsAttempt.current) {
        setOfferingsError("Could not load the Google Play offer. Check your connection and try again.");
      }
    } finally {
      if (attempt === offeringsAttempt.current) setIsOfferingsLoading(false);
    }
  }

  useEffect(() => {
    if (!isConfigured || !googlePlayApiKey) return;

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({
      apiKey: googlePlayApiKey,
      store: "PLAY_STORE",
      automaticDeviceIdentifierCollectionEnabled: false,
    });

    const listener: CustomerInfoUpdateListener = (customerInfo) => {
      customerInfoAttempt.current += 1;
      setIsPro(hasProEntitlement(customerInfo));
      setIsLoading(false);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    function refreshPurchases() {
      const attempt = customerInfoAttempt.current + 1;
      customerInfoAttempt.current = attempt;
      void Purchases.getCustomerInfo()
        .then((customerInfo) => {
          if (attempt === customerInfoAttempt.current) setIsPro(hasProEntitlement(customerInfo));
        })
        .catch(() => undefined)
        .finally(() => {
          if (attempt === customerInfoAttempt.current) setIsLoading(false);
        });
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
    const purchasedPro = hasProEntitlement(customerInfo);
    setIsPro(purchasedPro);
    if (!purchasedPro) {
      throw new Error("Google Play completed the purchase, but Pro access is not active yet. Try Restore purchases in a moment.");
    }
  }

  async function restore() {
    const customerInfo = await Purchases.restorePurchases();
    const restoredPro = hasProEntitlement(customerInfo);
    setIsPro(restoredPro);
    return restoredPro;
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
