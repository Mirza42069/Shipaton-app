import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Chip, Surface, Text, TouchableRipple } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { ActionButton, MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { usePaperwork } from "@/contexts/paperwork-context";
import { useVault } from "@/contexts/vault-context";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { DOCUMENT_KIND_DEFINITIONS } from "@/types/document";

export default function LinkDocumentScreen() {
  const { runId, requirementId } = useLocalSearchParams<{
    runId: string;
    requirementId: string;
  }>();
  const router = useRouter();
  const { runs, isLoading, linkDocument } = usePaperwork();
  const { documents } = useVault();
  const [isLinking, setIsLinking] = useState(false);
  const run = runs.find((item) => item.id === runId);
  const requirement = run?.requirements.find((item) => item.id === requirementId);
  const matchingDocuments = requirement
    ? documents.filter((document) => requirement.acceptedKinds.includes(document.kind))
    : [];

  if (isLoading) {
    return (
      <View accessibilityLabel="Loading matching documents" style={styles.loading}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  if (!run || !requirement) {
    return (
      <Screen>
        <PageHeader eyebrow="NOT FOUND" title="Requirement unavailable" />
      </Screen>
    );
  }

  const selectedRunId = run.id;
  const selectedRequirementId = requirement.id;

  async function select(documentId: string | null) {
    if (isLinking) return;
    setIsLinking(true);
    try {
      await linkDocument(selectedRunId, selectedRequirementId, documentId);
      router.back();
    } catch {
      Alert.alert("Could not link document", "Berkas could not update this requirement.");
      setIsLinking(false);
    }
  }

  return (
    <Screen>
      <PageHeader eyebrow={run.title.toUpperCase()} title={requirement.label} />

      <Surface elevation={0} style={styles.acceptedPanel}>
        <Text variant="labelLarge" style={styles.acceptedLabel}>
          Accepted proof
        </Text>
        <View style={styles.kindChips}>
          {requirement.acceptedKinds.map((acceptedKind) => {
            const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === acceptedKind);
            return (
              <Chip
                key={acceptedKind}
                compact
                icon={appIconSource("check")}
                style={styles.kindChip}
                textStyle={styles.kindChipText}
              >
                {kind?.label ?? acceptedKind}
              </Chip>
            );
          })}
        </View>
      </Surface>

      {requirement.documentId ? (
        <Button
          accessibilityLabel="Remove current document link"
          accessibilityState={{ disabled: isLinking }}
          mode="outlined"
          icon={appIconSource("close")}
          disabled={isLinking}
          onPress={() => void select(null)}
          textColor={colors.rust}
          contentStyle={styles.unlinkContent}
          style={styles.unlink}
        >
          Remove current link
        </Button>
      ) : null}

      {matchingDocuments.length ? (
        <View style={styles.documentsSection}>
          <SectionHeading title="Vault matches" />
          <MaterialCard>
            {matchingDocuments.map((document, index) => {
              const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === document.kind)!;
              const selected = requirement.documentId === document.id;
              return (
                <TouchableRipple
                  key={document.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${document.title}, ${kind.label}${selected ? ", currently linked" : ""}`}
                  accessibilityState={{ disabled: isLinking, selected }}
                  disabled={isLinking}
                  onPress={() => void select(document.id)}
                  rippleColor={colors.forestSoft}
                  style={index < matchingDocuments.length - 1 ? styles.documentDivider : undefined}
                >
                  <View style={styles.document}>
                    <View style={styles.icon}>
                      <AppIcon name={kind.icon} size={22} color={colors.forest} />
                    </View>
                    <View style={styles.copy}>
                      <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
                        {document.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.meta} numberOfLines={1}>
                        {kind.label} · {document.originalName}
                      </Text>
                    </View>
                    <View style={[styles.selectionIcon, selected ? styles.selectionIconActive : null]}>
                      <AppIcon
                        name={selected ? "check" : "add"}
                        size={20}
                        color={selected ? colors.white : colors.forest}
                      />
                    </View>
                  </View>
                </TouchableRipple>
              );
            })}
          </MaterialCard>
        </View>
      ) : (
        <MaterialCard style={styles.empty}>
          <View style={styles.emptyIcon}>
            <AppIcon name="document" size={30} color={colors.forest} />
          </View>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No matching proof yet
          </Text>
          <View style={styles.addAction}>
            <ActionButton
              icon="add"
              onPress={() =>
                router.replace({
                  pathname: "/add",
                  params: {
                    runId,
                    requirementId,
                    preferredKind: requirement.acceptedKinds[0],
                  },
                })
              }
            >
              Add to vault
            </ActionButton>
          </View>
        </MaterialCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  acceptedPanel: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.forestSoft,
    marginBottom: spacing.xxl,
  },
  acceptedLabel: { color: colors.forestDark, fontFamily: typography.strong, marginBottom: spacing.md },
  kindChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kindChip: { backgroundColor: colors.card },
  kindChipText: { color: colors.forestDark, fontFamily: typography.label },
  unlink: {
    alignSelf: "flex-start",
    borderColor: colors.rust,
    borderRadius: radii.full,
    marginBottom: spacing.xxxl,
  },
  unlinkContent: { minHeight: 48, paddingHorizontal: spacing.sm },
  documentsSection: { marginBottom: spacing.xxl },
  document: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  documentDivider: { borderBottomWidth: 1, borderBottomColor: colors.rule },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontFamily: typography.strong, fontSize: 15 },
  meta: { color: colors.inkMuted, marginTop: spacing.xs },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
  },
  selectionIconActive: { backgroundColor: colors.forest },
  empty: { alignItems: "center", padding: spacing.xxxl, backgroundColor: colors.surface },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: typography.strong,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  addAction: { alignSelf: "stretch", maxWidth: 280, width: "100%", marginTop: spacing.xxl },
});
