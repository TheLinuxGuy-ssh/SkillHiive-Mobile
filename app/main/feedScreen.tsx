import FloatingSectionNav from "@/components/ui/FloatingSectionNav";
import OfferCard from "@/components/ui/OfferCard";
import ProjectCard from "@/components/ui/ProjectCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ShareBar from "@/components/ui/ShareBar";
import StreakCard from "@/components/ui/StreakCard";
import { useTheme } from "@/hooks/useTheme";
import React, { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

// Hardcoded scroll break-points for the layout positions
const POSITIONS: Record<string, number> = {
  hive: 0,
  cohort: 760,
  global: 1450,
};

export default function FeedScreen() {
  const { colors, spacing, statusBarStyle } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState("hive");

  // A lock variable prevents scroll-listeners from fighting layout-jumps during manual selections
  const isProgrammaticScroll = useRef(false);

  const jumpTo = (section: string) => {
    setActive(section);
    isProgrammaticScroll.current = true;

    scrollRef.current?.scrollTo({
      y: POSITIONS[section],
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY < (POSITIONS.cohort + POSITIONS.hive) / 2) {
      if (active !== "hive") setActive("hive");
    } else if (offsetY < (POSITIONS.global + POSITIONS.cohort) / 2) {
      if (active !== "cohort") setActive("cohort");
    } else {
      if (active !== "global") setActive("global");
    }
  };

  const handleMomentumScrollEnd = () => {
    isProgrammaticScroll.current = false;
  };

  const handleScrollAnimationEnd = () => {
    isProgrammaticScroll.current = false;
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.canvas,
      }}
    >
      <StatusBar barStyle={`${statusBarStyle}-content`} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Fires calculations at 60fps for smooth response
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollAnimationEnd={handleScrollAnimationEnd}
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        <SectionHeader title="Hive" subtitle="Following · All cohorts" />

        <View
          style={{
            padding: spacing.base,
          }}
        >
          <ShareBar />
          <OfferCard />
          <ProjectCard />
        </View>

        <SectionHeader title="My Cohort" subtitle="24 members" />

        <View
          style={{
            paddingHorizontal: spacing.base,
          }}
        >
          <ProjectCard />
          <StreakCard />
        </View>

        <SectionHeader title="Global" subtitle="Locked" />

        <View
          style={{
            height: "100%",
          }}
        >
          <Text></Text>
        </View>
      </ScrollView>

      <FloatingSectionNav active={active} onPress={jumpTo} />
    </View>
  );
}
