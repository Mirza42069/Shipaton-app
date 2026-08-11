import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { MaterialCard } from "@/components/screen";
import { colors, radii, spacing, typography } from "@/lib/theme";

export function EmptyVault({ compact = false }: { compact?: boolean }) {
  return (
    <MaterialCard style={[styles.empty, compact ? styles.compact : null]}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel="Vault empty. Add a document to get started."
        style={styles.content}
      >
        <View style={styles.stamp}>
          <AppIcon name="document-security" size={32} color={colors.forestDark} />
        </View>
        <Text variant="headlineSmall" style={styles.title}>Vault empty</Text>
      </View>
    </MaterialCard>
  );
}

const styles = StyleSheet.create({
  empty: {
    minHeight: 340,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  compact: {
    minHeight: 280,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  stamp: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.strong,
    lineHeight: 30,
    textAlign: "center",
    maxWidth: 380,
  },
});
