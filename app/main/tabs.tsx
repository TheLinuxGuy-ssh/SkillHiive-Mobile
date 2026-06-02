import { useTheme } from "@/hooks/useTheme";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import React, { useLayoutEffect, useRef } from "react";
import {
  LayoutRectangle,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/FontAwesome6";

const tabs = [
  { name: "index", label: "Home", icon: "house" },
  // { name: "learn", label: "Learn", icon: "brain" },
  { name: "feed", label: "Feed", icon: "comments" },
  { name: "profile", label: "Profile", icon: "user" },
];

const SPRING = { damping: 220, stiffness: 4020 };

export const LinkNav = ({ state, navigation, onScrollRef }: any) => {
  // Use a plain object keyed by index — avoids any array mutation issues
  const layouts = useRef<Record<number, LayoutRectangle>>({});
  const { colors } = useTheme();

  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  const pillBaseX = useSharedValue(0);

  const heights = tabs.map((_, i) => useSharedValue(i === 0 ? 0 : 20));

  useLayoutEffect(() => {
    if (!onScrollRef) return;
    onScrollRef.current = (position: number, offset: number) => {
      const fromLayout = layouts.current[position];
      const toLayout = layouts.current[position + 1] ?? fromLayout;
      if (!fromLayout || !toLayout) return;

      translateX.value = fromLayout.x + (toLayout.x - fromLayout.x) * offset;
      width.value =
        fromLayout.width + (toLayout.width - fromLayout.width) * offset;
    };
  }, [onScrollRef]);

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex(
      (t) => t.name === state.routes[state.index]?.name,
    );
    if (activeIndex === -1) return;

    const layout = layouts.current[activeIndex];
    if (layout) {
      translateX.value = withSpring(layout.x, SPRING);
      width.value = withSpring(layout.width, SPRING);
      pillBaseX.value = layout.x;
    }

    heights.forEach((h, i) => {
      h.value = withTiming(i === activeIndex ? 0 : 20, { duration: 180 });
    });
  }, [state.index]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: width.value,
  }));

  const navigate = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    navigation.navigate(query);
  };

  const snapToNearestTab = (currentX: number): number => {
    "worklet";
    let nearestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < tabs.length; i++) {
      const layout = layouts.current[i];
      if (!layout) continue;
      const center = layout.x + layout.width / 2;
      const dist = Math.abs(currentX + width.value / 2 - center);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    return nearestIndex;
  };

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      const first = layouts.current[0];
      const last = layouts.current[tabs.length - 1];
      if (!first || !last) return;

      const minX = first.x;
      const maxX = last.x + last.width - width.value;
      translateX.value = Math.max(minX, Math.min(maxX, pillBaseX.value + e.translationX));
    })
    .onEnd(() => {
      const targetIndex = snapToNearestTab(translateX.value);
      const targetLayout = layouts.current[targetIndex];
      if (!targetLayout) return;

      translateX.value = withSpring(targetLayout.x, SPRING);
      width.value = withSpring(targetLayout.width, SPRING);
      pillBaseX.value = targetLayout.x;

      const tabName = tabs[targetIndex]?.name;
      if (tabName && tabName !== tabs[state.index]?.name) {
        runOnJS(navigate)(tabName);
      }
    });

  const measuredCount = useRef(0);

  return (
    <View style={styles.nav}>
      <View style={{ borderRadius: 30, overflow: "hidden" }}>
        <GlassView>
          <GestureDetector gesture={dragGesture}>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: colors.bg.transparency,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.pill,
                  pillStyle,
                  { backgroundColor: colors.surface.skillhive },
                ]}
              />

              {tabs.map((tab, i) => {
                const isFocused = state.routes[state.index]?.name === tab.name;

                const textStyle = useAnimatedStyle(() => ({
                  height: heights[i].value,
                  overflow: "hidden",
                }));

                return (
                  <Pressable
                    key={tab.name}
                    onPress={() => navigate(tab.name)}
                    onLayout={(e) => {
                      // Plain property assignment on a plain object — never throws
                      layouts.current = {
                        ...layouts.current,
                        [i]: e.nativeEvent.layout,
                      };
                      measuredCount.current += 1;
                      if (measuredCount.current >= tabs.length) {
                        const layout = layouts.current[state.index];
                        if (layout) {
                          translateX.value = layout.x;
                          width.value = layout.width;
                          pillBaseX.value = layout.x;
                        }
                      }
                    }}
                    style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
                  >
                    <Animated.View style={styles.inner}>
                      <Icon
                        name={tab.icon}
                        size={18}
                        solid
                        color={isFocused ? colors.navbar.activeText : colors.navbar.text}
                        style={styles.icon}
                      />
                      <Animated.View style={textStyle}>
                        <Text style={[styles.text, { color: colors.navbar.text, height: 20 }]}>
                          {tab.label}
                        </Text>
                      </Animated.View>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          </GestureDetector>
        </GlassView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    zIndex: 999,
    margin: 20,
    elevation: 10,
  },
  container: {
    borderWidth: 1,
    flexDirection: "row",
    borderRadius: 30,
    padding: 2,
    paddingHorizontal: 5,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 5,
    zIndex: 2,
    fontSize: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: { transform: [{ scale: 0.92 }] },
  inner: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    flex: 11,
  },
  icon: { fontSize: 24 },
  text: { fontSize: 10, marginTop: 6, fontWeight: "500" },
  pill: {
    position: "absolute",
    height: "90%",
    borderRadius: 24,
    left: 0,
    top: 5,
    zIndex: 1,
  },
});