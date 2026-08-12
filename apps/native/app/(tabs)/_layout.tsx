import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppIcon } from "@/components/app-icon";
import { colors, radii, typography } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <AppIcon name="dashboard" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => <AppIcon name="vault" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="processes"
        options={{
          title: "Processes",
          tabBarIcon: ({ color, size }) => <AppIcon name="list" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}

type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function FloatingTabBar({ state, descriptors, navigation, insets }: FloatingTabBarProps) {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  return (
    <View pointerEvents="box-none" style={[styles.shell, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const title = String(options.title ?? route.name);
          const focused = state.index === index;

          return (
            <AnimatedTab
              key={route.key}
              title={title}
              focused={focused}
              reduceMotion={reduceMotion}
              renderIcon={(color, size) => options.tabBarIcon?.({ focused, color, size }) ?? null}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (event.defaultPrevented) return;
                if (!focused) void Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            />
          );
        })}
      </View>
      <AddButton reduceMotion={reduceMotion} onPress={() => router.push("/add")} />
    </View>
  );
}

function AnimatedTab({
  title,
  focused,
  reduceMotion,
  renderIcon,
  onPress,
  onLongPress,
}: {
  title: string;
  focused: boolean;
  reduceMotion: boolean;
  renderIcon: (color: string, size: number) => ReactNode;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const selection = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pressed = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      selection.setValue(focused ? 1 : 0);
      return;
    }
    Animated.spring(selection, {
      toValue: focused ? 1 : 0,
      stiffness: 360,
      damping: 30,
      mass: 0.75,
      useNativeDriver: false,
    }).start();
  }, [focused, reduceMotion, selection]);

  function animatePress(toValue: number) {
    if (reduceMotion) return;
    Animated.spring(pressed, {
      toValue,
      stiffness: 500,
      damping: 28,
      mass: 0.5,
      useNativeDriver: true,
    }).start();
  }

  const labelWidth = Math.min(title.length * 7.5 + 4, 74);

  return (
    <Animated.View style={[styles.tabSlot, { flexGrow: selection.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.72] }) }]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={title}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => animatePress(0.92)}
        onPressOut={() => animatePress(1)}
        style={styles.tabPressable}
      >
        <Animated.View style={[styles.tabPressSurface, { transform: [{ scale: pressed }] }]}>
          <Animated.View
            style={[
              styles.tabContent,
              {
                backgroundColor: selection.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.surfaceRaised, colors.signal],
                }),
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: selection.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              }}
            >
              {renderIcon(focused ? colors.forestDark : colors.inkMuted, 22)}
            </Animated.View>
            <Animated.View
              style={[
                styles.labelClip,
                {
                  width: selection.interpolate({ inputRange: [0, 1], outputRange: [0, labelWidth] }),
                  opacity: selection,
                  transform: [{ translateX: selection.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
                },
              ]}
            >
              <Text numberOfLines={1} style={styles.tabLabel}>{title}</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function AddButton({ reduceMotion, onPress }: { reduceMotion: boolean; onPress: () => void }) {
  const pressed = useRef(new Animated.Value(1)).current;

  function animatePress(toValue: number) {
    if (reduceMotion) return;
    Animated.spring(pressed, {
      toValue,
      stiffness: 500,
      damping: 28,
      mass: 0.5,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add document"
      onPress={onPress}
      onPressIn={() => animatePress(0.94)}
      onPressOut={() => animatePress(1)}
    >
      <Animated.View style={[styles.addButton, { transform: [{ scale: pressed }] }]}>
        <AppIcon name="add" size={25} color={colors.white} strokeWidth={2} />
        <Text style={styles.addLabel}>Add</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bar: {
    flex: 1,
    height: 64,
    flexDirection: "row",
    alignItems: "stretch",
    padding: 5,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    elevation: 7,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  tabSlot: {
    flexBasis: 0,
    minWidth: 0,
  },
  tabPressable: {
    flex: 1,
  },
  tabPressSurface: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    overflow: "hidden",
  },
  labelClip: {
    overflow: "hidden",
    marginLeft: 7,
  },
  tabLabel: {
    color: colors.forestDark,
    fontFamily: typography.strong,
    fontSize: 13,
    lineHeight: 18,
  },
  addButton: {
    width: 92,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radii.full,
    backgroundColor: colors.forestDark,
    elevation: 7,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  addLabel: {
    color: colors.white,
    fontFamily: typography.strong,
    fontSize: 15,
  },
});
