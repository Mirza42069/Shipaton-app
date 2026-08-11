import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { DocumentCard } from "@/components/document-card";
import { EmptyVault } from "@/components/empty-vault";
import { PageHeader, Screen } from "@/components/screen";
import { useVault } from "@/contexts/vault-context";
import { daysUntil } from "@/lib/date";
import { colors, typography } from "@/lib/theme";

export default function TodayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { documents } = useVault();
  const wide = width >= 760;
  const expiring = documents.filter((item) => {
    if (!item.expiresAt) return false;
    const days = daysUntil(item.expiresAt);
    return days >= 0 && days <= 90;
  });
  const recent = documents.slice(0, wide ? 4 : 3);

  return (
    <Screen>
      <PageHeader
        eyebrow="POCKETPROOF / LOCAL VAULT"
        title="Keep proof close."
        detail="The papers you cannot afford to lose, encrypted and ready when life asks for them."
        action={
          <Pressable
            accessibilityLabel="Add document"
            onPress={() => router.push("/add")}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={28} color={colors.signal} />
          </Pressable>
        }
      />

      <View style={[styles.summary, wide ? styles.summaryWide : null]}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>VAULT STATUS</Text>
          <Text style={styles.summaryNumber}>{documents.length.toString().padStart(2, "0")}</Text>
          <Text style={styles.summaryCaption}>documents secured on this device</Text>
        </View>
        <View style={styles.summaryRule} />
        <View style={styles.attentionBlock}>
          <View style={styles.attentionIcon}>
            <Ionicons name="time-outline" size={22} color={colors.signal} />
          </View>
          <Text style={styles.attentionNumber}>{expiring.length}</Text>
          <Text style={styles.attentionCaption}>need attention within 90 days</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionEyebrow}>QUICK ACCESS</Text>
          <Text style={styles.sectionTitle}>Recently handled</Text>
        </View>
        {documents.length > 0 ? (
          <Pressable onPress={() => router.push("/(tabs)/vault")} hitSlop={10}>
            <Text style={styles.seeAll}>SEE ALL →</Text>
          </Pressable>
        ) : null}
      </View>

      {recent.length === 0 ? (
        <EmptyVault />
      ) : (
        <View style={[styles.documentGrid, wide ? styles.documentGridWide : null]}>
          {recent.map((document) => (
            <View key={document.id} style={wide ? styles.documentCellWide : null}>
              <DocumentCard document={document} compact />
            </View>
          ))}
        </View>
      )}

      <View style={styles.privacyStrip}>
        <Ionicons name="shield-checkmark-outline" size={23} color={colors.forest} />
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>No document cloud. No account.</Text>
          <Text style={styles.privacyBody}>Files and metadata stay encrypted on this phone.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  summary: {
    backgroundColor: colors.forest,
    borderRadius: 5,
    padding: 22,
    marginBottom: 35,
  },
  summaryWide: { flexDirection: "row", alignItems: "stretch" },
  summaryMain: { flex: 1 },
  summaryLabel: {
    color: colors.signal,
    fontFamily: typography.label,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  summaryNumber: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 66,
    lineHeight: 72,
    fontWeight: "700",
    marginTop: 12,
  },
  summaryCaption: { color: colors.forestSoft, fontSize: 13, marginTop: 1 },
  summaryRule: { height: 1, backgroundColor: "#557563", marginVertical: 20 },
  attentionBlock: { flex: 1, justifyContent: "center" },
  attentionIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  attentionNumber: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 34,
    fontWeight: "700",
    marginTop: 12,
  },
  attentionCaption: { color: colors.forestSoft, fontSize: 13, marginTop: 3 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 23,
  },
  sectionEyebrow: {
    color: colors.rust,
    fontFamily: typography.label,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 27,
    fontWeight: "700",
    marginTop: 5,
  },
  seeAll: {
    color: colors.forest,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  documentGrid: { gap: 21 },
  documentGridWide: { flexDirection: "row", flexWrap: "wrap" },
  documentCellWide: { width: "48.5%" },
  privacyStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderTopWidth: 1,
    borderColor: colors.rule,
    marginTop: 34,
    paddingTop: 20,
  },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  privacyBody: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
});
