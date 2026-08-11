import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Divider, ProgressBar, Switch, Text, TouchableRipple } from "react-native-paper";

import { AppIcon, type AppIconName } from "@/components/app-icon";
import { ActionButton, MaterialCard, PageHeader, Screen } from "@/components/screen";
import { useDriveSync } from "@/contexts/drive-sync-context";
import { usePurchases } from "@/contexts/purchases-context";
import { useSecurity } from "@/contexts/security-context";
import { useVault } from "@/contexts/vault-context";
import { FREE_DOCUMENT_LIMIT } from "@/lib/access-policy";
import { colors, radii, spacing, typography } from "@/lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { documents } = useVault();
  const {
    account,
    status: syncStatus,
    lastReport,
    error: syncError,
    connect,
    syncNow,
    disconnect,
    openDriveFolder,
  } = useDriveSync();
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

  function confirmDriveConnect() {
    Alert.alert(
      "Readable Google Drive copies",
      "Berkas will upload normal PDFs and images to a visible Berkas folder. These cloud copies use Google Drive security, not the local Berkas vault encryption.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            void connect().catch((error) =>
              Alert.alert(
                "Could not connect Drive",
                error instanceof Error ? error.message : "Google sign-in failed.",
              ),
            ),
        },
      ],
    );
  }

  return (
    <Screen>
      <PageHeader title="Settings" />

      <MaterialCard style={styles.guideCard}>
        <SettingRow
          icon="book"
          title="Berkas Guide"
          trailing={<AppIcon name="chevron-right" size={21} color={colors.inkMuted} />}
          onPress={() => router.push("/guide")}
          accessibilityHint="Opens the Berkas Guide"
        />
      </MaterialCard>

      <SectionLabel>Security</SectionLabel>
      <MaterialCard style={styles.groupCard}>
        <SettingRow
          icon="biometric"
          title="Biometric lock"
          detail="Lock when Berkas leaves the foreground."
          trailing={
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => void toggleBiometric(value)}
              color={colors.forest}
              accessibilityLabel="Biometric lock"
              accessibilityHint="Locks Berkas when it leaves the foreground"
            />
          }
        />
        <Divider style={styles.divider} />
        <SettingRow
          icon="hidden"
          title="Screen protection"
          detail="Screenshots and recent-app previews are blocked."
          trailing={
            <View style={styles.statusPill} accessible accessibilityLabel="Screen protection always on">
              <AppIcon name="shield" size={14} color={colors.forestDark} />
              <Text style={styles.statusPillText}>Always on</Text>
            </View>
          }
        />
        <Divider style={styles.divider} />
        <SettingRow
          icon="document"
          title="Privacy policy"
          trailing={<AppIcon name="chevron-right" size={21} color={colors.inkMuted} />}
          onPress={() => router.push("/privacy")}
          accessibilityHint="Opens the privacy policy"
        />
      </MaterialCard>

      <SectionLabel>Berkas Pro</SectionLabel>
      <MaterialCard style={styles.proCard}>
        <View style={styles.proHeader}>
          <View style={styles.proIcon}>
            <AppIcon name={isPro ? "sparkles" : "leaf"} size={24} color={colors.forestDark} />
          </View>
          <View style={styles.proHeaderCopy}>
            <Text style={styles.proEyebrow}>{isPro ? "PRO VAULT ACTIVE" : "FREE VAULT"}</Text>
            <Text variant="headlineSmall" style={styles.proTitle} accessibilityRole="header">
              {isPro ? "No limits. Just safekeeping." : "Make the vault unlimited."}
            </Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {isPro ? "PRO" : `${documents.length}/${FREE_DOCUMENT_LIMIT}`}
            </Text>
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.proCopy}>
          Unlimited local documents plus optional Google Drive sync for readable backup copies.
        </Text>

        {!isPro ? (
          <ProgressBar
            progress={Math.min(documents.length / FREE_DOCUMENT_LIMIT, 1)}
            color={colors.forest}
            style={styles.planProgress}
            accessibilityLabel={`${documents.length} of ${FREE_DOCUMENT_LIMIT} free vault documents used`}
          />
        ) : null}

        {!isPro && isConfigured && packages.length > 0 ? (
          <View style={styles.packageList}>
            {packages.map((item, index) => (
              <TouchableRipple
                key={item.identifier}
                onPress={() => void buyPackage(index)}
                borderless
                accessibilityRole="button"
                accessibilityLabel={`Purchase ${item.product.title} for ${item.product.priceString}`}
                accessibilityHint={item.product.description}
                style={styles.package}
              >
                <View style={styles.packageContent}>
                  <View style={styles.packageCopy}>
                    <Text style={styles.packageName}>{item.product.title}</Text>
                    <Text style={styles.packageDetail}>{item.product.description}</Text>
                  </View>
                  <Text style={styles.packagePrice}>{item.product.priceString}</Text>
                </View>
              </TouchableRipple>
            ))}
          </View>
        ) : !isPro ? (
          <View style={styles.storePending}>
            <AppIcon name="tools" size={20} color={colors.forest} />
            <Text style={styles.storePendingText}>
              Galaxy subscriptions appear here after Seller Portal and RevenueCat are connected.
            </Text>
          </View>
        ) : null}

        {isConfigured ? (
          <Button
            mode="text"
            onPress={() => void restore().catch(() => Alert.alert("Restore failed", "Try again shortly."))}
            textColor={colors.forestDark}
            accessibilityHint="Restores purchases linked to your store account"
            style={styles.textButton}
          >
            Restore purchases
          </Button>
        ) : null}
      </MaterialCard>

      <SectionLabel>Google Drive sync</SectionLabel>
      <MaterialCard style={styles.driveCard}>
        <View style={styles.driveHeader}>
          <View style={styles.driveIcon}>
            {syncStatus === "syncing" ? (
              <ActivityIndicator size={22} color={colors.forest} accessibilityLabel="Google Drive sync in progress" />
            ) : (
              <AppIcon name="cloud" size={24} color={colors.forest} />
            )}
          </View>
          <View style={styles.driveCopy}>
            <Text variant="titleMedium" style={styles.driveTitle}>
              {account ? account.email : "Optional cloud copies"}
            </Text>
            <Text variant="bodySmall" style={styles.driveDetail}>
              {account
                ? !isPro
                  ? "Sync is paused. Local and Drive copies remain available."
                  : syncStatus === "syncing"
                    ? "Syncing readable files with Google Drive..."
                    : lastReport
                      ? `Last synced ${new Date(lastReport.lastSyncedAt).toLocaleString()}`
                      : "Connected. Sync when you are ready."
                : isPro
                  ? "Sign in only if you want Drive sync. Pro works locally without an account."
                  : "Included with Berkas Pro. Free storage remains local and account-free."}
            </Text>
          </View>
        </View>

        <View style={styles.driveWarning} accessible accessibilityRole="alert">
          <AppIcon name="info" size={20} color={colors.warning} />
          <View style={styles.driveWarningCopy}>
            <Text style={styles.driveWarningTitle}>Readable cloud copies</Text>
            <Text style={styles.driveWarningText}>
              Drive copies are readable PDFs and images, not end-to-end encrypted Berkas files.
            </Text>
          </View>
        </View>

        {syncError ? (
          <View style={styles.errorRow} accessible accessibilityRole="alert">
            <AppIcon name="alert" size={18} color={colors.rust} />
            <Text style={styles.driveError}>{syncError}</Text>
          </View>
        ) : null}

        {isPro && !account ? (
          <ActionButton onPress={confirmDriveConnect}>Connect Google Drive</ActionButton>
        ) : account ? (
          <View style={styles.driveActions}>
            {isPro ? (
              <ActionButton
                onPress={() =>
                  void syncNow().catch((error) =>
                    Alert.alert("Sync failed", error instanceof Error ? error.message : "Try again."),
                  )
                }
                disabled={syncStatus === "syncing"}
              >
                {syncStatus === "syncing" ? "Syncing" : "Sync now"}
              </ActionButton>
            ) : null}
            <ActionButton
              variant="secondary"
              onPress={() =>
                void openDriveFolder().catch((error) =>
                  Alert.alert("Drive unavailable", error instanceof Error ? error.message : "Sync first."),
                )
              }
            >
              Open Drive folder
            </ActionButton>
            <Button
              mode="text"
              onPress={() => void disconnect()}
              textColor={colors.rust}
              accessibilityHint="Disconnects the current Google account without deleting local or Drive copies"
            >
              Disconnect Google account
            </Button>
          </View>
        ) : null}
      </MaterialCard>

      <SectionLabel>Storage</SectionLabel>
      <MaterialCard style={styles.storageCard}>
        <View style={styles.storageIcon}>
          <AppIcon name="phone" size={25} color={colors.forest} />
        </View>
        <View style={styles.storageCopy}>
          <Text variant="titleMedium" style={styles.storageTitle}>On this device</Text>
          <Text variant="bodySmall" style={styles.storageDetail}>Encrypted local vault storage</Text>
        </View>
        <View style={styles.storageCount} accessible accessibilityLabel={`${documents.length} encrypted documents`}>
          <Text style={styles.storageNumber}>{documents.length}</Text>
          <Text style={styles.storageLabel}>documents</Text>
        </View>
      </MaterialCard>

      <View style={styles.footer}>
        <Text style={styles.brand}>Berkas</Text>
        <Text style={styles.version}>Android · Shipaton 2026 · Version 1.0.0</Text>
      </View>
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="titleSmall" style={styles.sectionLabel} accessibilityRole="header">
      {children}
    </Text>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  trailing,
  onPress,
  accessibilityHint,
}: {
  icon: AppIconName;
  title: string;
  detail?: string;
  trailing: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <AppIcon name={icon} size={21} color={colors.forest} />
      </View>
      <View style={styles.rowCopy}>
        <Text variant="titleMedium" style={styles.rowTitle}>{title}</Text>
        {detail ? <Text variant="bodySmall" style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  guideCard: {
    marginBottom: spacing.xxxl,
    backgroundColor: colors.signal,
    borderColor: colors.forest,
  },
  sectionLabel: {
    color: colors.forestDark,
    fontFamily: typography.strong,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  groupCard: {
    marginBottom: spacing.xxxl,
  },
  row: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontFamily: typography.strong },
  rowDetail: { color: colors.inkMuted, lineHeight: 18, marginTop: 3 },
  divider: { marginHorizontal: spacing.lg, backgroundColor: colors.rule },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.signal,
  },
  statusPillText: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 11 },
  proCard: {
    padding: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  proHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  proHeaderCopy: { flex: 1 },
  proEyebrow: {
    color: colors.forest,
    fontFamily: typography.label,
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  proTitle: { color: colors.ink, fontFamily: typography.strong, lineHeight: 28 },
  planBadge: { backgroundColor: colors.forestSoft, borderRadius: radii.full, paddingHorizontal: 11, paddingVertical: 7 },
  planBadgeText: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 11 },
  proCopy: { color: colors.inkMuted, lineHeight: 20, marginTop: spacing.lg },
  planProgress: { height: 7, borderRadius: radii.full, backgroundColor: colors.forestSoft, marginTop: spacing.lg },
  packageList: { gap: spacing.sm, marginTop: spacing.xl },
  package: { borderWidth: 1, borderColor: colors.rule, borderRadius: radii.md, overflow: "hidden" },
  packageContent: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  packageCopy: { flex: 1 },
  packageName: { color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  packageDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  packagePrice: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 14 },
  storePending: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  storePendingText: { flex: 1, color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  textButton: { alignSelf: "center", marginTop: spacing.sm },
  driveCard: { padding: spacing.xl, marginBottom: spacing.xxxl },
  driveHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driveIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driveCopy: { flex: 1 },
  driveTitle: { color: colors.ink, fontFamily: typography.strong },
  driveDetail: { color: colors.inkMuted, lineHeight: 18, marginTop: 3 },
  driveWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.xl,
  },
  driveWarningCopy: { flex: 1 },
  driveWarningTitle: { color: colors.warning, fontFamily: typography.strong, fontSize: 12 },
  driveWarningText: { color: colors.warning, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 2 },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.lg },
  driveError: { flex: 1, color: colors.rust, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  driveActions: { gap: spacing.sm },
  storageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  storageIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  storageCopy: { flex: 1, marginLeft: spacing.md },
  storageTitle: { color: colors.ink, fontFamily: typography.strong },
  storageDetail: { color: colors.inkMuted, marginTop: 2 },
  storageCount: { alignItems: "flex-end" },
  storageNumber: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 26, lineHeight: 30 },
  storageLabel: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11 },
  footer: { alignItems: "center", paddingTop: spacing.xxxl, marginTop: spacing.xl },
  brand: { color: colors.ink, fontFamily: typography.strong, fontSize: 20 },
  version: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: spacing.xs },
});
