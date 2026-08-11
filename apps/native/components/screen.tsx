import { useRouter } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Button, IconButton, Surface, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppIconName, appIconSource } from "@/components/app-icon";
import { colors, radii, spacing, typography } from "@/lib/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, scrollProps, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.content,
    { paddingBottom: Math.max(insets.bottom, spacing.xl) + 112 },
    style,
  ];

  if (!scroll) {
    return <View style={[styles.screen, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={contentStyle}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  detail,
  action,
  showSettings = false,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  action?: ReactNode;
  showSettings?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text variant="displaySmall" style={styles.title}>
          {title}
        </Text>
        {detail ? (
          <Text variant="bodyLarge" style={styles.detail}>
            {detail}
          </Text>
        ) : null}
      </View>
      {action ??
        (showSettings ? (
          <IconButton
            icon={appIconSource("settings")}
            mode="contained-tonal"
            size={24}
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
          />
        ) : null)}
    </View>
  );
}

type ActionButtonProps = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: AppIconName;
}>;

export function ActionButton({
  children,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
}: ActionButtonProps) {
  const outlined = variant === "secondary";
  return (
    <Button
      mode={outlined ? "outlined" : "contained"}
      icon={icon ? appIconSource(icon) : undefined}
      disabled={disabled}
      onPress={onPress}
      buttonColor={variant === "danger" ? colors.rust : undefined}
      textColor={outlined ? colors.forestDark : undefined}
      contentStyle={styles.buttonContent}
      labelStyle={styles.buttonLabel}
      style={styles.button}
    >
      {children}
    </Button>
  );
}

export function MaterialCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <Surface elevation={1} style={[styles.card, style]}>
      {children}
    </Surface>
  );
}

export function SectionHeading({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionCopy}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {title}
        </Text>
        {detail ? (
          <Text variant="bodyMedium" style={styles.sectionDetail}>
            {detail}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.forest,
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.1,
  },
  detail: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 600,
  },
  settingsButton: {
    margin: 0,
    marginTop: 4,
  },
  button: {
    borderRadius: radii.full,
  },
  buttonContent: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  buttonLabel: {
    fontFamily: typography.strong,
    fontSize: 14,
    letterSpacing: 0,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    overflow: "hidden",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: {
    color: colors.ink,
    fontFamily: typography.strong,
  },
  sectionDetail: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    marginTop: 3,
  },
});
