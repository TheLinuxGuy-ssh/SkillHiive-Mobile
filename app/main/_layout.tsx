import React, { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinkNav } from "./tabs";

const PagerView =
  Platform.OS !== "web"
    ? (require("react-native-pager-view")
        .default as typeof import("react-native-pager-view").default)
    : null;

import ChatScreen from "./chat";
import HomeScreen from "./index";
import LearnScreen from "./learn";
import ProfileScreen from "./profile";

const ROUTES = [
  { name: "index", title: "Home", component: HomeScreen },
  { name: "learn", title: "Learn", component: LearnScreen },
  { name: "chat", title: "Chat", component: ChatScreen },
  { name: "profile", title: "Profile", component: ProfileScreen },
] as const;

export default function Layout() {
  const pagerRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isAnimating = useRef(false);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveIndex(e.nativeEvent.position);
      isAnimating.current = false;
    },
    [],
  );

  const handleTabPress = useCallback((routeName: string) => {
    const index = ROUTES.findIndex((r) => r.name === routeName);
    if (index === -1 || isAnimating.current) return;
    isAnimating.current = true;
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  const fakeState = {
    index: activeIndex,
    routes: ROUTES.map((r) => ({ key: r.name, name: r.name })),
  };

  const fakeNavigation = {
    emit: () => ({ defaultPrevented: false }),
    navigate: (name: string) => handleTabPress(name),
  };

  const fakeDescriptors = Object.fromEntries(
    ROUTES.map((r) => [
      r.name,
      { options: { title: r.title }, render: () => null },
    ]),
  );

  const pages = ROUTES.map((route) => {
    const Screen = route.component;
    return (
      <View key={route.name} style={styles.page}>
        <Screen />
      </View>
    );
  });

  return (
    <View style={styles.container}>
      {PagerView ? (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={onPageSelected}
          overdrag={false}
          offscreenPageLimit={ROUTES.length - 1}
        >
          {pages}
        </PagerView>
      ) : (
        // Web — just show the active screen, no swipe needed
        <View style={styles.pager}>{pages[activeIndex]}</View>
      )}

      <LinkNav
        state={fakeState as any}
        navigation={fakeNavigation as any}
        descriptors={fakeDescriptors as any}
        insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1 },
});
