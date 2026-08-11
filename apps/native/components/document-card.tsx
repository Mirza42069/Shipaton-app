import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text as PaperText } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { MaterialCard } from "@/components/screen";
import { expiryLabel, formatFileSize } from "@/lib/date";
import { colors, radii, spacing, typography } from "@/lib/theme";
import { DOCUMENT_KIND_DEFINITIONS, type VaultDocument } from "@/types/document";

export function DocumentCard({ document, compact = false }: { document: VaultDocument; compact?: boolean }) {
  const router = useRouter();
  const kind = DOCUMENT_KIND_DEFINITIONS.find((item) => item.value === document.kind)!;
  const expiry = expiryLabel(document.expiresAt);

  return (
    <MaterialCard style={[styles.card, compact ? styles.cardCompact : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${document.title}, ${kind.label}, ${expiry.label}${document.isFavorite ? ", favorite" : ""}`}
        accessibilityHint="Opens document details"
        android_ripple={{ color: colors.forestSoft }}
        onPress={() => router.push({ pathname: "/document/[id]", params: { id: document.id } })}
        style={({ pressed }) => [styles.cardContent, pressed && styles.cardPressed]}
      >
        <View style={styles.topRow}>
          <View style={styles.kindMark}>
            <AppIcon name={kind.icon} size={20} color={colors.forestDark} />
          </View>
          <PaperText variant="labelMedium" style={styles.kind}>{kind.shortLabel}</PaperText>
          {document.isFavorite ? (
            <View style={styles.favoriteMark}>
              <AppIcon name="bookmark" size={15} color={colors.forest} />
            </View>
          ) : null}
        </View>

        <PaperText variant="titleLarge" style={styles.documentTitle} numberOfLines={2}>
          {document.title}
        </PaperText>
        <PaperText variant="bodySmall" style={styles.fileMeta} numberOfLines={1}>
          {document.fileExtension.replace(".", "").toUpperCase()} · {formatFileSize(document.fileSize)}
        </PaperText>

        <View style={styles.footer}>
          <View
            style={[
              styles.expiryPill,
              expiry.tone === "danger" ? styles.expiryPillDanger : null,
              expiry.tone === "warning" ? styles.expiryPillWarning : null,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                expiry.tone === "danger" ? styles.statusDanger : null,
                expiry.tone === "warning" ? styles.statusWarning : null,
              ]}
            />
            <PaperText
              variant="labelSmall"
              style={[
                styles.expiry,
                expiry.tone === "danger" ? styles.expiryDanger : null,
                expiry.tone === "warning" ? styles.expiryWarning : null,
              ]}
            >
              {expiry.label}
            </PaperText>
          </View>
          <AppIcon name="chevron-right" size={19} color={colors.inkMuted} />
        </View>
      </Pressable>
    </MaterialCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 188,
    borderRadius: radii.lg,
  },
  cardCompact: {
    minHeight: 174,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardPressed: {
    opacity: 0.78,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kindMark: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
  },
  kind: {
    marginLeft: 9,
    color: colors.forest,
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  favoriteMark: {
    marginLeft: "auto",
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  documentTitle: {
    marginTop: spacing.lg,
    color: colors.ink,
    fontFamily: typography.strong,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  fileMeta: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontFamily: typography.medium,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: spacing.lg,
  },
  expiryPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.forestSoft,
  },
  expiryPillDanger: { backgroundColor: colors.rustSoft },
  expiryPillWarning: { backgroundColor: colors.warningSoft },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
    backgroundColor: colors.forest,
  },
  statusDanger: {
    backgroundColor: colors.rust,
  },
  statusWarning: {
    backgroundColor: colors.warning,
  },
  expiry: {
    color: colors.forestDark,
    fontFamily: typography.label,
  },
  expiryDanger: {
    color: colors.rust,
  },
  expiryWarning: {
    color: colors.warning,
  },
});
