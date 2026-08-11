import { useRouter } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { IconButton, Text } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { DocumentCard } from "@/components/document-card";
import { EmptyVault } from "@/components/empty-vault";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useVault } from "@/contexts/vault-context";
import { daysUntil } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";

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
        title="Today"
        showSettings
      />

      <MaterialCard style={[styles.summary, wide ? styles.summaryWide : null]}>
        <View style={styles.summaryMain}>
          <View style={styles.summaryIcon}>
            <AppIcon name="shield" size={23} color={colors.forestDark} />
          </View>
          <View style={styles.summaryCopy}>
            <View style={styles.metricRow}>
              <Text variant="displayMedium" style={styles.summaryNumber}>
                {documents.length.toString().padStart(2, "0")}
              </Text>
              <Text variant="bodyMedium" style={styles.summaryCaption}>
                Documents
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.summaryRule, wide ? styles.summaryRuleWide : null]} />
        <View style={styles.attentionBlock}>
          <View style={styles.attentionIcon}>
            <AppIcon name="clock" size={22} color={colors.warning} />
          </View>
          <View style={styles.summaryCopy}>
            <View style={styles.metricRow}>
              <Text variant="headlineLarge" style={styles.attentionNumber}>{expiring.length}</Text>
              <Text variant="bodyMedium" style={styles.attentionCaption}>
                Expiring in 90 days
              </Text>
            </View>
          </View>
        </View>
      </MaterialCard>

      <SectionHeading
        title="Recent"
        action={documents.length > 0 ? (
          <IconButton
            icon={appIconSource("next")}
            size={21}
            accessibilityLabel="View all documents"
            onPress={() => router.push("/(tabs)/vault")}
            style={styles.seeAllButton}
          />
        ) : undefined}
      />

      {recent.length === 0 ? (
        <EmptyVault />
      ) : (
        <View style={styles.documentGrid}>
          {recent.map((document) => (
            <View key={document.id} style={wide ? styles.documentCellWide : styles.documentCell}>
              <DocumentCard document={document} compact />
            </View>
          ))}
        </View>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  summaryWide: { flexDirection: "row", alignItems: "center" },
  summaryMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: { flex: 1 },
  metricRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md, marginTop: spacing.xs },
  summaryNumber: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 48,
    lineHeight: 52,
  },
  summaryCaption: { color: colors.inkMuted, lineHeight: 18, paddingBottom: 4 },
  summaryRule: { height: 1, backgroundColor: colors.rule, marginVertical: spacing.xl },
  summaryRuleWide: { width: 1, height: 72, marginVertical: 0, marginHorizontal: spacing.xxl },
  attentionBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  attentionIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  attentionNumber: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 38,
    lineHeight: 44,
  },
  attentionCaption: { color: colors.inkMuted, lineHeight: 18, paddingBottom: 2 },
  seeAllButton: { margin: 0 },
  documentGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.sm },
  documentCell: { width: "100%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  documentCellWide: { width: "50%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
});
