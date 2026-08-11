import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ActionButton, PageHeader, Screen } from "@/components/screen";
import { usePurchases } from "@/contexts/purchases-context";
import { useSecurity } from "@/contexts/security-context";
import { useVault } from "@/contexts/vault-context";
import { colors, typography } from "@/lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { documents } = useVault();
  const { biometricEnabled, setBiometricEnabled } = useSecurity();
  const { isConfigured, isPro, packages, purchase, restore } = usePurchases();

  async function toggleBiometric(enabled: boolean) {
    if (!(await setBiometricEnabled(enabled))) {
      Alert.alert(
        "Biometric lock unavailable",
        "Set up a fingerprint or secure device credential in Android Settings first.",
      );
    }
  }

  async function buyPackage(index: number) {
    const item = packages[index];
    if (!item) return;
    try {
      await purchase(item);
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean; message?: string };
      if (!purchaseError.userCancelled) {
        Alert.alert("Purchase not completed", purchaseError.message ?? "Try again in a moment.");
      }
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="CONTROL ROOM"
        title="Private by design."
        detail="Pocketproof does not need an account to remember what matters."
      />

      <Text style={styles.sectionLabel}>SECURITY</Text>
      <View style={styles.panel}>
        <SettingRow
          icon="finger-print-outline"
          title="Biometric lock"
          detail="Lock when Pocketproof leaves the foreground."
          trailing={
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => void toggleBiometric(value)}
              trackColor={{ false: colors.rule, true: colors.forest }}
              thumbColor={biometricEnabled ? colors.signal : colors.card}
            />
          }
        />
        <View style={styles.divider} />
        <SettingRow
          icon="eye-off-outline"
          title="Screen protection"
          detail="Screenshots and recent-app previews are blocked."
          trailing={<Text style={styles.onLabel}>ALWAYS ON</Text>}
        />
        <View style={styles.divider} />
        <Pressable onPress={() => router.push("/privacy")}>
          <SettingRow
            icon="document-text-outline"
            title="Privacy policy"
            detail="See exactly what is stored and where."
            trailing={<Ionicons name="arrow-forward" size={20} color={colors.ink} />}
          />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>POCKETPROOF PRO</Text>
      <View style={styles.proCard}>
        <View style={styles.proMark}>
          <Text style={styles.proMarkText}>{isPro ? "PRO" : `${documents.length}/10`}</Text>
        </View>
        <Text style={styles.proEyebrow}>{isPro ? "PRO VAULT ACTIVE" : "FREE VAULT"}</Text>
        <Text style={styles.proTitle}>{isPro ? "No limits. Just safekeeping." : "Make the vault unlimited."}</Text>
        <Text style={styles.proCopy}>
          Unlimited documents, custom process lists, OCR search, advanced export, and future Pro tools.
        </Text>

        {isPro ? (
          <View style={styles.activePlan}>
            <Ionicons name="checkmark-circle" size={21} color={colors.signal} />
            <Text style={styles.activePlanText}>All Pro features are unlocked</Text>
          </View>
        ) : isConfigured && packages.length > 0 ? (
          <View style={styles.packageList}>
            {packages.map((item, index) => (
              <Pressable
                key={item.identifier}
                onPress={() => void buyPackage(index)}
                style={({ pressed }) => [styles.package, pressed && styles.packagePressed]}
              >
                <View>
                  <Text style={styles.packageName}>{item.product.title}</Text>
                  <Text style={styles.packageDetail}>{item.product.description}</Text>
                </View>
                <Text style={styles.packagePrice}>{item.product.priceString}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.storePending}>
            <Ionicons name="construct-outline" size={20} color={colors.signal} />
            <Text style={styles.storePendingText}>
              Galaxy subscriptions appear here after the Seller Portal and RevenueCat API key are connected.
            </Text>
          </View>
        )}

        {isConfigured ? (
          <Pressable
            onPress={() => void restore().catch(() => Alert.alert("Restore failed", "Try again shortly."))}
            style={styles.restore}
          >
            <Text style={styles.restoreText}>RESTORE PURCHASES</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>STORAGE</Text>
      <View style={styles.storageCard}>
        <View>
          <Text style={styles.storageNumber}>{documents.length.toString().padStart(2, "0")}</Text>
          <Text style={styles.storageLabel}>ENCRYPTED DOCUMENTS</Text>
        </View>
        <View style={styles.storageIcon}>
          <Ionicons name="phone-portrait-outline" size={27} color={colors.forest} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.brand}>Pocketproof</Text>
        <Text style={styles.version}>ANDROID · SHIPATON 2026 · VERSION 1.0.0</Text>
      </View>
    </Screen>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  trailing: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={21} color={colors.forest} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.rust,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.6,
    marginTop: 10,
    marginBottom: 10,
  },
  panel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule, marginBottom: 26 },
  row: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 15, paddingVertical: 13 },
  rowIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.forestSoft, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowDetail: { color: colors.inkMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.rule, marginHorizontal: 15 },
  onLabel: { color: colors.forest, fontFamily: typography.label, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  proCard: { backgroundColor: colors.forest, padding: 22, borderRadius: 5, marginBottom: 27, overflow: "hidden" },
  proMark: { position: "absolute", right: -10, top: -13, minWidth: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: "#648271", alignItems: "center", justifyContent: "center", transform: [{ rotate: "8deg" }] },
  proMarkText: { color: colors.signal, fontFamily: typography.label, fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  proEyebrow: { color: colors.signal, fontFamily: typography.label, fontWeight: "800", fontSize: 10, letterSpacing: 1.5 },
  proTitle: { color: colors.white, fontFamily: typography.display, fontSize: 29, lineHeight: 34, fontWeight: "700", maxWidth: 300, marginTop: 14 },
  proCopy: { color: colors.forestSoft, fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 480 },
  activePlan: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 20 },
  activePlanText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  packageList: { gap: 9, marginTop: 19 },
  package: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.signal },
  packagePressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  packageName: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  packageDetail: { color: colors.inkMuted, fontSize: 10, marginTop: 2, maxWidth: 220 },
  packagePrice: { color: colors.forest, fontFamily: typography.label, fontWeight: "800", fontSize: 14 },
  storePending: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 13, marginTop: 19, borderWidth: 1, borderColor: "#648271" },
  storePendingText: { flex: 1, color: colors.forestSoft, fontSize: 11, lineHeight: 17 },
  restore: { alignSelf: "center", padding: 12, marginTop: 8 },
  restoreText: { color: colors.signal, fontFamily: typography.label, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  storageCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule },
  storageNumber: { color: colors.ink, fontFamily: typography.display, fontSize: 38, fontWeight: "700" },
  storageLabel: { color: colors.inkMuted, fontFamily: typography.label, fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 2 },
  storageIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.forestSoft, alignItems: "center", justifyContent: "center" },
  footer: { alignItems: "center", borderTopWidth: 1, borderColor: colors.rule, paddingTop: 26, marginTop: 35 },
  brand: { color: colors.ink, fontFamily: typography.display, fontSize: 22, fontWeight: "700" },
  version: { color: colors.inkMuted, fontFamily: typography.label, fontSize: 8, letterSpacing: 1, marginTop: 5 },
});
