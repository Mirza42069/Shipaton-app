import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { colors, radii, spacing, typography } from "@/lib/theme";

export function EmptyVault({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <Surface elevation={0} style={[styles.empty, compact ? styles.compact : null]}>
      <View style={styles.illustration} accessible={false}>
        <View style={[styles.sheet, styles.sheetLeft]} />
        <View style={[styles.sheet, styles.sheetRight]} />
        <View style={styles.folderBack} />
        <View style={styles.folderFront}>
          <AppIcon name="folder-security" size={38} color={colors.forestDark} />
        </View>
      </View>
      <Text variant="headlineSmall" style={styles.title}>Your vault is ready</Text>
      <Text variant="bodyMedium" style={styles.copy}>
        Scan paper or choose a PDF or image. Berkas encrypts it before storing it on this device.
      </Text>
      <Button
        mode="contained"
        icon={appIconSource("add")}
        onPress={() => router.push("/add")}
        contentStyle={styles.buttonContent}
        style={styles.button}
      >
        Add document
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  empty: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  compact: { minHeight: 350 },
  illustration: { width: 190, height: 150, marginBottom: spacing.xxl },
  sheet: {
    position: "absolute",
    top: 7,
    width: 95,
    height: 108,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  sheetLeft: { left: 28, transform: [{ rotate: "-8deg" }] },
  sheetRight: { right: 25, transform: [{ rotate: "8deg" }] },
  folderBack: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    height: 92,
    borderRadius: radii.lg,
    backgroundColor: colors.signal,
  },
  folderFront: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  title: { color: colors.ink, fontFamily: typography.strong, textAlign: "center" },
  copy: { color: colors.inkMuted, fontFamily: typography.body, lineHeight: 21, textAlign: "center", maxWidth: 390, marginTop: spacing.sm },
  button: { borderRadius: radii.full, marginTop: spacing.xxl },
  buttonContent: { minHeight: 52, paddingHorizontal: spacing.lg },
});
