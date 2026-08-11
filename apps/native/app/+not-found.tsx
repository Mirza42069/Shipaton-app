import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { ActionButton, MaterialCard, Screen } from "@/components/screen";
import { colors, radii, spacing, typography } from "@/lib/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen scroll={false} style={styles.screenContent}>
      <View style={styles.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <AppIcon name="leaf" size={34} color={colors.forestDark} />
      </View>
      <MaterialCard style={styles.card}>
        <Text variant="labelLarge" style={styles.code}>
          404
        </Text>
        <Text variant="displaySmall" accessibilityRole="header" style={styles.title}>
          Page not found
        </Text>
        <Text variant="bodyLarge" style={styles.copy}>
          This page doesn't exist.
        </Text>
        <View style={styles.action}>
          <ActionButton icon="home" onPress={() => router.replace("/(tabs)")}>
            Home
          </ActionButton>
        </View>
      </MaterialCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    justifyContent: "center",
  },
  accent: {
    width: 72,
    height: 72,
    zIndex: 1,
    marginLeft: spacing.xxl,
    marginBottom: -36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
    borderWidth: 6,
    borderColor: colors.paper,
  },
  card: {
    paddingTop: 56,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderRadius: radii.xl,
  },
  code: { color: colors.forest, fontFamily: typography.strong },
  title: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    marginTop: spacing.md,
  },
  copy: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    lineHeight: 25,
    marginTop: spacing.md,
    maxWidth: 460,
  },
  action: { marginTop: spacing.xxxl },
});
