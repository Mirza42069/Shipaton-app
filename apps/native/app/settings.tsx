import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Divider,
  Portal,
  ProgressBar,
  Switch,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";

import { AppIcon, type AppIconName, appIconSource } from "@/components/app-icon";
import { ActionButton, MaterialCard, PageHeader, Screen } from "@/components/screen";
import { useDriveSync } from "@/contexts/drive-sync-context";
import { usePurchases } from "@/contexts/purchases-context";
import { useSecurity } from "@/contexts/security-context";
import { useVault } from "@/contexts/vault-context";
import { FREE_DOCUMENT_LIMIT } from "@/lib/access-policy";
import {
  formatDriveRecoveryKey,
  getDriveRecoveryKeyHex,
  getOrCreateDriveRecoveryKeyHex,
  isValidDriveRecoveryKey,
  normalizeDriveRecoveryKey,
  setDriveRecoveryKeyHex,
} from "@/lib/drive-recovery-key";
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
  const { isPro } = usePurchases();
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [recoveryKeyDraft, setRecoveryKeyDraft] = useState("");
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [isReplacingRecoveryKey, setIsReplacingRecoveryKey] = useState(false);

  useEffect(() => {
    void getDriveRecoveryKeyHex().then(setRecoveryKey);
  }, []);

  async function copyRecoveryKey() {
    if (!recoveryKey) return;
    const formatted = formatDriveRecoveryKey(recoveryKey);
    await Clipboard.setStringAsync(formatted);
    setShowRecoveryKey(false);
    Alert.alert("Recovery key copied", "Store it in a password manager. The clipboard clears in one minute.");
    setTimeout(() => {
      void Clipboard.getStringAsync().then((current) => {
        if (current === formatted) void Clipboard.setStringAsync("");
      });
    }, 60_000);
  }

  function promptRecoveryKeySetup() {
    Alert.alert(
      "Set up encrypted backup",
      "Create a key for a new backup, or enter the key from another device to restore an existing backup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enter existing key",
          onPress: () => {
            setRecoveryKeyDraft("");
            setIsReplacingRecoveryKey(false);
            setShowRecoveryKey(true);
          },
        },
        {
          text: "Create new key",
          onPress: () =>
            void getOrCreateDriveRecoveryKeyHex().then((key) => {
              setRecoveryKey(key);
              setRecoveryKeyDraft(formatDriveRecoveryKey(key));
              setIsReplacingRecoveryKey(false);
              setShowRecoveryKey(true);
              Alert.alert(
                "Recovery key created",
                "Save this key in a password manager. Berkas and Google cannot recover it for you.",
              );
            }),
        },
      ],
    );
  }

  async function toggleBiometric(enabled: boolean) {
    if (!(await setBiometricEnabled(enabled))) {
      Alert.alert(
        "Biometric lock unavailable",
        "Set up a fingerprint or secure device credential in Android Settings first.",
      );
    }
  }

  async function confirmDriveConnect() {
    if (!recoveryKey) {
      promptRecoveryKeySetup();
      return;
    }
    Alert.alert(
      "Encrypted Google Drive backup",
      "Berkas encrypts document contents, filenames, titles, and notes before upload. Keep your recovery key safe so another device can restore them.",
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
            <AppIcon name={isPro ? "member" : "leaf"} size={24} color={colors.forestDark} />
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
          Unlimited local documents plus optional end-to-end encrypted Google Drive backup.
        </Text>

        {!isPro ? (
          <ProgressBar
            progress={Math.min(documents.length / FREE_DOCUMENT_LIMIT, 1)}
            color={colors.forest}
            style={styles.planProgress}
            accessibilityLabel={`${documents.length} of ${FREE_DOCUMENT_LIMIT} free vault documents used`}
          />
        ) : null}

        <View style={styles.proAction}>
          <ActionButton
            variant={isPro ? "secondary" : "primary"}
            icon={isPro ? "check-circle" : "upgrade"}
            onPress={() => router.push("/paywall")}
          >
            {isPro ? "View Pro access" : "Explore Berkas Pro"}
          </ActionButton>
        </View>
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
              {account ? account.email : "Optional encrypted backup"}
            </Text>
            <Text variant="bodySmall" style={styles.driveDetail}>
              {account
                ? !isPro
                  ? "Sync is paused. Local and Drive copies remain available."
                  : syncStatus === "syncing"
                    ? "Syncing encrypted files with Google Drive..."
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
            <Text style={styles.driveWarningTitle}>End-to-end encrypted</Text>
            <Text style={styles.driveWarningText}>
              Files, names, and sync metadata are encrypted before upload. Keep your recovery key safe.
            </Text>
          </View>
        </View>

        {syncError ? (
          <View style={styles.errorRow} accessible accessibilityRole="alert">
            <AppIcon name="alert" size={18} color={colors.rust} />
            <Text style={styles.driveError}>{syncError}</Text>
          </View>
        ) : null}

        {!isPro && !account ? (
          <ActionButton icon="upgrade" onPress={() => router.push("/paywall")}>
            Unlock sync with Pro
          </ActionButton>
        ) : isPro && !account ? (
          <ActionButton onPress={() => void confirmDriveConnect()}>Connect Google Drive</ActionButton>
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

        {isPro ? (
          <Button
            mode="text"
            icon={appIconSource("key")}
            textColor={colors.forestDark}
            onPress={() => {
              if (!recoveryKey) {
                promptRecoveryKeySetup();
                return;
              }
              setRecoveryKeyDraft(recoveryKey ? formatDriveRecoveryKey(recoveryKey) : "");
              setIsReplacingRecoveryKey(false);
              setShowRecoveryKey(true);
            }}
            style={styles.recoveryButton}
          >
            {recoveryKey ? "View recovery key" : "Set up recovery key"}
          </Button>
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

      <Portal>
        <Dialog visible={showRecoveryKey} onDismiss={() => setShowRecoveryKey(false)} style={styles.recoveryDialog}>
          <Dialog.Title style={styles.recoveryTitle}>Drive recovery key</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.recoveryCopy}>
              This key encrypts your Drive backup. Store it in a password manager. Anyone with it can restore your backup.
            </Text>
            <TextInput
              mode="outlined"
              label="64-character recovery key"
              value={recoveryKeyDraft}
              onChangeText={setRecoveryKeyDraft}
              editable={!recoveryKey || isReplacingRecoveryKey}
              autoCapitalize="characters"
              autoCorrect={false}
              multiline
              style={styles.recoveryInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRecoveryKey(false)}>Cancel</Button>
            {recoveryKey && !isReplacingRecoveryKey ? (
              <Button
                onPress={() => {
                  Alert.alert(
                    "Use a different recovery key?",
                    "Only replace this key to restore a backup created with another key. Keep the current key if you may need its existing backups.",
                    [
                      { text: "Keep current key", style: "cancel" },
                      {
                        text: "Enter different key",
                        style: "destructive",
                        onPress: () => {
                          setRecoveryKeyDraft("");
                          setIsReplacingRecoveryKey(true);
                        },
                      },
                    ],
                  );
                }}
              >
                Use different key
              </Button>
            ) : null}
            {recoveryKey && !isReplacingRecoveryKey ? (
              <Button onPress={() => void copyRecoveryKey()}>Copy key</Button>
            ) : null}
            {!recoveryKey || isReplacingRecoveryKey ? (
              <Button
                disabled={syncStatus === "syncing" || !isValidDriveRecoveryKey(recoveryKeyDraft)}
                onPress={() =>
                  void setDriveRecoveryKeyHex(recoveryKeyDraft).then(() => {
                    const nextKey = normalizeDriveRecoveryKey(recoveryKeyDraft);
                    setRecoveryKey(nextKey);
                    setIsReplacingRecoveryKey(false);
                    setShowRecoveryKey(false);
                    Alert.alert("Recovery key saved", "Encrypted Drive backups can now be restored on this device.");
                  })
                }
              >
                Save
              </Button>
            ) : null}
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  proAction: { marginTop: spacing.xl },
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
  recoveryButton: { alignSelf: "center", marginTop: spacing.sm },
  recoveryDialog: { backgroundColor: colors.card, borderRadius: radii.lg },
  recoveryTitle: { color: colors.ink, fontFamily: typography.strong },
  recoveryCopy: { color: colors.inkMuted, fontFamily: typography.body, lineHeight: 20 },
  recoveryInput: { marginTop: spacing.lg, backgroundColor: colors.card, fontFamily: typography.medium },
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
