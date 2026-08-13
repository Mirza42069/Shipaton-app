import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TouchableRipple } from "react-native-paper";

import { AppIcon, appIconSource, type AppIconName } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen } from "@/components/screen";
import { colors, radii, spacing, typography } from "@/lib/theme";

type Chapter = {
  title: string;
  icon: AppIconName;
  points: string[];
};

const chapters: Chapter[] = [
  {
    title: "Quick start",
    icon: "add",
    points: ["Tap Add.", "Scan paper or choose a file.", "Name it, choose a type, then secure it."],
  },
  {
    title: "Your Vault",
    icon: "vault",
    points: ["Search names, files, and private notes.", "Use type filters to narrow the list.", "Open a card to view, share, or delete it."],
  },
  {
    title: "Expiry dates",
    icon: "calendar",
    points: ["Add an expiry date when saving.", "Berkas highlights documents that need attention.", "Reminders stay on this device."],
  },
  {
    title: "Processes",
    icon: "list",
    points: [
      "Start a visa or passport renewal template, or create your own.",
      "Link proof from the Vault and confirm each requirement.",
      "Process checklists stay encrypted on this device and are not included in Drive backup yet.",
    ],
  },
  {
    title: "Security",
    icon: "folder-security",
    points: ["Files and metadata are encrypted locally.", "Turn on biometric lock in Settings.", "Screenshots and recent-app previews are blocked."],
  },
  {
    title: "Pro and Google Drive",
    icon: "cloud",
    points: ["Free includes 10 local documents with no fixed file-size limit.", "A one-time Pro purchase unlocks unlimited local documents.", "Optional Drive backups are encrypted before upload and require your recovery key to restore."],
  },
];

export default function GuideScreen() {
  const router = useRouter();
  const [openChapter, setOpenChapter] = useState(0);

  return (
    <Screen>
      <PageHeader title="Berkas Guide" />
      <Button
        mode="contained-tonal"
        icon={appIconSource("sparkles")}
        onPress={() => router.push("/tutorial")}
        contentStyle={styles.tourButtonContent}
        labelStyle={styles.tourButtonLabel}
        style={styles.tourButton}
      >
        Replay quick tour
      </Button>

      <View style={styles.chapters}>
        {chapters.map((chapter, index) => {
          const open = index === openChapter;
          return (
            <MaterialCard key={chapter.title}>
              <TouchableRipple
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenChapter(open ? -1 : index)}
              >
                <View style={styles.chapterHeader}>
                  <View style={styles.chapterIcon}>
                    <AppIcon name={chapter.icon} size={23} color={colors.forestDark} />
                  </View>
                  <Text variant="titleMedium" style={styles.chapterTitle}>
                    {chapter.title}
                  </Text>
                  <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
                    <AppIcon name="chevron-down" size={20} color={colors.inkMuted} />
                  </View>
                </View>
              </TouchableRipple>
              {open ? (
                <View style={styles.points}>
                  {chapter.points.map((point) => (
                    <View key={point} style={styles.point}>
                      <View style={styles.check}>
                        <AppIcon name="check" size={14} color={colors.forestDark} strokeWidth={2.2} />
                      </View>
                      <Text variant="bodyMedium" style={styles.pointText}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </MaterialCard>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tourButton: { alignSelf: "flex-start", borderRadius: radii.full, marginBottom: spacing.xxl },
  tourButtonContent: { minHeight: 48, paddingHorizontal: spacing.sm },
  tourButtonLabel: { fontFamily: typography.strong },
  chapters: { gap: spacing.md },
  chapterHeader: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chapterIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forestSoft,
  },
  chapterTitle: { flex: 1, color: colors.ink, fontFamily: typography.strong },
  points: { gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.rule, padding: spacing.lg },
  point: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  check: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
  },
  pointText: { flex: 1, color: colors.inkMuted, lineHeight: 21 },
});
