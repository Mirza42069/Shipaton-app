import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { usePreventScreenCapture } from "expo-screen-capture";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";

import { AppIcon } from "@/components/app-icon";
import { ActionButton } from "@/components/screen";
import { TutorialCarousel } from "@/components/tutorial-carousel";
import { DriveSyncProvider } from "@/contexts/drive-sync-context";
import { PaperworkProvider } from "@/contexts/paperwork-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { SecurityProvider, useSecurity } from "@/contexts/security-context";
import { VaultProvider } from "@/contexts/vault-context";
import { initializeDatabase } from "@/lib/database";
import { configureNotifications } from "@/lib/notifications";
import { colors, paperTheme, radii, typography } from "@/lib/theme";
import { hasCompletedTutorial, markTutorialComplete } from "@/lib/tutorial";
import { clearPreviewFiles, clearTemporarySources } from "@/lib/vault-crypto";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

function TutorialGate({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    void hasCompletedTutorial().then(setCompleted).catch(() => setCompleted(false));
  }, []);

  if (completed === null) return <View style={styles.loading} />;
  if (completed) return children;

  return (
    <TutorialCarousel
      onFinish={async () => {
        try {
          await markTutorialComplete();
        } finally {
          setCompleted(true);
        }
      }}
    />
  );
}

function LockGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isLocked, unlock } = useSecurity();

  useEffect(() => {
    if (isLocked) clearPreviewFiles();
  }, [isLocked]);

  if (isLoading) return <View style={styles.loading} />;
  if (!isLocked) return children;

  return (
    <View style={styles.locked}>
      <View style={styles.lockIcon}>
        <AppIcon name="lock" size={31} color={colors.forestDark} />
      </View>
      <Text style={styles.lockTitle}>Vault locked</Text>
      <Text style={styles.lockCopy}>Authenticate to continue.</Text>
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
    clearTemporarySources();
    void configureNotifications();
  }, []);

  return (
    <SQLiteProvider databaseName="berkas.db" onInit={initializeDatabase}>
      <VaultProvider>
        <PaperworkProvider>
          <DriveSyncProvider>
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
                  title: "",
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen name="settings" options={{ title: "" }} />
              <Stack.Screen name="guide" options={{ title: "" }} />
              <Stack.Screen
                name="tutorial"
                options={{ headerShown: false, presentation: "fullScreenModal" }}
              />
              <Stack.Screen
                name="document/[id]"
                options={({ navigation }) => ({
                  title: "",
                  headerLeft: () => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back"
                      onPress={() => navigation.goBack()}
                      hitSlop={12}
                    >
                      <AppIcon name="back" size={24} color={colors.ink} />
                    </Pressable>
                  ),
                })}
              />
              <Stack.Screen name="privacy" options={{ title: "" }} />
              <Stack.Screen name="paperwork/[id]" options={{ title: "" }} />
              <Stack.Screen
                name="link-document"
                options={{ title: "", presentation: "modal" }}
              />
              </Stack>
            </LockGate>
          </DriveSyncProvider>
        </PaperworkProvider>
      </VaultProvider>
    </SQLiteProvider>
  );
}

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <TutorialGate>
          <SecurityProvider>
            <PurchasesProvider>
              <RootStack />
            </PurchasesProvider>
          </SecurityProvider>
        </TutorialGate>
      </PaperProvider>
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
    backgroundColor: colors.paper,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  lockTitle: {
    color: colors.ink,
    fontFamily: typography.display,
    fontWeight: "700",
    fontSize: 42,
    lineHeight: 47,
    letterSpacing: -1.5,
  },
  lockCopy: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 440,
  },
  unlockButton: { marginTop: 30 },
});
