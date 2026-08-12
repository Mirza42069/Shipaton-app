import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { ActivityIndicator, Button, ProgressBar, Text } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useProcesses } from "@/contexts/process-context";
import { PROCESS_TEMPLATES } from "@/lib/process-templates";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { processProgress, type ProcessTemplate, type VaultProcess } from "@/types/process";

export default function ProcessesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { processes, isLoading, startTemplate } = useProcesses();
  const [startingId, setStartingId] = useState<string | null>(null);
  const wide = width >= 760;
  const active = processes.filter((process) => !process.archivedAt);
  const archived = processes.filter((process) => process.archivedAt);

  async function start(template: ProcessTemplate) {
    if (startingId) return;
    setStartingId(template.id);
    try {
      const id = await startTemplate(template);
      router.push({ pathname: "/process/[id]", params: { id } });
    } catch (error) {
      Alert.alert("Process not started", error instanceof Error ? error.message : "Try again.");
    } finally {
      setStartingId(null);
    }
  }

  return (
    <Screen>
      <PageHeader title="Processes" showSettings />

      {isLoading ? (
        <View style={styles.loading} accessibilityLabel="Loading processes">
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : active.length ? (
        <View style={styles.section}>
          <SectionHeading title="In progress" detail={`${active.length} active`} />
          <View style={styles.grid}>
            {active.map((process) => (
              <View key={process.id} style={wide ? styles.half : styles.full}>
                <ProcessCard
                  process={process}
                  onPress={() => router.push({ pathname: "/process/[id]", params: { id: process.id } })}
                />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <MaterialCard style={styles.emptyCard}>
          <View style={styles.emptyIcon}><AppIcon name="check-circle" size={27} color={colors.forestDark} /></View>
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Turn paperwork into progress</Text>
            <Text style={styles.emptyDetail}>Start with a template or make a checklist for any process.</Text>
          </View>
        </MaterialCard>
      )}

      <View style={styles.section}>
        <SectionHeading title="Start a process" detail="Templates can be changed after you start" />
        <View style={styles.grid}>
          {PROCESS_TEMPLATES.map((template) => (
            <View key={template.id} style={wide ? styles.half : styles.full}>
              <TemplateCard
                template={template}
                loading={startingId === template.id}
                disabled={startingId !== null}
                onPress={() => void start(template)}
              />
            </View>
          ))}
          <View style={wide ? styles.half : styles.full}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create a custom process"
              onPress={() => router.push("/process/new")}
              style={({ pressed }) => [styles.customCard, pressed ? styles.pressed : null]}
            >
              <View style={styles.templateIcon}><AppIcon name="add" size={24} color={colors.forestDark} /></View>
              <View style={styles.templateCopy}>
                <Text style={styles.templateTitle}>Create your own</Text>
                <Text style={styles.templateDetail}>Build a process from the requirements you need.</Text>
              </View>
              <AppIcon name="chevron-right" size={20} color={colors.forest} />
            </Pressable>
          </View>
        </View>
      </View>

      {archived.length ? (
        <View style={styles.section}>
          <SectionHeading title="Archived" detail={`${archived.length} completed`} />
          <MaterialCard>
            {archived.map((process, index) => (
              <Pressable
                key={process.id}
                accessibilityRole="button"
                accessibilityLabel={`${process.title}, archived`}
                onPress={() => router.push({ pathname: "/process/[id]", params: { id: process.id } })}
                style={({ pressed }) => [
                  styles.archiveRow,
                  index > 0 ? styles.divider : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppIcon name="check-circle" size={22} color={colors.forest} />
                <Text style={styles.archiveTitle} numberOfLines={1}>{process.title}</Text>
                <AppIcon name="chevron-right" size={18} color={colors.inkMuted} />
              </Pressable>
            ))}
          </MaterialCard>
        </View>
      ) : null}
    </Screen>
  );
}

function ProcessCard({ process, onPress }: { process: VaultProcess; onPress: () => void }) {
  const progress = processProgress(process);
  const percent = Math.round(progress.ratio * 100);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${process.title}, ${progress.ready} of ${progress.total} ready`}
      accessibilityHint="Opens process details"
      onPress={onPress}
      style={({ pressed }) => [styles.processCard, pressed ? styles.pressed : null]}
    >
      <View style={styles.processTop}>
        <View style={styles.processMark}><AppIcon name="list" size={22} color={colors.forestDark} /></View>
        <View style={styles.percentPill}><Text style={styles.percentText}>{percent}%</Text></View>
      </View>
      <Text style={styles.processTitle} numberOfLines={2}>{process.title}</Text>
      <Text style={styles.processMeta}>{progress.ready} of {progress.total} requirements ready</Text>
      <ProgressBar progress={progress.ratio} color={colors.forest} style={styles.track} />
    </Pressable>
  );
}

function TemplateCard({ template, loading, disabled, onPress }: {
  template: ProcessTemplate;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${template.title}, ${template.requirements.length} requirements`}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.templateCard, disabled && !loading ? styles.disabled : null, pressed ? styles.pressed : null]}
    >
      <View style={styles.templateIcon}><AppIcon name={template.icon} size={24} color={colors.forestDark} /></View>
      <View style={styles.templateCopy}>
        <Text style={styles.templateTitle}>{template.title}</Text>
        <Text style={styles.templateDetail}>{template.detail}</Text>
        <Text style={styles.requirementCount}>{template.requirements.length} REQUIREMENTS</Text>
      </View>
      {loading ? <ActivityIndicator size={20} color={colors.forest} /> : <AppIcon name="add" size={22} color={colors.forest} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 220, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: spacing.xxxl },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.sm },
  full: { width: "100%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  half: { width: "50%", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.xl, marginBottom: spacing.xxxl, backgroundColor: colors.surface },
  emptyIcon: { width: 54, height: 54, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.signal },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 16 },
  emptyDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  processCard: { minHeight: 190, padding: spacing.xl, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card },
  processTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  processMark: { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.signal },
  percentPill: { borderRadius: radii.full, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: colors.forestSoft },
  percentText: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 11 },
  processTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 20, lineHeight: 26, marginTop: spacing.xl },
  processMeta: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, marginTop: spacing.xs },
  track: { height: 8, borderRadius: radii.full, backgroundColor: colors.paperDeep, marginTop: "auto" },
  templateCard: { minHeight: 154, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card },
  customCard: { minHeight: 154, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.forest, backgroundColor: colors.surface },
  templateIcon: { width: 46, height: 46, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.forestSoft },
  templateCopy: { flex: 1 },
  templateTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 15 },
  templateDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17, marginTop: 4 },
  requirementCount: { color: colors.forest, fontFamily: typography.extraBold, fontSize: 9, letterSpacing: 0.7, marginTop: spacing.md },
  archiveRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  archiveTitle: { flex: 1, color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.rule },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
