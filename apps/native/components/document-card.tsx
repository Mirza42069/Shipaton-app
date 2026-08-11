import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { expiryLabel, formatFileSize } from "@/lib/date";
import { colors, typography } from "@/lib/theme";
import { DOCUMENT_KIND_DEFINITIONS, type VaultDocument } from "@/types/document";

export function DocumentCard({ document, compact = false }: { document: VaultDocument; compact?: boolean }) {
  const router = useRouter();
  const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === document.kind)!;
  const expiry = expiryLabel(document.expiresAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${document.title}`}
      onPress={() => router.push({ pathname: "/document/[id]", params: { id: document.id } })}
      style={({ pressed }) => [styles.card, compact ? styles.cardCompact : null, pressed && styles.cardPressed]}
    >
      <View style={styles.folderTab} />
      <View style={styles.topRow}>
        <View style={styles.kindMark}>
          <Ionicons
            name={kind.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.forest}
          />
        </View>
        <Text style={styles.kind}>{kind.shortLabel}</Text>
        {document.isFavorite ? (
          <Ionicons name="bookmark" size={16} color={colors.rust} style={styles.favorite} />
        ) : null}
      </View>

      <Text style={styles.documentTitle} numberOfLines={2}>
        {document.title}
      </Text>
      <Text style={styles.fileMeta} numberOfLines={1}>
        {document.fileExtension.replace(".", "").toUpperCase()} · {formatFileSize(document.fileSize)}
      </Text>

      <View style={styles.rule} />
      <View style={styles.expiryRow}>
        <View
          style={[
            styles.statusDot,
            expiry.tone === "danger" ? styles.statusDanger : null,
            expiry.tone === "warning" ? styles.statusWarning : null,
          ]}
        />
        <Text style={[styles.expiry, expiry.tone === "danger" ? styles.expiryDanger : null]}>
          {expiry.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 188,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 3,
    padding: 18,
    paddingTop: 22,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    overflow: "visible",
  },
  cardCompact: {
    minHeight: 168,
  },
  cardPressed: {
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.03,
  },
  folderTab: {
    position: "absolute",
    width: 68,
    height: 9,
    left: 16,
    top: -8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.rule,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kindMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
  },
  kind: {
    marginLeft: 9,
    color: colors.forest,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  favorite: {
    marginLeft: "auto",
  },
  documentTitle: {
    marginTop: 17,
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  fileMeta: {
    marginTop: 5,
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  rule: {
    height: 1,
    backgroundColor: colors.rule,
    marginTop: "auto",
    marginBottom: 11,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: colors.forest,
  },
  statusDanger: {
    backgroundColor: colors.rust,
  },
  statusWarning: {
    backgroundColor: "#C4922B",
  },
  expiry: {
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 12,
    fontWeight: "700",
  },
  expiryDanger: {
    color: colors.rust,
  },
});
