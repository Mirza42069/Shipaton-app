import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { colors, typography } from "@/lib/theme";

const sections = [
  {
    title: "What Pocketproof stores",
    copy: "Documents, scans, names, categories, private notes, and expiry dates are stored only in Pocketproof's private app storage on your Android device.",
  },
  {
    title: "Encryption",
    copy: "Document files use AES-256-GCM encryption. Vault metadata uses SQLCipher. The encryption key is protected by Android Keystore and is not uploaded by Pocketproof.",
  },
  {
    title: "Purchases",
    copy: "If you use Pocketproof Pro, Samsung Galaxy Store and RevenueCat process purchase identifiers and subscription status. Pocketproof never receives your payment-card details or document contents.",
  },
  {
    title: "Reminders",
    copy: "Expiry reminders are scheduled locally through Android notifications. No reminder content is sent to a Pocketproof server.",
  },
  {
    title: "Deletion and retention",
    copy: "A document remains on this device until you delete it or remove the app's data. Deleting a vault item permanently removes its encrypted file and scheduled reminder.",
  },
  {
    title: "Permissions",
    copy: "Camera access is used only when you choose Scan paper. File access is handled through Android's system picker. Biometrics are used only when you enable Biometric lock.",
  },
];

export default function PrivacyScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>PRIVACY POLICY · AUGUST 11, 2026</Text>
      <Text style={styles.title}>Your documents are not our data.</Text>
      <Text style={styles.intro}>
        Pocketproof is local-first. It has no document account, no document server, no advertising, and no analytics tracker.
      </Text>

      {sections.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
          <View style={styles.copyBlock}>
            <Text style={styles.heading}>{section.title}</Text>
            <Text style={styles.copy}>{section.copy}</Text>
          </View>
        </View>
      ))}

      <View style={styles.contact}>
        <Text style={styles.contactLabel}>PRIVACY CONTACT</Text>
        <Text style={styles.contactValue}>support@pocketproof.app</Text>
        <Text style={styles.contactNote}>Replace this address with the final support inbox before store submission.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.rust, fontFamily: typography.label, fontWeight: "800", fontSize: 10, letterSpacing: 1.4 },
  title: { color: colors.ink, fontFamily: typography.display, fontWeight: "700", fontSize: 38, lineHeight: 43, letterSpacing: -1.1, marginTop: 12 },
  intro: { color: colors.inkMuted, fontSize: 15, lineHeight: 23, marginTop: 15, marginBottom: 28, maxWidth: 600 },
  section: { flexDirection: "row", gap: 17, borderTopWidth: 1, borderColor: colors.rule, paddingVertical: 21 },
  number: { color: colors.rust, fontFamily: typography.label, fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  copyBlock: { flex: 1 },
  heading: { color: colors.ink, fontFamily: typography.display, fontSize: 21, fontWeight: "700" },
  copy: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 620 },
  contact: { backgroundColor: colors.forest, padding: 20, marginTop: 13 },
  contactLabel: { color: colors.signal, fontFamily: typography.label, fontWeight: "800", fontSize: 9, letterSpacing: 1.4 },
  contactValue: { color: colors.white, fontSize: 15, fontWeight: "700", marginTop: 8 },
  contactNote: { color: colors.forestSoft, fontSize: 10, lineHeight: 15, marginTop: 7 },
});
