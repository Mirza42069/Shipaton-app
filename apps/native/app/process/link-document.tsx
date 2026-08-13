import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useProcesses } from "@/contexts/process-context";
import { useVault } from "@/contexts/vault-context";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { DOCUMENT_KIND_DEFINITIONS, getDocumentKindDefinition, type VaultDocument } from "@/types/document";

export default function LinkProcessDocumentScreen() {
  const { processId, requirementId } = useLocalSearchParams<{ processId: string; requirementId: string }>();
  const router = useRouter();
  const { processes, linkDocument } = useProcesses();
  const { documents } = useVault();
  const [linking, setLinking] = useState(false);
  const process = processes.find((item) => item.id === processId);
  const requirement = process?.requirements.find((item) => item.id === requirementId);

  if (!process || !requirement || process.archivedAt) {
    return <Screen><PageHeader title="Requirement unavailable" /></Screen>;
  }

  const currentProcess = process;
  const currentRequirement = requirement;
  const recommendedSet = new Set(currentRequirement.recommendedKinds);
  const recommended = documents.filter((item) => recommendedSet.has(item.kind));
  const others = documents.filter((item) => !recommendedSet.has(item.kind));

  async function select(documentId: string | null) {
    if (linking) return;
    setLinking(true);
    try {
      await linkDocument(currentProcess.id, currentRequirement.id, documentId);
      router.back();
    } catch (error) {
      Alert.alert("Document not linked", error instanceof Error ? error.message : "Try again.");
      setLinking(false);
    }
  }

  return (
    <Screen style={styles.content}>
      <PageHeader eyebrow={currentProcess.title.toUpperCase()} title={currentRequirement.label} detail="Choose proof from your encrypted vault." />

      {currentRequirement.recommendedKinds.length ? (
        <View style={styles.recommendations}>
          <Text style={styles.recommendationLabel}>RECOMMENDED TYPES</Text>
          <View style={styles.chips}>
            {currentRequirement.recommendedKinds.map((kind) => {
              const definition = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === kind);
              return <Chip key={kind} compact icon={definition ? appIconSource(definition.icon) : undefined}>{definition?.label ?? kind}</Chip>;
            })}
          </View>
        </View>
      ) : null}

      {currentRequirement.documentId ? (
        <Button mode="outlined" icon={appIconSource("close")} textColor={colors.rust} disabled={linking} onPress={() => void select(null)} style={styles.unlink}>
          Remove current link
        </Button>
      ) : null}

      {recommended.length ? <DocumentSection title="Recommended" documents={recommended} selectedId={currentRequirement.documentId} disabled={linking} onSelect={select} /> : null}
      {others.length ? <DocumentSection title={recommended.length ? "Other vault documents" : "Vault documents"} documents={others} selectedId={currentRequirement.documentId} disabled={linking} onSelect={select} /> : null}

      {!documents.length ? (
        <MaterialCard style={styles.empty}>
          <View style={styles.emptyIcon}><AppIcon name="document" size={30} color={colors.forestDark} /></View>
          <Text style={styles.emptyTitle}>No vault documents yet</Text>
          <Text style={styles.emptyDetail}>Add the proof you need, then Berkas will return it to this requirement.</Text>
        </MaterialCard>
      ) : null}

      <Button
        mode="contained"
        icon={appIconSource("add")}
        onPress={() => router.push({
          pathname: "/add",
          params: {
            processId: currentProcess.id,
            requirementId: currentRequirement.id,
            preferredKind: currentRequirement.recommendedKinds[0],
          },
        })}
        contentStyle={styles.addContent}
        style={styles.addButton}
      >
        Add new document
      </Button>
    </Screen>
  );
}

function DocumentSection({ title, documents, selectedId, disabled, onSelect }: {
  title: string;
  documents: VaultDocument[];
  selectedId: string | null;
  disabled: boolean;
  onSelect: (id: string) => Promise<void>;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading title={title} />
      <MaterialCard>
        {documents.map((document, index) => {
          const kind = getDocumentKindDefinition(document.kind);
          const selected = document.id === selectedId;
          return (
            <Pressable
              key={document.id}
              accessibilityRole="button"
              accessibilityLabel={`${document.title}, ${kind.label}${selected ? ", currently linked" : ""}`}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => void onSelect(document.id)}
              style={({ pressed }) => [styles.documentRow, index > 0 ? styles.divider : null, pressed ? styles.pressed : null]}
            >
              <View style={styles.documentIcon}><AppIcon name={kind.icon} size={22} color={colors.forestDark} /></View>
              <View style={styles.documentCopy}>
                <Text style={styles.documentTitle} numberOfLines={1}>{document.title}</Text>
                <Text style={styles.documentMeta} numberOfLines={1}>{kind.label} · {document.originalName}</Text>
              </View>
              <View style={[styles.selection, selected ? styles.selectionActive : null]}>
                <AppIcon name={selected ? "check" : "add"} size={19} color={selected ? colors.white : colors.forest} />
              </View>
            </Pressable>
          );
        })}
      </MaterialCard>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  recommendations: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.forestSoft, marginBottom: spacing.xl },
  recommendationLabel: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 9, letterSpacing: 0.8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  unlink: { alignSelf: "flex-start", borderColor: colors.rust, borderRadius: radii.full, marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxxl },
  documentRow: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.rule },
  pressed: { backgroundColor: colors.surface },
  documentIcon: { width: 46, height: 46, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.forestSoft },
  documentCopy: { flex: 1, minWidth: 0 },
  documentTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  documentMeta: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, marginTop: 3 },
  selection: { width: 38, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.forestSoft },
  selectionActive: { backgroundColor: colors.forest },
  empty: { alignItems: "center", padding: spacing.xxxl, backgroundColor: colors.surface },
  emptyIcon: { width: 62, height: 62, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", backgroundColor: colors.signal },
  emptyTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 18, marginTop: spacing.lg },
  emptyDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.sm, maxWidth: 360 },
  addButton: { borderRadius: radii.full, marginTop: spacing.xl },
  addContent: { minHeight: 56 },
});
