import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View, useWindowDimensions } from "react-native";
import { ActivityIndicator, Chip, ProgressBar, Text, TouchableRipple } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { usePaperwork } from "@/contexts/paperwork-context";
import { PAPERWORK_TEMPLATES } from "@/lib/paperwork-templates";
import { colors, radii, spacing, typography } from "@/lib/theme";
import type { PaperworkRun, PaperworkTemplate } from "@/types/paperwork";

export default function PaperworkScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { runs, startRun } = usePaperwork();
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
  const columns = width >= 760 ? 2 : 1;

  async function createRun(template: PaperworkTemplate) {
    if (startingTemplateId) return;
    setStartingTemplateId(template.id);
    try {
      const id = await startRun(template);
      router.push(`/paperwork/${id}`);
    } catch {
      Alert.alert("Could not start plan", "Berkas could not save this checklist. Try again.");
    } finally {
      setStartingTemplateId(null);
    }
  }

  return (
    <Screen>
      <PageHeader title="Paperwork plans" showSettings />

      {runs.length ? (
        <View style={styles.section}>
          <SectionHeading title="In progress" />
          <View style={styles.grid}>
            {runs.map((run) => (
              <View key={run.id} style={columns > 1 ? styles.half : styles.full}>
                <RunCard run={run} onPress={() => router.push(`/paperwork/${run.id}`)} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <MaterialCard style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <AppIcon name="leaf" size={26} color={colors.forest} />
          </View>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No plans yet
          </Text>
        </MaterialCard>
      )}

      <View style={styles.section}>
        <SectionHeading title="Start a plan" />
        <View style={styles.grid}>
          {PAPERWORK_TEMPLATES.map((template) => (
            <View key={template.id} style={columns > 1 ? styles.half : styles.full}>
              <TemplateCard
                template={template}
                disabled={startingTemplateId !== null}
                loading={startingTemplateId === template.id}
                onPress={() => void createRun(template)}
              />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function RunCard({ run, onPress }: { run: PaperworkRun; onPress: () => void }) {
  const linked = run.requirements.filter((item) => item.documentId).length;
  const progress = run.requirements.length ? linked / run.requirements.length : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <MaterialCard style={styles.runCard}>
      <TouchableRipple
        accessibilityRole="button"
        accessibilityLabel={`${run.title}, ${linked} of ${run.requirements.length} requirements ready`}
        onPress={onPress}
        rippleColor={colors.forestSoft}
        style={styles.cardAction}
      >
        <View>
          <View style={styles.runTop}>
            <Chip
              compact
              icon={appIconSource("check-circle")}
              style={styles.progressChip}
              textStyle={styles.progressChipText}
            >
              {linked} of {run.requirements.length} ready
            </Chip>
            <View style={styles.arrowButton}>
              <AppIcon name="next" size={20} color={colors.forestDark} />
            </View>
          </View>
          <Text variant="titleLarge" style={styles.runTitle}>
            {run.title}
          </Text>
          <View style={styles.progressRow}>
            <ProgressBar
              accessibilityLabel={`${progressPercent}% complete`}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
              progress={progress}
              color={colors.forest}
              style={styles.track}
            />
            <Text variant="labelMedium" style={styles.progressPercent}>
              {progressPercent}%
            </Text>
          </View>
        </View>
      </TouchableRipple>
    </MaterialCard>
  );
}

function TemplateCard({
  template,
  disabled,
  loading,
  onPress,
}: {
  template: PaperworkTemplate;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <MaterialCard style={[styles.templateCard, disabled && !loading ? styles.disabled : null]}>
      <TouchableRipple
        accessibilityRole="button"
        accessibilityLabel={`Start ${template.title}, ${template.requirements.length} requirements`}
        accessibilityState={{ disabled, busy: loading }}
        disabled={disabled}
        onPress={onPress}
        rippleColor={colors.forestSoft}
        style={styles.cardAction}
      >
        <View style={styles.templateContent}>
          <View style={styles.templateIcon}>
            <AppIcon name={template.icon} size={24} color={colors.forest} />
          </View>
          <View style={styles.templateCopy}>
            <Text variant="titleMedium" style={styles.templateTitle}>
              {template.title}
            </Text>
            <Chip compact style={styles.requirementChip} textStyle={styles.requirementChipText}>
              {template.requirements.length} requirements
            </Chip>
          </View>
          {loading ? (
            <ActivityIndicator
              accessibilityLabel={`Starting ${template.title}`}
              size={22}
              color={colors.forest}
            />
          ) : (
            <AppIcon name="add" size={26} color={colors.forest} />
          )}
        </View>
      </TouchableRipple>
    </MaterialCard>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxxl },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.sm },
  full: { width: "100%", padding: spacing.sm },
  half: { width: "50%", padding: spacing.sm },
  runCard: { minHeight: 178 },
  cardAction: { flex: 1, minHeight: 48, padding: spacing.xl },
  runTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressChip: { backgroundColor: colors.forestSoft },
  progressChipText: { color: colors.forestDark, fontFamily: typography.label, fontSize: 11 },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  runTitle: {
    color: colors.ink,
    fontFamily: typography.strong,
    fontSize: 22,
    lineHeight: 29,
    marginTop: spacing.xxl,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xxl },
  track: { flex: 1, height: 8, borderRadius: radii.full, backgroundColor: colors.paperDeep },
  progressPercent: { color: colors.forestDark, fontFamily: typography.strong, minWidth: 35 },
  templateCard: { minHeight: 190 },
  templateContent: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  templateCopy: { flex: 1 },
  templateTitle: { color: colors.ink, fontFamily: typography.strong, lineHeight: 23 },
  requirementChip: { alignSelf: "flex-start", backgroundColor: colors.surface, marginTop: spacing.lg },
  requirementChipText: { color: colors.forestDark, fontFamily: typography.label, fontSize: 10 },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxxl,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { flex: 1, color: colors.ink, fontFamily: typography.strong },
  disabled: { opacity: 0.55 },
});
