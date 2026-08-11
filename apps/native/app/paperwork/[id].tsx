import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Chip, ProgressBar, Text, TouchableRipple } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { ActionButton, MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { usePaperwork } from "@/contexts/paperwork-context";
import { useVault } from "@/contexts/vault-context";
import { colors, radii, spacing, typography } from "@/lib/theme";
import type { PaperworkRequirement } from "@/types/paperwork";

export default function PaperworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { runs, isLoading, deleteRun } = usePaperwork();
  const { documents } = useVault();
  const run = runs.find((item) => item.id === id);

  if (isLoading) {
    return (
      <View accessibilityLabel="Loading plan" style={styles.loading}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  if (!run) {
    return (
      <Screen>
        <PageHeader eyebrow="PLAN NOT FOUND" title="Plan unavailable" />
        <ActionButton onPress={() => router.replace("/(tabs)/paperwork")}>Back to plans</ActionButton>
      </Screen>
    );
  }

  const runId = run.id;
  const linked = run.requirements.filter((item) => item.documentId).length;
  const progress = run.requirements.length ? linked / run.requirements.length : 0;
  const progressPercent = Math.round(progress * 100);

  function confirmDelete() {
    Alert.alert(
      "Delete this plan?",
      "Plan links will be removed. Vault documents won't be deleted.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteRun(runId).then(() => router.replace("/(tabs)/paperwork")),
        },
      ],
    );
  }

  return (
    <Screen>
      <PageHeader eyebrow="ACTIVE PLAN" title={run.title} />

      <MaterialCard style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View style={styles.progressCopy}>
            <Text variant="displaySmall" style={styles.progressNumber}>
              {progressPercent}%
            </Text>
          </View>
          <Chip
            icon={appIconSource("check-circle")}
            style={styles.readyChip}
            textStyle={styles.readyChipText}
          >
            {linked} of {run.requirements.length} ready
          </Chip>
        </View>
        <ProgressBar
          accessibilityLabel={`${progressPercent}% complete`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
          progress={progress}
          color={colors.forest}
          style={styles.track}
        />
      </MaterialCard>

      <View style={styles.requirementsSection}>
        <SectionHeading title="Requirements" />
        <MaterialCard>
          {run.requirements.map((requirement, index) => {
            const document = documents.find((item) => item.id === requirement.documentId);
            return (
              <RequirementRow
                key={requirement.id}
                requirement={requirement}
                index={index}
                last={index === run.requirements.length - 1}
                documentTitle={document?.title ?? null}
                onPress={() =>
                  router.push({
                    pathname: "/link-document",
                    params: { runId: run.id, requirementId: requirement.id },
                  })
                }
              />
            );
          })}
        </MaterialCard>
      </View>

      <View style={styles.actions}>
        <ActionButton variant="secondary" icon="delete" onPress={confirmDelete}>
          Delete plan
        </ActionButton>
      </View>
    </Screen>
  );
}

function RequirementRow({
  requirement,
  index,
  last,
  documentTitle,
  onPress,
}: {
  requirement: PaperworkRequirement;
  index: number;
  last: boolean;
  documentTitle: string | null;
  onPress: () => void;
}) {
  const ready = Boolean(documentTitle);
  const proofLabel = documentTitle ?? `Add ${requirement.acceptedKinds.join(" or ")} proof`;

  return (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={`${requirement.label}, ${ready ? `linked to ${documentTitle}` : "not linked"}`}
      accessibilityState={{ selected: ready }}
      onPress={onPress}
      rippleColor={colors.forestSoft}
      style={!last ? styles.rowDivider : undefined}
    >
      <View style={styles.row}>
        <View style={[styles.number, ready ? styles.numberReady : null]}>
          {ready ? (
            <AppIcon name="check" size={19} color={colors.white} />
          ) : (
            <Text variant="labelMedium" style={styles.numberText}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          )}
        </View>
        <View style={styles.rowCopy}>
          <Text variant="titleMedium" style={styles.requirementLabel}>
            {requirement.label}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.documentTitle, ready ? styles.documentTitleReady : null]}
            numberOfLines={1}
          >
            {proofLabel}
          </Text>
        </View>
        <View style={styles.chevron}>
          <AppIcon name="chevron-right" size={19} color={colors.forest} />
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  progressCard: { padding: spacing.xxl, backgroundColor: colors.surface, marginBottom: spacing.xxxl },
  progressTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.lg,
  },
  progressCopy: { flex: 1, minWidth: 180 },
  progressNumber: {
    color: colors.forestDark,
    fontFamily: typography.extraBold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
  },
  readyChip: { backgroundColor: colors.signal },
  readyChipText: { color: colors.forestDark, fontFamily: typography.label },
  track: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.paperDeep,
    marginTop: spacing.xxl,
  },
  requirementsSection: { marginBottom: spacing.xxl },
  row: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.rule },
  number: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  numberReady: { backgroundColor: colors.forest, borderColor: colors.forest },
  numberText: { color: colors.inkMuted, fontFamily: typography.label },
  rowCopy: { flex: 1 },
  requirementLabel: { color: colors.ink, fontFamily: typography.strong, fontSize: 15 },
  documentTitle: { color: colors.inkMuted, marginTop: spacing.xs, textTransform: "capitalize" },
  documentTitleReady: { color: colors.forest, fontFamily: typography.label, textTransform: "none" },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { marginTop: spacing.xxl },
});
