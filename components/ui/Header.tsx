import { Text } from "@/components/ui/Text";
import { useProfile } from "@/hooks/profileContext";
import { supabase } from "@/lib/supabase";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6";

import { useTheme } from "@/hooks/useTheme";

const LOGO_SIZE = 50;
export const HEADER_HEIGHT = LOGO_SIZE + 20;

export function Header() {
  const { colors }             = useTheme();
  const insets                 = useSafeAreaInsets();
  const { profile: myProfile } = useProfile();
  const pathname               = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!myProfile?.id) return;
    supabase
      .from("allies")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", myProfile.id)
      .eq("status", "pending")
      .then(({ count }) => setPendingCount(count ?? 0));
  }, [myProfile?.id, pathname]); // re-fetches every time user navigates

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop:      insets.top,
          height:          HEADER_HEIGHT + insets.top,
          backgroundColor: "transparent",
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <Text
          variant="title"
          style={{ color: colors.text.skillhive, paddingHorizontal: 20, fontSize: 25 }}
        >
          SkillHiive
        </Text>

        <Pressable
          style={({ pressed }) => [styles.bell, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.push("/notifications")}
        >
          <Icon name="bell" size={18} solid color={colors.text.primary ?? "#e8e0d5"} />
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    justifyContent: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
    zIndex: 100,
  },
  logoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bell: {
    marginHorizontal: 20,
    padding: 6,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fffd01",
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#000",
  },
});