import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { usePreventScreenCapture } from "expo-screen-capture";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ActionButton } from "@/components/screen";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { SecurityProvider, useSecurity } from "@/contexts/security-context";
import { VaultProvider } from "@/contexts/vault-context";
import { initializeDatabase } from "@/lib/database";
import { configureNotifications } from "@/lib/notifications";
import { colors, typography } from "@/lib/theme";
import { clearPreviewFiles } from "@/lib/vault-crypto";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function LockGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isLocked, unlock } = useSecurity();

  if (isLoading) return <View style={styles.loading} />;
  if (!isLocked) return children;

  return (
    <View style={styles.locked}>
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={31} color={colors.signal} />
      </View>
      <Text style={styles.lockEyebrow}>PRIVATE BY DEFAULT</Text>
      <Text style={styles.lockTitle}>Your proof stays yours.</Text>
      <Text style={styles.lockCopy}>Authenticate to open the encrypted document vault.</Text>
      <View style={styles.unlockButton}>
        <ActionButton onPress={() => void unlock()}>Unlock vault</ActionButton>
      </View>
    </View>
  );
}

function RootStack() {
  usePreventScreenCapture("vault-content");

  useEffect(() => {
    clearPreviewFiles();
    void configureNotifications();
  }, []);

  return (
    <SQLiteProvider databaseName="pocketproof.db" onInit={initializeDatabase}>
      <VaultProvider>
        <LockGate>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.paper },
              headerStyle: { backgroundColor: colors.paper },
              headerTintColor: colors.ink,
              headerTitleStyle: { fontFamily: typography.label, fontWeight: "800" },
              headerShadowVisible: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add"
              options={{
                title: "NEW DOCUMENT",
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="document/[id]"
              options={({ navigation }) => ({
                title: "DOCUMENT",
                headerLeft: () => (
                  <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <Ionicons name="arrow-back" size={24} color={colors.ink} />
                  </Pressable>
                ),
              })}
            />
            <Stack.Screen name="privacy" options={{ title: "PRIVACY" }} />
          </Stack>
        </LockGate>
      </VaultProvider>
    </SQLiteProvider>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SecurityProvider>
        <PurchasesProvider>
          <StatusBar style="dark" />
          <RootStack />
        </PurchasesProvider>
      </SecurityProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.paper },
  locked: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    backgroundColor: colors.forest,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: colors.signal,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  lockEyebrow: {
    color: colors.signal,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 2,
  },
  lockTitle: {
    color: colors.white,
    fontFamily: typography.display,
    fontWeight: "700",
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: -1.5,
    marginTop: 10,
  },
  lockCopy: {
    color: colors.forestSoft,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 440,
  },
  unlockButton: { marginTop: 30 },
});
