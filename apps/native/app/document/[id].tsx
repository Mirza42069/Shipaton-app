import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { ActionButton, Screen } from "@/components/screen";
import { useVault } from "@/contexts/vault-context";
import { expiryLabel, formatDate, formatFileSize } from "@/lib/date";
import { colors, typography } from "@/lib/theme";
import { decryptForPreview } from "@/lib/vault-crypto";
import { DOCUMENT_KIND_DEFINITIONS } from "@/types/document";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { documents, deleteDocument, toggleFavorite } = useVault();
  const document = documents.find((item) => item.id === id);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const wide = width >= 760;

  useEffect(() => {
    if (!document || !document.mimeType.startsWith("image/")) return;
    let active = true;
    void decryptForPreview(document.encryptedUri, document.id, document.fileExtension)
      .then((file) => {
        if (active) setPreviewUri(file.uri);
      })
      .catch(() => {
        if (active) setPreviewError(true);
      });
    return () => {
      active = false;
    };
  }, [document]);

  if (!document) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Ionicons name="document-outline" size={42} color={colors.inkMuted} />
          <Text style={styles.missingTitle}>Document not found</Text>
          <ActionButton onPress={() => router.replace("/(tabs)/vault")}>Back to vault</ActionButton>
        </View>
      </Screen>
    );
  }

  const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === document.kind)!;
  const expiry = expiryLabel(document.expiresAt);
  const currentDocument = document;

  async function openOrShare() {
    try {
      const preview = await decryptForPreview(
        currentDocument.encryptedUri,
        currentDocument.id,
        currentDocument.fileExtension,
      );
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "No compatible viewer is available on this device.");
        return;
      }
      await Sharing.shareAsync(preview.uri, {
        mimeType: currentDocument.mimeType,
        dialogTitle: `Open ${currentDocument.title}`,
      });
    } catch (error) {
      Alert.alert("Could not open document", error instanceof Error ? error.message : "Decryption failed.");
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete this document?",
      "The encrypted file and its reminder will be permanently removed from this phone.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteDocument(currentDocument.id).then(() => router.replace("/(tabs)/vault"));
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={[styles.layout, wide ? styles.layoutWide : null]}>
        <View style={[styles.preview, wide ? styles.previewWide : null]}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.image} contentFit="contain" />
          ) : (
            <View style={styles.filePlaceholder}>
              <View style={styles.fileStamp}>
                <Ionicons
                  name={previewError ? "alert-circle-outline" : "document-lock-outline"}
                  size={40}
                  color={colors.signal}
                />
              </View>
              <Text style={styles.fileType}>{document.fileExtension.replace(".", "").toUpperCase()}</Text>
              <Text style={styles.fileState}>{previewError ? "Preview unavailable" : "Encrypted at rest"}</Text>
            </View>
          )}
        </View>

        <View style={[styles.details, wide ? styles.detailsWide : null]}>
          <View style={styles.kindRow}>
            <Text style={styles.kind}>{kind.shortLabel}</Text>
            <Pressable
              accessibilityLabel={document.isFavorite ? "Remove favorite" : "Add favorite"}
              onPress={() => {
                void toggleFavorite(document.id, document.isFavorite);
                void Haptics.selectionAsync();
              }}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={document.isFavorite ? "bookmark" : "bookmark-outline"}
                size={23}
                color={document.isFavorite ? colors.rust : colors.ink}
              />
            </Pressable>
          </View>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.originalName} numberOfLines={2}>{document.originalName}</Text>

          <View style={styles.facts}>
            <Fact label="SIZE" value={formatFileSize(document.fileSize)} />
            <Fact label="ADDED" value={formatDate(document.createdAt.slice(0, 10))} />
            <Fact label="EXPIRY" value={expiry.label} danger={expiry.tone === "danger"} />
          </View>

          {document.notes ? (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>PRIVATE NOTE</Text>
              <Text style={styles.noteText}>{document.notes}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <ActionButton onPress={() => void openOrShare()}>
              {document.mimeType === "application/pdf" ? "Open PDF" : "Share a copy"}
            </ActionButton>
            <ActionButton variant="secondary" onPress={confirmDelete}>Delete from vault</ActionButton>
          </View>

          <View style={styles.encryptionFooter}>
            <Ionicons name="shield-checkmark" size={18} color={colors.forest} />
            <Text style={styles.encryptionText}>AES-256-GCM · KEY HELD BY ANDROID KEYSTORE</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Fact({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, danger ? styles.danger : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { gap: 24 },
  layoutWide: { flexDirection: "row", alignItems: "flex-start", gap: 32 },
  preview: {
    height: 340,
    backgroundColor: colors.forest,
    borderRadius: 5,
    overflow: "hidden",
  },
  previewWide: { flex: 1, minHeight: 540 },
  image: { width: "100%", height: "100%", backgroundColor: colors.ink },
  filePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  fileStamp: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  fileType: {
    color: colors.white,
    fontFamily: typography.display,
    fontWeight: "700",
    fontSize: 42,
    marginTop: 21,
  },
  fileState: {
    color: colors.forestSoft,
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 5,
  },
  details: { paddingBottom: 12 },
  detailsWide: { flex: 1, paddingTop: 12 },
  kindRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kind: {
    color: colors.rust,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.7,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontWeight: "700",
    fontSize: 39,
    lineHeight: 44,
    letterSpacing: -1.1,
    marginTop: 8,
  },
  originalName: { color: colors.inkMuted, fontSize: 13, marginTop: 8 },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.rule,
    marginTop: 25,
    paddingVertical: 17,
    gap: 24,
  },
  fact: { minWidth: 84, flex: 1 },
  factLabel: {
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  factValue: { color: colors.ink, fontSize: 13, fontWeight: "700", marginTop: 5 },
  danger: { color: colors.rust },
  note: { backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: colors.rust, padding: 17, marginTop: 22 },
  noteLabel: { color: colors.rust, fontFamily: typography.label, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  noteText: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 8 },
  actions: { gap: 10, marginTop: 24 },
  encryptionFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 },
  encryptionText: { color: colors.forest, fontFamily: typography.label, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  missing: { flex: 1, gap: 18, alignItems: "flex-start", justifyContent: "center" },
  missingTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 30, fontWeight: "700" },
});
