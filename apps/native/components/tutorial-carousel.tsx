import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon, appIconSource, type AppIconName } from "@/components/app-icon";
import { colors, radii, spacing, typography } from "@/lib/theme";

type TutorialPage = {
  title: string;
  copy: string;
  icon: AppIconName;
  accent: string;
};

const pages: TutorialPage[] = [
  {
    title: "Add what matters.",
    copy: "Tap Add to scan paper or choose a PDF or image.",
    icon: "add",
    accent: "#DCEBCF",
  },
  {
    title: "Find it fast.",
    copy: "Search the Vault by name, file, or private note.",
    icon: "search",
    accent: "#D7E9E0",
  },
  {
    title: "Finish the process.",
    copy: "Track visa renewals and other checklists by linking proof from your Vault.",
    icon: "list",
    accent: "#FFF1CF",
  },
  {
    title: "Private by default.",
    copy: "Files and process checklists stay encrypted here. Optional Drive backup currently includes vault documents and folders.",
    icon: "folder-security",
    accent: "#DCEBCF",
  },
];

export function TutorialCarousel({ onFinish }: { onFinish: () => void | Promise<void> }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<TutorialPage>>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const lastPage = pageIndex === pages.length - 1;

  function next() {
    if (lastPage) {
      void onFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: pageIndex + 1, animated: true });
    setPageIndex(pageIndex + 1);
  }

  function updatePage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setPageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <AppIcon name="folder" size={22} color={colors.forestDark} strokeWidth={2} />
        </View>
        <Text style={styles.brand}>Berkas</Text>
        {!lastPage ? (
          <Pressable accessibilityRole="button" onPress={() => void onFinish()} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipSpace} />
        )}
      </View>

      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={pages}
        keyExtractor={(item) => item.title}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updatePage}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <View style={[styles.art, { backgroundColor: item.accent }]}>
              <View style={styles.artRing} />
              <View style={styles.artIcon}>
                <AppIcon name={item.icon} size={88} color={colors.forestDark} strokeWidth={1.45} />
              </View>
            </View>
            <Text variant="displaySmall" accessibilityRole="header" style={styles.title}>
              {item.title}
            </Text>
            <Text variant="bodyLarge" style={styles.copy}>
              {item.copy}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Page ${pageIndex + 1} of ${pages.length}`}>
          {pages.map((page, index) => (
            <View key={page.title} style={[styles.dot, index === pageIndex ? styles.dotActive : null]} />
          ))}
        </View>
        <IconButton
          mode="contained"
          icon={appIconSource(lastPage ? "check" : "next")}
          size={25}
          accessibilityLabel={lastPage ? "Get started" : "Next page"}
          onPress={next}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  topBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.signal,
  },
  brand: { flex: 1, color: colors.ink, fontFamily: typography.strong, fontSize: 17, marginLeft: spacing.sm },
  skip: { color: colors.forest, fontFamily: typography.strong, fontSize: 14 },
  skipSpace: { width: 32 },
  page: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  art: {
    height: "52%",
    maxHeight: 430,
    minHeight: 300,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artRing: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: "rgba(49, 69, 43, 0.16)",
  },
  artIcon: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.68)",
  },
  title: {
    color: colors.ink,
    fontFamily: typography.extraBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    marginTop: spacing.xxl,
  },
  copy: { color: colors.inkMuted, fontFamily: typography.body, lineHeight: 24, marginTop: spacing.sm },
  footer: {
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: { height: 24, flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rule },
  dotActive: { width: 28, backgroundColor: colors.forest },
  button: { width: 56, height: 56, borderRadius: radii.full, margin: 0 },
});
