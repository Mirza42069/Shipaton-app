import { useDeferredValue, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button, Dialog, IconButton, Portal, Searchbar, Surface, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { EmptyVault } from "@/components/empty-vault";
import { PageHeader, Screen } from "@/components/screen";
import { useVault } from "@/contexts/vault-context";
import { formatFileSize } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { getDocumentKindDefinition, type VaultDocument, type VaultFolder } from "@/types/document";

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { documents, folders, isLoading, addFolder, renameFolder, deleteFolder } = useVault();
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [folderDialog, setFolderDialog] = useState<"create" | "rename" | null>(null);
  const [folderName, setFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const currentFolder = folderId ? folders.find((folder) => folder.id === folderId) ?? null : null;

  const visibleDocuments = documents
    .filter((document) => {
      if (folderId && document.folderId !== folderId) return false;
      if (!deferredQuery) return true;
      const kind = getDocumentKindDefinition(document.kind);
      return [document.title, document.originalName, document.notes, kind.label]
        .some((value) => value.toLowerCase().includes(deferredQuery));
    })
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  function openCreateFolder() {
    setFolderName("");
    setFolderDialog("create");
  }

  function openRenameFolder() {
    if (!currentFolder) return;
    setFolderName(currentFolder.name);
    setFolderDialog("rename");
  }

  async function saveFolder() {
    if (!folderName.trim() || savingFolder) return;
    setSavingFolder(true);
    try {
      if (folderDialog === "rename" && currentFolder) {
        await renameFolder(currentFolder.id, folderName);
      } else {
        const id = await addFolder(folderName);
        setFolderId(id);
      }
      setFolderDialog(null);
    } catch (error) {
      Alert.alert("Folder not saved", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSavingFolder(false);
    }
  }

  function confirmDeleteFolder() {
    if (!currentFolder) return;
    Alert.alert(
      `Delete ${currentFolder.name}?`,
      "Files in this folder will stay safe in your vault and become unfiled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete folder",
          style: "destructive",
          onPress: () => void deleteFolder(currentFolder.id).then(() => setFolderId(undefined)),
        },
      ],
    );
  }

  const emptyVault = !isLoading && documents.length === 0 && folders.length === 0;

  return (
    <Screen scroll={false} style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.xl) }]}>
      <FlatList
        data={isLoading ? [] : visibleDocuments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileRow
            document={item}
            onPress={() => router.push({ pathname: "/document/[id]", params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 92 }]}
        ListHeaderComponent={
          <>
            <PageHeader
              title={currentFolder?.name ?? "Vault"}
              detail={`${visibleDocuments.length} ${visibleDocuments.length === 1 ? "file" : "files"} · encrypted on this device`}
              showSettings={!currentFolder}
              action={currentFolder ? (
                <View style={styles.folderActions}>
                  <IconButton icon={appIconSource("edit")} mode="contained-tonal" size={20} accessibilityLabel="Rename folder" onPress={openRenameFolder} />
                  <IconButton icon={appIconSource("delete")} mode="contained-tonal" iconColor={colors.rust} size={20} accessibilityLabel="Delete folder" onPress={confirmDeleteFolder} />
                </View>
              ) : undefined}
            />

            <View style={styles.searchRow}>
              {currentFolder ? (
                <IconButton icon={appIconSource("back")} size={22} accessibilityLabel="Back to vault" onPress={() => { setFolderId(undefined); setQuery(""); }} style={styles.backButton} />
              ) : null}
              <Searchbar
                value={query}
                onChangeText={setQuery}
                placeholder="Search names and tags"
                accessibilityLabel="Search vault"
                clearAccessibilityLabel="Clear search"
                elevation={0}
                icon={appIconSource("search")}
                clearIcon={appIconSource("close")}
                inputStyle={styles.searchInput}
                style={styles.search}
              />
              {!currentFolder ? (
                <IconButton icon={appIconSource("folder-add")} mode="contained-tonal" size={22} accessibilityLabel="Create folder" onPress={openCreateFolder} style={styles.addFolderButton} />
              ) : null}
            </View>

            {!currentFolder && !deferredQuery && folders.length > 0 ? (
              <View style={styles.folderSection}>
                <Text style={styles.sectionLabel}>FOLDERS</Text>
                <View style={styles.folderGrid}>
                  {folders.map((folder) => (
                    <FolderTile
                      key={folder.id}
                      folder={folder}
                      count={documents.filter((document) => document.folderId === folder.id).length}
                      onPress={() => { setFolderId(folder.id); setQuery(""); }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {!emptyVault && !isLoading ? (
              <View style={styles.filesHeading}>
                <Text style={styles.sectionLabel}>{deferredQuery ? "SEARCH RESULTS" : currentFolder ? "FILES" : "LIBRARY"}</Text>
                <Text style={styles.fileCount}>{visibleDocuments.length}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          emptyVault ? (
            <EmptyVault compact />
          ) : isLoading ? (
            <View style={styles.loading}><Text style={styles.emptyCopy}>Opening encrypted vault...</Text></View>
          ) : (
            <View style={styles.emptyFolder}>
              <AppIcon name={deferredQuery ? "search" : "folder-open"} size={34} color={colors.forestDark} />
              <Text style={styles.emptyTitle}>{deferredQuery ? "No files found" : "This folder is empty"}</Text>
              <Text style={styles.emptyCopy}>{deferredQuery ? "Try another name or tag." : "Move or save files here when you need them."}</Text>
            </View>
          )
        }
      />

      <Portal>
        <Dialog visible={folderDialog !== null} onDismiss={() => setFolderDialog(null)} style={styles.dialog}>
          <Dialog.Title>{folderDialog === "rename" ? "Rename folder" : "New folder"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Folder name"
              value={folderName}
              onChangeText={setFolderName}
              maxLength={80}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void saveFolder()}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFolderDialog(null)}>Cancel</Button>
            <Button loading={savingFolder} disabled={!folderName.trim() || savingFolder} onPress={() => void saveFolder()}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

function FolderTile({ folder, count, onPress }: { folder: VaultFolder; count: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${folder.name}, ${count} files`} onPress={onPress} style={({ pressed }) => [styles.folderTile, pressed ? styles.pressed : null]}>
      <AppIcon name="folder" size={31} color={colors.forest} />
      <View style={styles.folderCopy}>
        <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
        <Text style={styles.folderCount}>{count} {count === 1 ? "file" : "files"}</Text>
      </View>
      <AppIcon name="chevron-right" size={17} color={colors.inkMuted} />
    </Pressable>
  );
}

function FileRow({ document, onPress }: { document: VaultDocument; onPress: () => void }) {
  const kind = getDocumentKindDefinition(document.kind);
  const extension = document.fileExtension.replace(".", "").toUpperCase() || "FILE";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${document.title}, ${kind.label}`} onPress={onPress} style={({ pressed }) => [styles.fileRow, pressed ? styles.pressed : null]}>
      <Surface elevation={0} style={styles.fileIcon}>
        <AppIcon name={document.mimeType.startsWith("image/") ? "image" : "document"} size={24} color={colors.forestDark} />
        <Text style={styles.extension}>{extension.slice(0, 4)}</Text>
      </Surface>
      <View style={styles.fileCopy}>
        <Text style={styles.fileTitle} numberOfLines={1}>{document.title}</Text>
        <Text style={styles.fileMeta} numberOfLines={1}>{kind.label} · {formatFileSize(document.fileSize)}</Text>
      </View>
      {document.isFavorite ? <AppIcon name="bookmark" size={17} color={colors.forest} /> : null}
      <AppIcon name="chevron-right" size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { flexGrow: 1 },
  folderActions: { flexDirection: "row" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  search: { flex: 1, height: 56, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule },
  searchInput: { color: colors.ink, fontFamily: typography.body, fontSize: 15, minHeight: 0 },
  backButton: { margin: 0 },
  addFolderButton: { margin: 0 },
  sectionLabel: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 11, letterSpacing: 0.8 },
  folderSection: { marginTop: spacing.xl },
  folderGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginTop: spacing.sm },
  folderTile: { width: "50%", minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderWidth: 4, borderColor: colors.paper, borderRadius: radii.md, backgroundColor: colors.surface },
  folderCopy: { flex: 1, minWidth: 0 },
  folderName: { color: colors.ink, fontFamily: typography.strong, fontSize: 13 },
  folderCount: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 3 },
  filesHeading: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  fileCount: { color: colors.inkMuted, fontFamily: typography.medium, fontSize: 11 },
  separator: { height: 1, marginLeft: 72, backgroundColor: colors.rule },
  fileRow: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radii.md },
  fileIcon: { width: 52, height: 60, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule },
  extension: { color: colors.forestDark, fontFamily: typography.extraBold, fontSize: 8, letterSpacing: 0.5 },
  fileCopy: { flex: 1, minWidth: 0 },
  fileTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 14 },
  fileMeta: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, marginTop: 4 },
  emptyFolder: { minHeight: 300, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xxl },
  emptyTitle: { color: colors.ink, fontFamily: typography.strong, fontSize: 18, marginTop: spacing.sm },
  emptyCopy: { color: colors.inkMuted, fontFamily: typography.body, textAlign: "center" },
  loading: { minHeight: 260, alignItems: "center", justifyContent: "center" },
  dialog: { borderRadius: radii.lg, backgroundColor: colors.card },
  pressed: { opacity: 0.7 },
});
