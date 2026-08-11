import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View, useWindowDimensions } from "react-native";
import { ActivityIndicator, Button, IconButton, Surface, Text } from "react-native-paper";

import { AppIcon, type AppIconName, appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen } from "@/components/screen";
import { useSecurity } from "@/contexts/security-context";
import { useVault } from "@/contexts/vault-context";
import { expiryLabel, formatDate, formatFileSize } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { decryptForPreview, deletePreviewFile } from "@/lib/vault-crypto";
import { DOCUMENT_KIND_DEFINITIONS } from "@/types/document";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { documents, isLoading, deleteDocument, toggleFavorite } = useVault();
  const { runWithAutoLockPaused } = useSecurity();
  const document = documents.find((item) => item.id === id);
  const encryptedUri = document?.encryptedUri;
  const documentId = document?.id;
  const fileExtension = document?.fileExtension;
  const mimeType = document?.mimeType;
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const wide = width >= 760;

  useEffect(() => {
    setPreviewUri(null);
    setPreviewError(false);
    setIsPreviewLoading(false);
    if (!encryptedUri || !documentId || !fileExtension || !mimeType?.startsWith("image/")) return;

    let active = true;
    setIsPreviewLoading(true);
    void decryptForPreview(encryptedUri, documentId, fileExtension)
      .then((file) => {
        if (active) {
          setPreviewUri(file.uri);
        } else {
          deletePreviewFile(documentId, fileExtension);
        }
      })
      .catch(() => {
        if (active) setPreviewError(true);
      })
      .finally(() => {
        if (active) setIsPreviewLoading(false);
      });

    return () => {
      active = false;
      deletePreviewFile(documentId, fileExtension);
    };
  }, [documentId, encryptedUri, fileExtension, mimeType]);

  if (isLoading) {
    return (
      <Screen scroll={false} style={styles.centeredScreen}>
        <ActivityIndicator size="large" accessibilityLabel="Loading document" />
      </Screen>
    );
  }

  if (!document) {
    return (
      <Screen scroll={false} style={styles.centeredScreen}>
        <MaterialCard style={styles.missingCard}>
          <View style={styles.missingIcon}>
            <AppIcon name="document" size={34} color={colors.forestDark} />
          </View>
          <Text variant="headlineMedium" accessibilityRole="header" style={styles.missingTitle}>
            Document not found
          </Text>
          <Text variant="bodyLarge" style={styles.missingCopy}>
            It may have been deleted.
          </Text>
          <Button
            mode="contained"
            icon={appIconSource("back")}
            onPress={() => router.replace("/(tabs)/vault")}
            contentStyle={styles.buttonContent}
            style={styles.primaryButton}
          >
            Back to vault
          </Button>
        </MaterialCard>
      </Screen>
    );
  }

  const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === document.kind)!;
  const expiry = expiryLabel(document.expiresAt);
  const currentDocument = document;
  const actionsBusy = isOpening || isDeleting || isFavoriteUpdating || isPreviewLoading;

  async function openOrShare() {
    if (actionsBusy) return;
    setIsOpening(true);
    let temporaryCreated = false;
    try {
      const preview = await decryptForPreview(
        currentDocument.encryptedUri,
        currentDocument.id,
        currentDocument.fileExtension,
      );
      temporaryCreated = true;
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Can't open", "No compatible viewer is available.");
        return;
      }
      await runWithAutoLockPaused(() =>
        Sharing.shareAsync(preview.uri, {
          mimeType: currentDocument.mimeType,
          dialogTitle: `Open ${currentDocument.title}`,
        }),
      );
    } catch (error) {
      Alert.alert("Couldn't open", error instanceof Error ? error.message : "Decryption failed.");
    } finally {
      if (temporaryCreated && !currentDocument.mimeType.startsWith("image/")) {
        deletePreviewFile(currentDocument.id, currentDocument.fileExtension);
      }
      setIsOpening(false);
    }
  }

  async function updateFavorite() {
    if (isFavoriteUpdating) return;
    setIsFavoriteUpdating(true);
    try {
      await toggleFavorite(currentDocument.id, currentDocument.isFavorite);
      void Haptics.selectionAsync();
    } catch (error) {
      Alert.alert(
        "Couldn't update favorite",
        error instanceof Error ? error.message : "Update failed.",
      );
    } finally {
      setIsFavoriteUpdating(false);
    }
  }

  function confirmDelete() {
    if (actionsBusy) return;
    Alert.alert(
      "Delete this document?",
      "This permanently removes the file and reminder from this phone.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setIsDeleting(true);
            void deleteDocument(currentDocument.id)
              .then(() => router.replace("/(tabs)/vault"))
              .catch((error: unknown) => {
                Alert.alert(
                  "Couldn't delete",
                  error instanceof Error ? error.message : "Delete failed.",
                );
                setIsDeleting(false);
              });
          },
        },
      ],
    );
  }

  return (
    <Screen style={[styles.screenContent, wide ? styles.screenContentWide : null]}>
      <View style={[styles.layout, wide ? styles.layoutWide : null]}>
        <MaterialCard
          style={[
            styles.preview,
            wide ? styles.previewWide : null,
            !wide && width < 390 ? styles.previewCompact : null,
          ]}
        >
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.image}
              contentFit="contain"
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Preview of ${document.title}`}
            />
          ) : isPreviewLoading ? (
            <View style={styles.filePlaceholder}>
              <ActivityIndicator
                size="large"
                color={colors.forest}
                accessibilityLabel="Loading preview"
              />
            </View>
          ) : (
            <View style={styles.filePlaceholder}>
              <View style={[styles.fileStamp, previewError ? styles.fileStampError : null]}>
                <AppIcon
                  name={previewError ? "alert" : "document-security"}
                  size={34}
                  color={previewError ? colors.rust : colors.forestDark}
                />
              </View>
              <Text variant="displaySmall" style={styles.fileType}>
                {document.fileExtension.replace(".", "").toUpperCase()}
              </Text>
              {previewError ? (
                <Text variant="bodyMedium" style={styles.previewStatus}>
                  Preview unavailable
                </Text>
              ) : null}
            </View>
          )}
        </MaterialCard>

        <View style={[styles.details, wide ? styles.detailsWide : null]}>
          <PageHeader
            eyebrow={kind.label.toUpperCase()}
            title={document.title}
            detail={document.originalName}
            action={
              <IconButton
                icon={appIconSource("bookmark")}
                mode="contained-tonal"
                selected={document.isFavorite}
                loading={isFavoriteUpdating}
                disabled={isFavoriteUpdating || actionsBusy}
                accessibilityLabel={document.isFavorite ? "Remove from favorites" : "Add to favorites"}
                accessibilityState={{
                  selected: document.isFavorite,
                  busy: isFavoriteUpdating,
                  disabled: isFavoriteUpdating || actionsBusy,
                }}
                onPress={() => void updateFavorite()}
                style={styles.favoriteButton}
              />
            }
          />

          <View style={styles.facts}>
            <Fact icon="database" label="Size" value={formatFileSize(document.fileSize)} />
            <Fact
              icon="calendar"
              label="Added"
              value={formatDate(document.createdAt.slice(0, 10))}
            />
            <Fact
              icon="clock"
              label="Expiry"
              value={expiry.label}
              tone={expiry.tone}
            />
          </View>

          {document.notes ? (
            <Surface elevation={0} style={styles.note}>
              <View style={styles.noteHeading}>
                <AppIcon name="lock" size={16} color={colors.forest} />
                <Text variant="labelMedium" style={styles.noteLabel}>
                  Private note
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.noteText}>
                {document.notes}
              </Text>
            </Surface>
          ) : null}

          <View style={styles.actions}>
            <Button
              mode="contained"
              icon={appIconSource(document.mimeType === "application/pdf" ? "document" : "share")}
              loading={isOpening}
              disabled={actionsBusy}
              accessibilityLabel={
                document.mimeType === "application/pdf"
                  ? "Open PDF"
                  : `Share a copy of ${document.title}`
              }
              accessibilityState={{ busy: isOpening, disabled: actionsBusy }}
              onPress={() => void openOrShare()}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={styles.primaryButton}
            >
              {isOpening
                ? "Preparing..."
                : document.mimeType === "application/pdf"
                  ? "Open PDF"
                  : "Share"}
            </Button>
            <Button
              mode="outlined"
              icon={appIconSource("delete")}
              loading={isDeleting}
              disabled={actionsBusy}
              textColor={colors.rust}
              accessibilityState={{ busy: isDeleting, disabled: actionsBusy }}
              onPress={confirmDelete}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              style={styles.deleteButton}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Fact({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: AppIconName;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <Surface elevation={0} style={styles.fact}>
      <AppIcon
        name={icon}
        size={18}
        color={tone === "danger" ? colors.rust : tone === "warning" ? colors.warning : colors.forest}
      />
      <Text variant="labelSmall" style={styles.factLabel}>
        {label}
      </Text>
      <Text
        variant="titleSmall"
        style={[
          styles.factValue,
          tone === "danger" ? styles.danger : null,
          tone === "warning" ? styles.warning : null,
        ]}
      >
        {value}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screenContent: { width: "100%", maxWidth: 760, alignSelf: "center" },
  screenContentWide: { maxWidth: 1180 },
  centeredScreen: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  layout: { gap: spacing.xxl },
  layoutWide: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xxxl },
  preview: {
    height: 400,
    borderRadius: radii.xl,
    backgroundColor: colors.paperDeep,
  },
  previewCompact: { height: 310 },
  previewWide: { flex: 1.05, height: 620 },
  image: { width: "100%", height: "100%", backgroundColor: colors.surface },
  filePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  fileStamp: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
  },
  fileStampError: { backgroundColor: colors.rustSoft },
  fileType: { color: colors.forestDark, fontFamily: typography.extraBold, marginTop: spacing.lg },
  previewStatus: { color: colors.inkMuted, marginTop: spacing.sm, textAlign: "center" },
  details: { paddingBottom: spacing.md },
  detailsWide: { flex: 0.95, paddingTop: spacing.md },
  favoriteButton: { margin: 0, marginTop: 2 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fact: {
    minWidth: 105,
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  factLabel: { color: colors.inkMuted, fontFamily: typography.label, marginTop: spacing.sm },
  factValue: { color: colors.ink, fontFamily: typography.strong, marginTop: 2 },
  danger: { color: colors.rust },
  warning: { color: colors.warning },
  note: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.forestSoft,
    marginTop: spacing.xxl,
  },
  noteHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  noteLabel: { color: colors.forestDark, fontFamily: typography.strong },
  noteText: { color: colors.ink, lineHeight: 22, marginTop: spacing.sm },
  actions: { gap: spacing.md, marginTop: spacing.xxl },
  primaryButton: { borderRadius: radii.full },
  deleteButton: { borderRadius: radii.full, borderColor: colors.rust },
  buttonContent: { minHeight: 54, paddingHorizontal: spacing.md },
  buttonLabel: { fontFamily: typography.strong, fontSize: 14 },
  missingCard: {
    width: "100%",
    alignItems: "flex-start",
    padding: spacing.xxl,
  },
  missingIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
    marginBottom: spacing.xl,
  },
  missingTitle: { color: colors.ink, fontFamily: typography.display },
  missingCopy: { color: colors.inkMuted, lineHeight: 24, marginTop: spacing.sm, marginBottom: spacing.xxl },
});
