import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DocumentScanner from "react-native-document-scanner-plugin";

import { ActionButton, Screen } from "@/components/screen";
import { usePurchases } from "@/contexts/purchases-context";
import { useVault } from "@/contexts/vault-context";
import { formatDate } from "@/lib/date";
import { colors, typography } from "@/lib/theme";
import {
  DOCUMENT_KIND_DEFINITIONS,
  type DocumentKind,
  type NewVaultDocument,
} from "@/types/document";

type SelectedFile = Pick<
  NewVaultDocument,
  "sourceUri" | "originalName" | "mimeType" | "fileExtension"
>;

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
  const router = useRouter();
  const { documents, addDocument } = useVault();
  const { isPro } = usePurchases();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocumentKind>("identity");
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function chooseFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
      base64: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "application/octet-stream";
    setSelectedFile({
      sourceUri: asset.uri,
      originalName: asset.name,
      mimeType,
      fileExtension: extensionFor(asset.name, mimeType),
    });
    if (!title) setTitle(defaultTitle(asset.name));
    void Haptics.selectionAsync();
  }

  async function scanPaper() {
    const result = await DocumentScanner.scanDocument({
      maxNumDocuments: 1,
      croppedImageQuality: 92,
    });
    const uri = result.scannedImages?.[0];
    if (!uri) return;

    const fileName = `scan-${new Date().toISOString().slice(0, 10)}.jpg`;
    setSelectedFile({
      sourceUri: uri,
      originalName: fileName,
      mimeType: "image/jpeg",
      fileExtension: ".jpg",
    });
    if (!title) setTitle("Scanned document");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function save() {
    if (!selectedFile || !title.trim()) {
      Alert.alert("Document not ready", "Choose a file and give it a clear name first.");
      return;
    }
    if (!isPro && documents.length >= 10) {
      Alert.alert(
        "Free vault is full",
        "Pocketproof Free secures up to 10 documents. Unlock Pro from Settings for an unlimited vault.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const id = await addDocument({
        ...selectedFile,
        title,
        kind,
        expiresAt: expiry ? expiry.toISOString().slice(0, 10) : null,
        notes,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/document/[id]", params: { id } });
    } catch (error) {
      Alert.alert(
        "Could not secure document",
        error instanceof Error ? error.message : "The document could not be encrypted.",
      );
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>01 / SOURCE</Text>
      <Text style={styles.heading}>Bring one important thing in.</Text>

      <View style={styles.sourceGrid}>
        <SourceButton icon="scan-outline" label="Scan paper" onPress={() => void scanPaper()} />
        <SourceButton icon="folder-open-outline" label="Choose file" onPress={() => void chooseFile()} />
      </View>

      {selectedFile ? (
        <View style={styles.selectedFile}>
          <View style={styles.fileIcon}>
            <Ionicons
              name={selectedFile.mimeType.startsWith("image/") ? "image-outline" : "document-text-outline"}
              size={24}
              color={colors.forest}
            />
          </View>
          <View style={styles.selectedCopy}>
            <Text style={styles.selectedLabel}>READY TO ENCRYPT</Text>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selectedFile.originalName}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={colors.forest} />
        </View>
      ) : null}

      <View style={styles.sectionRule} />
      <Text style={styles.eyebrow}>02 / INDEX</Text>

      <Text style={styles.label}>Document name</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Passport"
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
        autoCapitalize="sentences"
        maxLength={80}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.kindGrid}>
        {DOCUMENT_KIND_DEFINITIONS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => {
              setKind(item.value);
              void Haptics.selectionAsync();
            }}
            style={[styles.kindButton, kind === item.value ? styles.kindButtonActive : null]}
          >
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={kind === item.value ? colors.signal : colors.forest}
            />
            <Text style={[styles.kindLabel, kind === item.value ? styles.kindLabelActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Expiry date</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
        <Ionicons name="calendar-clear-outline" size={20} color={colors.forest} />
        <Text style={[styles.dateText, !expiry ? styles.placeholder : null]}>
          {expiry ? formatDate(expiry.toISOString().slice(0, 10)) : "No expiry date"}
        </Text>
        {expiry ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              setExpiry(null);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </Pressable>

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

      <Text style={styles.label}>Private note</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional context, reference number, or reminder"
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, styles.notes]}
        multiline
        textAlignVertical="top"
        maxLength={500}
      />

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed-outline" size={19} color={colors.forest} />
        <Text style={styles.securityCopy}>
          AES-256 encrypted. The original is never uploaded to Pocketproof or a document server.
        </Text>
      </View>

      <ActionButton onPress={() => void save()} disabled={isSaving}>
        {isSaving ? "Encrypting…" : "Secure in vault"}
      </ActionButton>
    </Screen>
  );
}

function SourceButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={27} color={colors.forest} />
      <Text style={styles.sourceLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.rust,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  heading: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: 22,
  },
  sourceGrid: { flexDirection: "row", gap: 12 },
  sourceButton: {
    flex: 1,
    minHeight: 108,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  sourceLabel: {
    color: colors.ink,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.85 },
  selectedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    marginTop: 12,
    backgroundColor: colors.forestSoft,
    borderWidth: 1,
    borderColor: colors.forest,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  selectedCopy: { flex: 1 },
  selectedLabel: {
    color: colors.forest,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 9,
    letterSpacing: 1.2,
  },
  selectedName: { color: colors.ink, fontWeight: "700", fontSize: 13, marginTop: 3 },
  sectionRule: { height: 1, backgroundColor: colors.rule, marginVertical: 30 },
  label: {
    color: colors.ink,
    fontFamily: typography.label,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 15,
    fontFamily: typography.body,
    fontSize: 15,
  },
  notes: { minHeight: 105, paddingTop: 14 },
  kindGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kindButton: {
    width: "48.5%",
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  kindButtonActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  kindLabel: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  kindLabelActive: { color: colors.white },
  dateInput: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 15,
  },
  dateText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
  placeholder: { color: colors.inkMuted, fontWeight: "400" },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 22,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.forest,
    backgroundColor: colors.forestSoft,
  },
  securityCopy: { flex: 1, color: colors.forest, fontSize: 12, lineHeight: 18 },
});
