import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton, Surface, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, type AppIconName, appIconSource } from "@/components/app-icon";
import { usePurchases } from "@/contexts/purchases-context";
import { colors, radii, spacing, typography } from "@/lib/theme";

const benefits: Array<{ icon: AppIconName; title: string; detail: string }> = [
  {
    icon: "vault",
    title: "An unlimited private vault",
    detail: "Keep every important PDF, scan, and image encrypted on this device.",
  },
  {
    icon: "cloud",
    title: "Optional Google Drive sync",
    detail: "Connect Google only when you want encrypted backup and restore across devices.",
  },
  {
    icon: "hidden",
    title: "No Berkas account",
    detail: "Pro works locally without signing up or connecting a cloud account.",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isConfigured,
    isPro,
    isOfferingsLoading,
    offeringsError,
    packages,
    purchase,
    restore,
    refreshOfferings,
  } = usePurchases();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const isBusy = purchasingId !== null || isRestoring;

  async function buy(index: number) {
    const item = packages[index];
    if (!item || isBusy) return;
    setPurchasingId(item.identifier);
    try {
      await purchase(item);
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean; message?: string };
      if (!purchaseError.userCancelled) {
        Alert.alert("Purchase not completed", purchaseError.message ?? "Try again in a moment.");
      }
    } finally {
      setPurchasingId(null);
    }
  }

  async function restorePurchase() {
    if (isBusy) return;
    setIsRestoring(true);
    try {
      await restore();
      Alert.alert("Purchases checked", "Your Galaxy Store purchases have been restored.");
    } catch {
      Alert.alert("Restore failed", "Check your connection and try again.");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.proMark}>
            <AppIcon name={isPro ? "member" : "upgrade"} size={20} color={colors.forestDark} />
            <Text style={styles.proMarkText}>BERKAS PRO</Text>
          </View>
          <IconButton
            icon={appIconSource("close")}
            mode="contained-tonal"
            size={21}
            accessibilityLabel="Close Berkas Pro"
            onPress={() => router.back()}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{isPro ? "YOUR VAULT IS UNLIMITED" : "MORE ROOM. SAME PRIVACY."}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {isPro ? "Berkas Pro is active." : "Keep the documents that keep life moving."}
          </Text>
          <Text style={styles.lead}>
            {isPro
              ? "Unlimited local documents are unlocked. Google Drive remains optional."
              : "Upgrade the local-first vault you already trust. No Berkas login, no advertising, no tracking."}
          </Text>
        </View>

        <Surface elevation={0} style={styles.benefitCard}>
          {benefits.map((benefit, index) => (
            <View key={benefit.title} style={[styles.benefit, index > 0 ? styles.benefitDivider : null]}>
              <View style={styles.benefitIcon}>
                <AppIcon name={benefit.icon} size={22} color={colors.forestDark} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDetail}>{benefit.detail}</Text>
              </View>
            </View>
          ))}
        </Surface>

        {isPro ? (
          <View style={styles.activeCard}>
            <AppIcon name="check-circle" size={25} color={colors.forestDark} />
            <View style={styles.activeCopy}>
              <Text style={styles.activeTitle}>Pro access confirmed</Text>
              <Text style={styles.activeDetail}>You can close this screen and keep using your unlimited vault.</Text>
            </View>
          </View>
        ) : isOfferingsLoading ? (
          <View style={styles.offerState} accessibilityLiveRegion="polite">
            <ActivityIndicator size={24} color={colors.forest} />
            <Text style={styles.offerStateText}>Loading your Galaxy Store offer...</Text>
          </View>
        ) : offeringsError ? (
          <View style={styles.offerState} accessibilityRole="alert">
            <AppIcon name="alert" size={23} color={colors.rust} />
            <Text style={styles.offerErrorText}>{offeringsError}</Text>
            <Button mode="text" textColor={colors.forestDark} onPress={() => void refreshOfferings()}>
              Try again
            </Button>
          </View>
        ) : isConfigured && packages.length > 0 ? (
          <View style={styles.offers}>
            {packages.map((item, index) => (
              <Button
                key={item.identifier}
                mode="contained"
                icon={appIconSource("upgrade")}
                loading={purchasingId === item.identifier}
                disabled={isBusy}
                accessibilityLabel={`Get Berkas Pro for ${item.product.priceString}`}
                onPress={() => void buy(index)}
                contentStyle={styles.purchaseContent}
                labelStyle={styles.purchaseLabel}
                style={styles.purchaseButton}
              >
                {purchasingId === item.identifier
                  ? "Opening Galaxy Store..."
                  : `Get Pro · ${item.product.priceString} monthly`}
              </Button>
            ))}
            <Text style={styles.renewalCopy}>
              Recurring monthly subscription. Price and renewal are handled by Samsung Galaxy Store.
            </Text>
          </View>
        ) : (
          <View style={styles.offerState}>
            <AppIcon name="tools" size={23} color={colors.forest} />
            <Text style={styles.offerStateText}>
              The Galaxy Store offer will appear after Samsung and RevenueCat finish connecting this app.
            </Text>
          </View>
        )}

        {isConfigured ? (
          <Button
            mode="text"
            loading={isRestoring}
            disabled={isBusy}
            textColor={colors.forestDark}
            onPress={() => void restorePurchase()}
            style={styles.restoreButton}
          >
            Restore purchases
          </Button>
        ) : null}

        <Text style={styles.footnote}>Local and private by default. Google sign-in is requested only for optional Drive sync.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paperDeep },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  proMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.signal,
  },
  proMarkText: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 11, letterSpacing: 1 },
  closeButton: { margin: 0, backgroundColor: colors.card },
  hero: { paddingTop: 42, paddingBottom: spacing.xxl },
  eyebrow: { color: colors.forest, fontFamily: typography.extraBold, fontSize: 11, letterSpacing: 1.25 },
  title: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.4,
    marginTop: spacing.md,
    maxWidth: 620,
  },
  lead: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 16, lineHeight: 24, marginTop: spacing.lg, maxWidth: 580 },
  benefitCard: {
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.forestDark,
    overflow: "hidden",
  },
  benefit: { flexDirection: "row", gap: spacing.lg, paddingVertical: spacing.xl },
  benefitDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)" },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { color: colors.white, fontFamily: typography.strong, fontSize: 15 },
  benefitDetail: { color: "#CFD9CB", fontFamily: typography.body, fontSize: 13, lineHeight: 19, marginTop: 4 },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.signal,
  },
  activeCopy: { flex: 1 },
  activeTitle: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 14 },
  activeDetail: { color: colors.forestDark, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 2 },
  offers: { marginTop: spacing.xl },
  purchaseButton: { borderRadius: radii.full },
  purchaseContent: { minHeight: 58 },
  purchaseLabel: { fontFamily: typography.strong, fontSize: 15, letterSpacing: 0 },
  renewalCopy: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: spacing.md },
  offerState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  offerStateText: { flex: 1, color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  offerErrorText: { flex: 1, color: colors.rust, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  restoreButton: { alignSelf: "center", marginTop: spacing.sm },
  footnote: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.lg },
});
