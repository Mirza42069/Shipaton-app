import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { expiryLabel, formatFileSize } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { getDocumentKindDefinition, type VaultDocument } from "@/types/document";

export function DocumentCard({ document, compact = false }: { document: VaultDocument; compact?: boolean }) {
  const router = useRouter();
  const kind = getDocumentKindDefinition(document.kind);
  const expiry = expiryLabel(document.expiresAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${document.title}, ${kind.label}, ${expiry.label}${document.isFavorite ? ", favorite" : ""}`}
      accessibilityHint="Opens document details"
      android_ripple={{ color: colors.forestSoft }}
      onPress={() => router.push({ pathname: "/document/[id]", params: { id: document.id } })}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <Surface elevation={1} style={[styles.card, compact ? styles.compact : null]}>
        <View style={styles.paperObject}>
          <View style={styles.paperBack} />
          <View style={styles.paperTab} />
          <View style={styles.paperFront}>
            <View style={styles.kindIcon}>
              <AppIcon name={kind.icon} size={22} color={colors.forestDark} />
            </View>
            <Text style={styles.extension}>{document.fileExtension.replace(".", "").toUpperCase()}</Text>
            {document.isFavorite ? (
              <AppIcon name="bookmark" size={18} color={colors.forest} filled />
            ) : null}
          </View>
        </View>

        <View style={styles.copy}>
          <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
            {document.title}
          </Text>
          <Text variant="bodySmall" style={styles.meta} numberOfLines={1}>
            {kind.label} · {formatFileSize(document.fileSize)}
          </Text>
          <View style={styles.footer}>
            <View
              style={[
                styles.status,
                expiry.tone === "danger" ? styles.statusDanger : null,
                expiry.tone === "warning" ? styles.statusWarning : null,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  expiry.tone === "danger" ? styles.dotDanger : null,
                  expiry.tone === "warning" ? styles.dotWarning : null,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  expiry.tone === "danger" ? styles.statusTextDanger : null,
                  expiry.tone === "warning" ? styles.statusTextWarning : null,
                ]}
              >
                {expiry.label}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={19} color={colors.inkMuted} />
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: radii.lg, overflow: "hidden" },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  card: {
    minHeight: 176,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    overflow: "hidden",
  },
  compact: { minHeight: 164 },
  paperObject: { width: 96, height: 122, justifyContent: "flex-end" },
  paperBack: {
    position: "absolute",
    left: 9,
    right: 4,
    top: 1,
    height: 106,
    borderRadius: 15,
    backgroundColor: colors.forestSoft,
    transform: [{ rotate: "4deg" }],
  },
  paperTab: {
    position: "absolute",
    right: 9,
    top: 0,
    width: 31,
    height: 16,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: colors.signal,
  },
  paperFront: {
    height: 108,
    borderRadius: 16,
    padding: spacing.md,
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  kindIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
  },
  extension: { color: colors.inkMuted, fontFamily: typography.extraBold, fontSize: 10, letterSpacing: 1 },
  copy: { flex: 1, alignSelf: "stretch", paddingVertical: spacing.xs },
  title: { color: colors.ink, fontFamily: typography.strong, lineHeight: 23 },
  meta: { color: colors.inkMuted, fontFamily: typography.medium, marginTop: 5 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
  },
  statusDanger: { backgroundColor: colors.rustSoft },
  statusWarning: { backgroundColor: colors.warningSoft },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest },
  dotDanger: { backgroundColor: colors.rust },
  dotWarning: { backgroundColor: colors.warning },
  statusText: { color: colors.forestDark, fontFamily: typography.label, fontSize: 10 },
  statusTextDanger: { color: colors.rust },
  statusTextWarning: { color: colors.warning },
});
