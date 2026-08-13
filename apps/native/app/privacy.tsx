import { StyleSheet, View } from "react-native";
import { Divider, Text } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen } from "@/components/screen";
import { colors, radii, spacing, typography } from "@/lib/theme";

const sections = [
  {
    title: "What Berkas stores locally",
    copy: "Documents, scans, names, categories, private notes, and expiry dates use Berkas private app storage on your Android device.",
  },
  {
    title: "Encryption",
    copy: "Local document files use AES-256-GCM encryption. Vault metadata uses SQLCipher. The local key is protected by Android Keystore.",
  },
  {
    title: "Purchases",
    copy: "If you use Berkas Pro, Google Play and RevenueCat process purchase identifiers and entitlement status. Berkas never receives your payment-card details.",
  },
  {
    title: "Optional Google Drive sync",
    copy: "Pro users may connect Google Drive. Berkas encrypts document contents, filenames, titles, notes, and synchronization metadata on the device before upload. Google receives opaque Berkas backup files and cannot decrypt them.",
  },
  {
    title: "Processes",
    copy: "Process names, requirement checklists, completion status, and links to vault documents are encrypted in the local database. Process metadata is not currently included in Google Drive sync.",
  },
  {
    title: "Drive recovery key",
    copy: "Encrypted Drive backups use a recovery key stored in Android secure storage. Berkas has no account or server that can recover a lost key. Anyone with the key can restore the backup, so it should be kept in a password manager.",
  },
  {
    title: "Document scanning",
    copy: "The scanner uses Google ML Kit on the device. Google Play services may download scanner components and process technical diagnostics; Berkas does not upload scans unless you enable Drive sync.",
  },
  {
    title: "Reminders",
    copy: "Expiry reminders are scheduled locally through Android notifications. No reminder content is sent to a Berkas server.",
  },
  {
    title: "Deletion and retention",
    copy: "Deleting a vault item removes its encrypted local file and reminder. Its encrypted Drive backup moves to trash on the next sync. Disconnecting or losing Pro does not delete either copy.",
  },
  {
    title: "Permissions",
    copy: "Camera access is used only when you choose Scan paper. File access is handled through Android's system picker. Biometrics are used only when you enable Biometric lock.",
  },
];

export default function PrivacyScreen() {
  return (
    <Screen>
      <PageHeader
        eyebrow="PRIVACY POLICY · AUGUST 11, 2026"
        title="Your documents are not our data."
        detail="Berkas is local-first. Free storage needs no account, and optional Pro sync uses the Google account you choose."
      />

      <View style={styles.promise} accessible>
        <View style={styles.promiseMark} />
        <Text variant="titleMedium" style={styles.promiseText}>
          Stored locally. Encrypted at rest. Shared only when you choose.
        </Text>
      </View>

      <Text variant="titleSmall" style={styles.sectionLabel} accessibilityRole="header">
        How your data is handled
      </Text>
      <MaterialCard style={styles.policyCard}>
        {sections.map((section, index) => (
          <View key={section.title}>
            <View style={styles.policyRow} accessible>
              <View style={styles.numberBadge}>
                <Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <View style={styles.copyBlock}>
                <Text variant="titleMedium" style={styles.heading} accessibilityRole="header">
                  {section.title}
                </Text>
                <Text variant="bodyMedium" style={styles.copy}>{section.copy}</Text>
              </View>
            </View>
            {index < sections.length - 1 ? <Divider style={styles.divider} /> : null}
          </View>
        ))}
      </MaterialCard>

      <Text variant="titleSmall" style={styles.sectionLabel} accessibilityRole="header">
        Privacy contact
      </Text>
      <MaterialCard style={styles.contactCard}>
        <View style={styles.contactIcon}>
          <AppIcon name="help" size={20} color={colors.forestDark} />
        </View>
        <View style={styles.contactCopy}>
          <Text variant="titleMedium" style={styles.contactValue}>Google Play listing</Text>
          <Text variant="bodySmall" style={styles.contactNote}>
            The verified seller support address is published with the app listing.
          </Text>
        </View>
      </MaterialCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  promise: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.forestSoft,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  promiseMark: { width: 5, alignSelf: "stretch", borderRadius: radii.full, backgroundColor: colors.forest },
  promiseText: { flex: 1, color: colors.forestDark, fontFamily: typography.strong, lineHeight: 22 },
  sectionLabel: {
    color: colors.forestDark,
    fontFamily: typography.strong,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  policyCard: { marginBottom: spacing.xxxl },
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  number: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 11 },
  copyBlock: { flex: 1 },
  heading: { color: colors.ink, fontFamily: typography.strong },
  copy: { color: colors.inkMuted, fontFamily: typography.body, lineHeight: 21, marginTop: spacing.sm },
  divider: { marginHorizontal: spacing.lg, backgroundColor: colors.rule },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCopy: { flex: 1 },
  contactValue: { color: colors.ink, fontFamily: typography.strong },
  contactNote: { color: colors.inkMuted, lineHeight: 18, marginTop: 3 },
});
