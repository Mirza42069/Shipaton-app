import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { IconButton, Surface, Text } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { DocumentCard } from "@/components/document-card";
import { EmptyVault } from "@/components/empty-vault";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { usePurchases } from "@/contexts/purchases-context";
import { useVault } from "@/contexts/vault-context";
import { daysUntil, expiryLabel } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { getDocumentKindDefinition, type VaultDocument } from "@/types/document";

export default function TodayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { documents } = useVault();
  const { isPro } = usePurchases();
  const wide = width >= 760;
  const needsAttention = documents
    .filter((item) => item.expiresAt && daysUntil(item.expiresAt) <= 90)
    .sort((left, right) => left.expiresAt!.localeCompare(right.expiresAt!));
  const attentionPreview = needsAttention.slice(0, wide ? 4 : 3);
  const overdueCount = needsAttention.filter((item) => daysUntil(item.expiresAt!) < 0).length;
  const recent = documents
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, wide ? 4 : 3);

  return (
    <Screen>
      <PageHeader
        title="Today"
        showSettings
      />

      {!isPro ? (
        <TouchableProCard onPress={() => router.push("/paywall")} />
      ) : null}

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
              <Text variant="headlineLarge" style={styles.attentionNumber}>{needsAttention.length}</Text>
              <Text variant="bodyMedium" style={styles.attentionCaption}>
                Need attention
              </Text>
            </View>
          </View>
        </View>
      </MaterialCard>

      {attentionPreview.length > 0 ? (
        <>
          <SectionHeading
            title="Needs attention"
            detail={overdueCount > 0
              ? `${overdueCount} overdue · ${needsAttention.length - overdueCount} due within 90 days`
              : `${needsAttention.length} due within 90 days`}
          />
          <MaterialCard style={styles.attentionList}>
            {attentionPreview.map((document, index) => (
              <AttentionRow
                key={document.id}
                document={document}
                divided={index > 0}
                onPress={() => router.push({ pathname: "/document/[id]", params: { id: document.id } })}
              />
            ))}
          </MaterialCard>
        </>
      ) : null}

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

function AttentionRow({
  document,
  divided,
  onPress,
}: {
  document: VaultDocument;
  divided: boolean;
  onPress: () => void;
}) {
  const kind = getDocumentKindDefinition(document.kind);
  const expiry = expiryLabel(document.expiresAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${document.title}, ${expiry.label}`}
      accessibilityHint="Opens document details"
      android_ripple={{ color: colors.forestSoft }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.attentionRow,
        divided ? styles.attentionRowDivided : null,
        pressed ? styles.attentionRowPressed : null,
      ]}
    >
      <Surface elevation={0} style={styles.attentionRowIcon}>
        <AppIcon name={kind.icon} size={21} color={colors.forestDark} />
      </Surface>
      <View style={styles.attentionRowCopy}>
        <Text style={styles.attentionRowTitle} numberOfLines={1}>{document.title}</Text>
        <Text style={styles.attentionRowKind}>{kind.label}</Text>
      </View>
      <View style={expiry.tone === "danger" ? styles.dangerPill : styles.warningPill}>
        <Text style={expiry.tone === "danger" ? styles.dangerPillText : styles.warningPillText}>
          {expiry.label}
        </Text>
      </View>
      <AppIcon name="chevron-right" size={17} color={colors.inkMuted} />
    </Pressable>
  );
}

function TouchableProCard({ onPress }: { onPress: () => void }) {
  return (
    <MaterialCard style={styles.proCard}>
      <IconButton
        icon={appIconSource("upgrade")}
        size={21}
        mode="contained-tonal"
        accessibilityLabel="Explore Berkas Pro"
        onPress={onPress}
        style={styles.proIcon}
      />
      <View style={styles.proCopy}>
        <Text style={styles.proEyebrow}>BERKAS PRO</Text>
        <Text style={styles.proTitle}>Unlimited local vault</Text>
      </View>
      <IconButton
        icon={appIconSource("next")}
        size={19}
        accessibilityLabel="Open Berkas Pro"
        onPress={onPress}
        style={styles.proNext}
      />
    </MaterialCard>
  );
}

const styles = StyleSheet.create({
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: -spacing.lg,
    marginBottom: spacing.xxl,
    backgroundColor: colors.forestDark,
    borderColor: colors.forestDark,
  },
  proIcon: { margin: 0, backgroundColor: colors.signal },
  proCopy: { flex: 1, paddingVertical: spacing.sm },
  proEyebrow: { color: "#BED8AE", fontFamily: typography.extraBold, fontSize: 9, letterSpacing: 1 },
  proTitle: { color: colors.white, fontFamily: typography.strong, fontSize: 14, marginTop: 2 },
  proNext: { margin: 0 },
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
  attentionList: { marginBottom: spacing.xxxl },
  attentionRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  attentionRowDivided: { borderTopWidth: 1, borderTopColor: colors.rule },
  attentionRowPressed: { backgroundColor: colors.surface },
  attentionRowIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
  },
  attentionRowCopy: { flex: 1, minWidth: 0 },
  attentionRowTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  attentionRowKind: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, marginTop: 2 },
  dangerPill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.rustSoft },
  dangerPillText: { color: colors.rust, fontFamily: typography.label, fontSize: 10 },
  warningPill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.warningSoft },
  warningPillText: { color: colors.warning, fontFamily: typography.label, fontSize: 10 },
  seeAllButton: { margin: 0 },
  documentGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.sm },
  documentCell: { width: "100%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  documentCellWide: { width: "50%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
});
