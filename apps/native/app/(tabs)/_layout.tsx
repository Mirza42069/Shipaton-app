import { Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { BottomNavigation, FAB } from "react-native-paper";

import { AppIcon, appIconSource } from "@/components/app-icon";
import { colors, radii } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="dashboard" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="vault" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="paperwork"
        options={{
          title: "Plans",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="plans" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function FloatingTabBar({ state, descriptors, navigation, insets }: FloatingTabBarProps) {
  const router = useRouter();
  const paperState = {
    index: state.index,
    routes: state.routes.map((route) => ({
      key: route.key,
      title: descriptors[route.key].options.title ?? route.name,
      accessibilityLabel: descriptors[route.key].options.title ?? route.name,
    })),
  };

  return (
    <View pointerEvents="box-none" style={[styles.shell, { bottom: Math.max(insets.bottom, 12) }]}>
      <BottomNavigation.Bar
        navigationState={paperState}
        safeAreaInsets={{ bottom: 0 }}
        shifting
        labeled={false}
        activeColor={colors.forestDark}
        inactiveColor={colors.inkMuted}
        activeIndicatorStyle={styles.activeIndicator}
        style={styles.bar}
        getLabelText={({ route }) => route.title}
        renderIcon={({ route, focused, color }) => {
          const originalRoute = state.routes.find((item) => item.key === route.key);
          return originalRoute
            ? descriptors[originalRoute.key].options.tabBarIcon?.({ focused, color, size: 23 }) ?? null
            : null;
        }}
        onTabPress={({ route, preventDefault }) => {
          const originalRoute = state.routes.find((item) => item.key === route.key);
          if (!originalRoute) return;
          const event = navigation.emit({
            type: "tabPress",
            target: originalRoute.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) {
            preventDefault();
            return;
          }
          navigation.navigate(originalRoute.name, originalRoute.params);
        }}
      />
      <FAB
        icon={appIconSource("add")}
        mode="elevated"
        color={colors.white}
        accessibilityLabel="Add document"
        onPress={() => router.push("/add")}
        style={styles.fab}
        customSize={64}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bar: {
    flex: 1,
    height: 68,
    borderRadius: radii.full,
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    elevation: 5,
  },
  activeIndicator: {
    backgroundColor: colors.signal,
  },
  fab: {
    borderRadius: radii.full,
    backgroundColor: colors.forestDark,
  },
});
