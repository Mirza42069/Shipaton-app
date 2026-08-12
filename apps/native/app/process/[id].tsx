import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Dialog, IconButton, Portal, ProgressBar, Text, TextInput } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useProcesses } from "@/contexts/process-context";
import { useVault } from "@/contexts/vault-context";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { isRequirementReady, processProgress, type ProcessRequirement } from "@/types/process";

type EditTarget = { kind: "process"; id: string; value: string } | { kind: "requirement"; id: string; value: string };

export default function ProcessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    processes,
    isLoading,
    rename,
    addRequirement,
    renameRequirement,
    moveRequirement,
    deleteRequirement,
    setConfirmed,
    archive,
    restore,
    deleteProcess,
  } = useProcesses();
  const { documents } = useVault();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const process = processes.find((item) => item.id === id);

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" accessibilityLabel="Loading process" /></View>;
  }
  if (!process) {
    return (
      <Screen scroll={false} style={styles.missing}>
        <AppIcon name="list" size={34} color={colors.forestDark} />
        <Text style={styles.missingTitle}>Process not found</Text>
        <Button mode="contained" onPress={() => router.replace("/(tabs)/processes")}>Back to processes</Button>
      </Screen>
    );
  }

  const currentProcess = process;
  const progress = processProgress(currentProcess);
  const complete = progress.total > 0 && progress.ready === progress.total;

  function openEdit(target: EditTarget) {
    setEditTarget(target);
    setDraft(target.value);
  }

  async function saveEdit() {
    if (!editTarget || !draft.trim() || saving) return;
    setSaving(true);
    try {
      if (editTarget.kind === "process") await rename(currentProcess.id, draft);
      else await renameRequirement(currentProcess.id, editTarget.id, draft);
      setEditTarget(null);
    } catch (error) {
      Alert.alert("Change not saved", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (editTarget?.kind === "requirement" && editTarget.id === "new") {
      if (!draft.trim() || saving) return;
      setSaving(true);
      try {
        await addRequirement(currentProcess.id, draft);
        setEditTarget(null);
      } catch (error) {
        Alert.alert("Requirement not added", error instanceof Error ? error.message : "Try again.");
      } finally {
        setSaving(false);
      }
      return;
    }
    await saveEdit();
  }

  function manageRequirement(requirement: ProcessRequirement, index: number) {
    Alert.alert(requirement.label, "Change this requirement", [
      { text: "Cancel", style: "cancel" },
      { text: "Rename", onPress: () => openEdit({ kind: "requirement", id: requirement.id, value: requirement.label }) },
      ...(index > 0 ? [{ text: "Move up", onPress: () => void moveRequirement(currentProcess.id, requirement.id, -1) }] : []),
      ...(index < currentProcess.requirements.length - 1 ? [{ text: "Move down", onPress: () => void moveRequirement(currentProcess.id, requirement.id, 1) }] : []),
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteRequirement(currentProcess.id, requirement.id).catch((error) =>
          Alert.alert("Requirement not deleted", error instanceof Error ? error.message : "Try again."),
        ),
      },
    ]);
  }

  function confirmDeleteProcess() {
    Alert.alert("Delete this process?", "The checklist and links will be removed. Vault documents stay safe.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteProcess(currentProcess.id).then(() => router.replace("/(tabs)/processes")),
      },
    ]);
  }

  return (
    <Screen style={styles.content}>
      <PageHeader
        eyebrow={currentProcess.archivedAt ? "ARCHIVED PROCESS" : complete ? "READY TO ARCHIVE" : "ACTIVE PROCESS"}
        title={currentProcess.title}
        action={!currentProcess.archivedAt ? (
          <IconButton
            icon={appIconSource("edit")}
            mode="contained-tonal"
            accessibilityLabel="Rename process"
            onPress={() => openEdit({ kind: "process", id: currentProcess.id, value: currentProcess.title })}
          />
        ) : undefined}
      />

      <MaterialCard style={[styles.progressCard, complete ? styles.completeCard : null]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressEyebrow}>{complete ? "ALL REQUIREMENTS READY" : "CURRENT PROGRESS"}</Text>
            <Text style={styles.progressNumber}>{Math.round(progress.ratio * 100)}%</Text>
          </View>
          <View style={styles.readyPill}>
            <AppIcon name={complete ? "check-circle" : "list"} size={17} color={colors.forestDark} />
            <Text style={styles.readyText}>{progress.ready} / {progress.total}</Text>
          </View>
        </View>
        <ProgressBar progress={progress.ratio} color={colors.forest} style={styles.track} />
        <Text style={styles.progressDetail}>A requirement is ready when a vault document is linked and you confirm it.</Text>
      </MaterialCard>

      <View style={styles.requirementsSection}>
        <SectionHeading title="Requirements" detail={process.archivedAt ? "Archived checklist" : "Attach proof, then confirm it"} />
        <MaterialCard>
          {currentProcess.requirements.map((requirement, index) => {
            const document = documents.find((item) => item.id === requirement.documentId);
            const ready = isRequirementReady(requirement);
            return (
              <View key={requirement.id} style={[styles.requirementRow, index > 0 ? styles.divider : null]}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ready, disabled: Boolean(currentProcess.archivedAt) }}
                  accessibilityLabel={`${requirement.label}, ${ready ? "ready" : "not ready"}`}
                  disabled={Boolean(currentProcess.archivedAt)}
                  onPress={() => {
                    if (!requirement.documentId) {
                      Alert.alert("Attach proof first", "Link a vault document before confirming this requirement.", [
                        { text: "Not now", style: "cancel" },
                        { text: "Choose document", onPress: () => router.push({ pathname: "/process/link-document", params: { processId: currentProcess.id, requirementId: requirement.id } }) },
                      ]);
                      return;
                    }
                    void setConfirmed(currentProcess.id, requirement.id, !requirement.isConfirmed)
                      .then(() => void Haptics.selectionAsync())
                      .catch((error) => Alert.alert("Requirement not updated", error instanceof Error ? error.message : "Try again."));
                  }}
                  style={[styles.checkbox, ready ? styles.checkboxReady : null]}
                >
                  {ready ? <AppIcon name="check" size={20} color={colors.white} /> : <Text style={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</Text>}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${requirement.label}, ${document ? `linked to ${document.title}` : "no document linked"}`}
                  disabled={Boolean(currentProcess.archivedAt)}
                  onPress={() => router.push({ pathname: "/process/link-document", params: { processId: currentProcess.id, requirementId: requirement.id } })}
                  style={styles.requirementCopy}
                >
                  <Text style={styles.requirementLabel}>{requirement.label}</Text>
                  <Text style={[styles.linkedDocument, document ? styles.linkedDocumentActive : null]} numberOfLines={1}>
                    {document?.title ?? "Attach a vault document"}
                  </Text>
                  {document && !requirement.isConfirmed ? <Text style={styles.confirmHint}>Proof attached · confirmation needed</Text> : null}
                </Pressable>
                {!currentProcess.archivedAt ? (
                  <IconButton
                    icon={appIconSource("more")}
                    size={20}
                    accessibilityLabel={`Manage ${requirement.label}`}
                    onPress={() => manageRequirement(requirement, index)}
                    style={styles.moreButton}
                  />
                ) : null}
              </View>
            );
          })}
        </MaterialCard>
        {!currentProcess.archivedAt ? (
          <Button
            mode="outlined"
            icon={appIconSource("add")}
            onPress={() => openEdit({ kind: "requirement", id: "new", value: "" })}
            style={styles.addRequirement}
          >
            Add requirement
          </Button>
        ) : null}
      </View>

      <View style={styles.actions}>
        {currentProcess.archivedAt ? (
          <Button mode="contained" icon={appIconSource("back")} onPress={() => void restore(currentProcess.id)}>Restore to active</Button>
        ) : complete ? (
          <Button mode="contained" icon={appIconSource("check-circle")} onPress={() => void archive(currentProcess.id)}>Archive completed process</Button>
        ) : null}
        <Button mode="text" textColor={colors.rust} icon={appIconSource("delete")} onPress={confirmDeleteProcess}>Delete process</Button>
      </View>

      <Portal>
        <Dialog visible={editTarget !== null} onDismiss={() => setEditTarget(null)} style={styles.dialog}>
          <Dialog.Title>{editTarget?.kind === "process" ? "Rename process" : editTarget?.id === "new" ? "New requirement" : "Rename requirement"}</Dialog.Title>
          <Dialog.Content>
            <TextInput mode="outlined" value={draft} onChangeText={setDraft} maxLength={100} autoFocus returnKeyType="done" onSubmitEditing={() => void submitEdit()} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditTarget(null)}>Cancel</Button>
            <Button
              loading={saving}
              disabled={!draft.trim() || saving}
              onPress={() => void submitEdit()}
            >Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  missing: { alignItems: "center", justifyContent: "center", gap: spacing.xl },
  missingTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 22 },
  content: { width: "100%", maxWidth: 820, alignSelf: "center" },
  progressCard: { padding: spacing.xxl, marginBottom: spacing.xxxl, backgroundColor: colors.surface },
  completeCard: { backgroundColor: colors.forestSoft, borderColor: colors.forest },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressEyebrow: { color: colors.forest, fontFamily: typography.extraBold, fontSize: 10, letterSpacing: 0.9 },
  progressNumber: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 44, lineHeight: 50, marginTop: spacing.xs },
  readyPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.full, backgroundColor: colors.signal },
  readyText: { color: colors.forestDark, fontFamily: typography.strong, fontSize: 11 },
  track: { height: 10, borderRadius: radii.full, backgroundColor: colors.paperDeep, marginTop: spacing.xl },
  progressDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17, marginTop: spacing.md },
  requirementsSection: { marginBottom: spacing.xxxl },
  requirementRow: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.rule },
  checkbox: { width: 44, height: 44, borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.surface },
  checkboxReady: { borderColor: colors.forest, backgroundColor: colors.forest },
  stepNumber: { color: colors.inkMuted, fontFamily: typography.label, fontSize: 10 },
  requirementCopy: { flex: 1, minWidth: 0, paddingVertical: spacing.sm },
  requirementLabel: { color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  linkedDocument: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, marginTop: 4 },
  linkedDocumentActive: { color: colors.forest, fontFamily: typography.label },
  confirmHint: { color: colors.warning, fontFamily: typography.label, fontSize: 9, marginTop: 3 },
  moreButton: { margin: 0 },
  addRequirement: { alignSelf: "flex-start", borderRadius: radii.full, borderColor: colors.forest, marginTop: spacing.lg },
  actions: { gap: spacing.sm },
  dialog: { backgroundColor: colors.card, borderRadius: radii.lg },
});
