import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton, Screen } from "@/components/screen";
import { colors, typography } from "@/lib/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.code}>404 / MISFILED</Text>
        <Text style={styles.title}>This page is not in the folder.</Text>
        <Text style={styles.copy}>Return to the vault and keep moving.</Text>
        <ActionButton onPress={() => router.replace("/(tabs)")}>Return home</ActionButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", alignItems: "flex-start", gap: 16 },
  code: { color: colors.rust, fontFamily: typography.label, fontWeight: "800", fontSize: 11, letterSpacing: 1.5 },
  title: { color: colors.ink, fontFamily: typography.display, fontWeight: "700", fontSize: 36, lineHeight: 41 },
  copy: { color: colors.inkMuted, fontSize: 14, marginBottom: 8 },
});
