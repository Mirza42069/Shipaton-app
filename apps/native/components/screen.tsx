import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography } from "@/lib/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
}>;

export function Screen({ children, scroll = true, scrollProps }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = [styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 92 }];

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
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {action}
    </View>
  );
}

type ActionButtonProps = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}>;

export function ActionButton({
  children,
  onPress,
  disabled = false,
  variant = "primary",
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.buttonSecondary : null,
        variant === "danger" ? styles.buttonDanger : null,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === "secondary" ? styles.buttonSecondaryLabel : null,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 26,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.forest,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 39,
    lineHeight: 43,
    fontWeight: "700",
    letterSpacing: -1.3,
  },
  detail: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 560,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest,
    borderWidth: 1,
    borderColor: colors.forest,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderColor: colors.ink,
  },
  buttonDanger: {
    backgroundColor: colors.rust,
    borderColor: colors.rust,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: colors.white,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  buttonSecondaryLabel: {
    color: colors.ink,
  },
});
