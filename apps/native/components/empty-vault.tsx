import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/screen";
import { colors, typography } from "@/lib/theme";

export function EmptyVault({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  return (
    <View style={[styles.empty, compact ? styles.compact : null]}>
      <View style={styles.stamp}>
        <Ionicons name="document-lock-outline" size={31} color={colors.forest} />
      </View>
      <Text style={styles.title}>Nothing important is scattered yet.</Text>
      <Text style={styles.copy}>
        Scan a document or choose a PDF. Pocketproof encrypts it before placing it in your vault.
      </Text>
      <View style={styles.action}>
        <ActionButton onPress={() => router.push("/add")}>Add first document</ActionButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    minHeight: 340,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 26,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.inkMuted,
    backgroundColor: colors.card,
  },
  compact: {
    minHeight: 280,
  },
  stamp: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: colors.forest,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-5deg" }],
    marginBottom: 22,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "700",
    maxWidth: 380,
  },
  copy: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 22,
    maxWidth: 440,
  },
  action: {
    alignSelf: "stretch",
  },
});
