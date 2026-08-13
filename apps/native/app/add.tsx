import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import {
  Button,
  Chip,
  HelperText,
  IconButton,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

import { AppIcon, type AppIconName, appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useProcesses } from "@/contexts/process-context";
import { usePurchases } from "@/contexts/purchases-context";
import { useVault } from "@/contexts/vault-context";
import { FREE_DOCUMENT_LIMIT, canAddDocument } from "@/lib/access-policy";
import { formatDate, formatLocalDate } from "@/lib/date";
import { scanDocument } from "@/lib/document-scanner";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { deleteTemporarySource, stageTemporarySource } from "@/lib/vault-crypto";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_DEFINITIONS,
  type DocumentKind,
  type NewVaultDocument,
} from "@/types/document";

type SelectedFile = Pick<
  NewVaultDocument,
  "sourceUri" | "originalName" | "mimeType" | "fileExtension"
>;

type ImportMethod = "scan" | "file";

function extensionFor(name: string, mimeType: string) {
  const match = name.match(/\.[a-z0-9]{1,8}$/i);
  if (match) return match[0].toLowerCase();
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/png") return ".png";
  return ".jpg";
}

function defaultTitle(name: string) {
  return name.replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[-_]+/g, " ").trim();
}

export default function AddDocumentScreen() {
  const { preferredKind, source, processId, requirementId } = useLocalSearchParams<{
    preferredKind?: string;
    source?: string;
    processId?: string;
    requirementId?: string;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { documents, folders, addDocument } = useVault();
  const { linkDocument } = useProcesses();
  const { isPro, isLoading: isPurchasesLoading } = usePurchases();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [title, setTitle] = useState("");
  const initialKind = DOCUMENT_KINDS.find((item) => item === preferredKind) ?? "identity";
  const [kind, setKind] = useState<DocumentKind>(initialKind);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isImporting, setIsImporting] = useState<ImportMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedSourceUri = useRef<string | null>(null);
  const openedRequestedSource = useRef(false);
  const wide = width >= 760;

  useEffect(() => {
    if (openedRequestedSource.current) return;
    openedRequestedSource.current = true;
    if (source === "scan") void scanPaper();
    if (source === "file") void chooseFile();
  }, [source]);

  useEffect(() => () => {
    if (selectedSourceUri.current) deleteTemporarySource(selectedSourceUri.current);
  }, []);

  function replaceSelectedFile(file: SelectedFile) {
    if (selectedSourceUri.current) deleteTemporarySource(selectedSourceUri.current);
    selectedSourceUri.current = file.sourceUri;
    setSelectedFile(file);
  }

  async function chooseFile() {
    if (isImporting || isSaving) return;
    setIsImporting("file");
    let stagedUri: string | null = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "application/octet-stream";
      const fileExtension = extensionFor(asset.name, mimeType);
      stagedUri = await stageTemporarySource(asset.uri, fileExtension);
      replaceSelectedFile({
        sourceUri: stagedUri,
        originalName: asset.name,
        mimeType,
        fileExtension,
      });
      stagedUri = null;
      if (!title) setTitle(defaultTitle(asset.name));
      void Haptics.selectionAsync();
    } catch (error) {
      if (stagedUri) deleteTemporarySource(stagedUri);
      Alert.alert(
        "Couldn't choose file",
        error instanceof Error ? error.message : "File preparation failed.",
      );
    } finally {
      setIsImporting(null);
    }
  }

  async function scanPaper() {
    if (isImporting || isSaving) return;
    setIsImporting("scan");
    let stagedUri: string | null = null;
    try {
      const result = await scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 92,
      });
      const uri = result.scannedImages?.[0];
      if (!uri) return;

      const fileName = `scan-${new Date().toISOString().slice(0, 10)}.jpg`;
      stagedUri = await stageTemporarySource(uri, ".jpg");
      replaceSelectedFile({
        sourceUri: stagedUri,
        originalName: fileName,
        mimeType: "image/jpeg",
        fileExtension: ".jpg",
      });
      stagedUri = null;
      if (!title) setTitle("Scanned document");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (stagedUri) deleteTemporarySource(stagedUri);
      Alert.alert(
        "Couldn't scan",
        error instanceof Error ? error.message : "Scan preparation failed.",
      );
    } finally {
      setIsImporting(null);
    }
  }

  async function save() {
    if (isSaving || isImporting) return;
    if (!selectedFile || !title.trim()) {
      Alert.alert("Document incomplete", "Choose a file and add a name.");
      return;
    }
    if (!isPro && isPurchasesLoading) {
      Alert.alert("Checking access", "Try again in a moment.");
      return;
    }
    if (!canAddDocument(documents.length, isPro)) {
      Alert.alert(
        "Free limit reached",
        `${FREE_DOCUMENT_LIMIT} free documents are included. Berkas Pro makes your encrypted local vault unlimited.`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Explore Pro",
            onPress: () => router.push("/paywall"),
          },
        ],
      );
      return;
    }

    setIsSaving(true);
    let id: string;
    try {
      id = await addDocument({
        ...selectedFile,
        title: title.trim(),
        kind,
        folderId,
        expiresAt: expiry ? formatLocalDate(expiry) : null,
        notes: notes.trim(),
      });
    } catch (error) {
      Alert.alert(
        "Couldn't save document",
        error instanceof Error ? error.message : "Saving failed.",
      );
      setIsSaving(false);
      return;
    }

    if (selectedSourceUri.current === selectedFile.sourceUri) {
      deleteTemporarySource(selectedFile.sourceUri);
      selectedSourceUri.current = null;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (processId && requirementId) {
      try {
        await linkDocument(processId, requirementId, id);
        router.dismissTo({ pathname: "/process/[id]", params: { id: processId } });
        return;
      } catch (error) {
        Alert.alert(
          "Document saved, but not linked",
          error instanceof Error ? error.message : "Open the process and choose this document.",
        );
      }
    }
    router.replace({ pathname: "/document/[id]", params: { id } });
  }

  const accessLabel = isPurchasesLoading
    ? "Checking access..."
    : isPro
      ? "Pro: unlimited documents"
      : `${documents.length} of ${FREE_DOCUMENT_LIMIT} free documents used`;

  return (
    <Screen style={[styles.screenContent, wide ? styles.screenContentWide : null]}>
      <PageHeader title="Add document" />

      <View style={styles.section}>
        <SectionHeading title="Choose a source" detail="PDF or image · limited only by available device resources" />
        <View style={styles.sourceGrid}>
          <SourceButton
            icon="scan"
            label="Scan paper"
            accessibilityHint="Opens the camera document scanner"
            loading={isImporting === "scan"}
            disabled={Boolean(isImporting) || isSaving}
            onPress={() => void scanPaper()}
          />
          <SourceButton
            icon="folder-open"
            label="Choose file"
            accessibilityHint="Opens the system file picker for a PDF or image"
            loading={isImporting === "file"}
            disabled={Boolean(isImporting) || isSaving}
            onPress={() => void chooseFile()}
          />
        </View>

        {selectedFile ? (
          <Surface
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${selectedFile.originalName}, ready`}
            elevation={0}
            style={styles.selectedFile}
          >
            <View style={styles.fileIcon}>
              <AppIcon
                name={selectedFile.mimeType.startsWith("image/") ? "image" : "document"}
                size={24}
                color={colors.forestDark}
              />
            </View>
            <View style={styles.selectedCopy}>
              <Text variant="titleSmall" style={styles.selectedName} numberOfLines={1}>
                {selectedFile.originalName}
              </Text>
            </View>
            <AppIcon name="check-circle" size={24} color={colors.forest} />
          </Surface>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Details" />
        <MaterialCard style={styles.formCard}>
          <TextInput
            mode="outlined"
            label="Document name"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Passport"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            autoCapitalize="sentences"
            maxLength={80}
            returnKeyType="next"
            disabled={isSaving}
          />

          <View style={styles.fieldGroup}>
            <Text variant="labelLarge" style={styles.fieldLabel}>
              Type
            </Text>
            <View style={styles.kindGrid} accessibilityRole="radiogroup">
              {DOCUMENT_KIND_DEFINITIONS.map((item) => {
                const selected = kind === item.value;
                return (
                  <View
                    key={item.value}
                    style={[styles.kindCell, wide ? styles.kindCellWide : null]}
                  >
                    <Chip
                      icon={appIconSource(item.icon)}
                      selected={selected}
                      showSelectedCheck={false}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, disabled: isSaving }}
                      disabled={isSaving}
                      onPress={() => {
                        setKind(item.value);
                        void Haptics.selectionAsync();
                      }}
                      style={[styles.kindChip, selected ? styles.kindChipSelected : null]}
                      textStyle={[
                        styles.kindChipText,
                        selected ? styles.kindChipTextSelected : null,
                      ]}
                    >
                      {item.label}
                    </Chip>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text variant="labelLarge" style={styles.fieldLabel}>Folder</Text>
            <View style={styles.folderChoices} accessibilityRole="radiogroup">
              <Chip
                icon={appIconSource("folder-open")}
                selected={folderId === null}
                showSelectedCheck={false}
                accessibilityRole="radio"
                accessibilityState={{ selected: folderId === null, disabled: isSaving }}
                disabled={isSaving}
                onPress={() => setFolderId(null)}
                style={[styles.folderChip, folderId === null ? styles.kindChipSelected : null]}
                textStyle={[styles.kindChipText, folderId === null ? styles.kindChipTextSelected : null]}
              >
                Unfiled
              </Chip>
              {folders.map((folder) => {
                const selected = folderId === folder.id;
                return (
                  <Chip
                    key={folder.id}
                    icon={appIconSource("folder")}
                    selected={selected}
                    showSelectedCheck={false}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: isSaving }}
                    disabled={isSaving}
                    onPress={() => setFolderId(folder.id)}
                    style={[styles.folderChip, selected ? styles.kindChipSelected : null]}
                    textStyle={[styles.kindChipText, selected ? styles.kindChipTextSelected : null]}
                  >
                    {folder.name}
                  </Chip>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text variant="labelLarge" style={styles.fieldLabel}>
              Expiry date
            </Text>
            <View style={styles.dateRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  expiry
                    ? `Expiry date, ${formatDate(formatLocalDate(expiry))}`
                    : "Expiry date, no expiry date set"
                }
                accessibilityHint="Opens the date picker"
                disabled={isSaving}
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => [
                  styles.dateInput,
                  pressed && !isSaving ? styles.pressed : null,
                ]}
              >
                <AppIcon name="calendar" size={21} color={colors.forest} />
                <Text
                  variant="bodyLarge"
                  style={[styles.dateText, !expiry ? styles.placeholder : null]}
                >
                  {expiry ? formatDate(formatLocalDate(expiry)) : "No expiry date"}
                </Text>
                <AppIcon name="chevron-down" size={18} color={colors.inkMuted} />
              </Pressable>
              {expiry ? (
                <IconButton
                  icon={appIconSource("close")}
                  mode="contained-tonal"
                  accessibilityLabel="Clear expiry date"
                  disabled={isSaving}
                  onPress={() => setExpiry(null)}
                  style={styles.clearDate}
                />
              ) : null}
            </View>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={expiry ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, value) => {
                setShowDatePicker(false);
                if (value) setExpiry(value);
              }}
            />
          ) : null}

          <TextInput
            mode="outlined"
            label="Private note (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Reference number, context, or reminder"
            style={[styles.input, styles.notes]}
            outlineStyle={styles.inputOutline}
            multiline
            textAlignVertical="top"
            maxLength={500}
            disabled={isSaving}
          />
        </MaterialCard>
      </View>

      <HelperText type="info" visible style={styles.accessLabel}>
        {accessLabel}
      </HelperText>
      <Button
        mode="contained"
        icon={appIconSource("document-security")}
        loading={isSaving}
        disabled={isSaving || Boolean(isImporting) || isPurchasesLoading}
        accessibilityLabel={isSaving ? "Encrypting document" : "Secure document in vault"}
        accessibilityState={{
          busy: isSaving || isPurchasesLoading,
          disabled: isSaving || Boolean(isImporting) || isPurchasesLoading,
        }}
        onPress={() => void save()}
        contentStyle={styles.saveButtonContent}
        labelStyle={styles.saveButtonLabel}
        style={styles.saveButton}
      >
        {isSaving ? "Saving..." : "Save to vault"}
      </Button>
    </Screen>
  );
}

function SourceButton({
  icon,
  label,
  accessibilityHint,
  loading,
  disabled,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  accessibilityHint: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      mode="outlined"
      icon={appIconSource(icon)}
      loading={loading}
      disabled={disabled}
      accessibilityLabel={loading ? `${label}, loading` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: loading, disabled }}
      onPress={onPress}
      contentStyle={styles.sourceButtonContent}
      labelStyle={styles.sourceButtonLabel}
      style={styles.sourceButton}
    >
      {loading ? "Loading..." : label}
    </Button>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  screenContentWide: { maxWidth: 920 },
  section: { marginBottom: spacing.xxxl },
  sourceGrid: { flexDirection: "row", gap: spacing.md },
  sourceButton: {
    flex: 1,
    borderRadius: radii.lg,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  sourceButtonContent: {
    minHeight: 88,
    flexDirection: "column",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  sourceButtonLabel: {
    color: colors.forestDark,
    fontFamily: typography.strong,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.72 },
  selectedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.forestSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.signal,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  selectedCopy: { flex: 1 },
  selectedName: { color: colors.ink, fontFamily: typography.strong, marginTop: 2 },
  formCard: { padding: spacing.lg, gap: spacing.xxl },
  input: { backgroundColor: colors.card },
  inputOutline: { borderRadius: radii.md },
  notes: { minHeight: 120 },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { color: colors.ink, fontFamily: typography.strong },
  kindGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  kindCell: { width: "50%", padding: 4 },
  kindCellWide: { width: "25%" },
  kindChip: {
    width: "100%",
    minHeight: 46,
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  kindChipSelected: { backgroundColor: colors.signal },
  kindChipText: { color: colors.inkMuted, fontFamily: typography.label, fontSize: 12 },
  kindChipTextSelected: { color: colors.forestDark },
  folderChoices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  folderChip: { borderRadius: radii.full, backgroundColor: colors.surface },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dateInput: {
    minHeight: 56,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.inkMuted,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  dateText: { flex: 1, color: colors.ink, fontFamily: typography.medium },
  placeholder: { color: colors.inkMuted, fontFamily: typography.body },
  clearDate: { margin: 0 },
  accessLabel: { color: colors.inkMuted, marginVertical: spacing.sm },
  saveButton: { borderRadius: radii.full },
  saveButtonContent: { minHeight: 58, paddingHorizontal: spacing.lg },
  saveButtonLabel: { fontFamily: typography.strong, fontSize: 15 },
});
