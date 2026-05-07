import CustomAlert from "@/components/CustomAlert";
import { useSignOut } from "@/hooks/useSignOut";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";

import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6";

const Profile = () => {
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  const { handleSignOut, isSigningOut, alertConfig, isVisible, hideAlert } =
    useSignOut();

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const StatCard = ({
    icon,
    value,
    label,
  }: {
    icon: string;
    value: string;
    label: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface.secondary,
          borderColor: colors.border.subtle,
          position: "relative",
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: "rgba(255, 253, 1, 0.15)" },
        ]}
      >
        <Icon name={icon} size={14} color={colors.tint.primary} solid />
      </View>
      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>
        {value}
      </Text>
    </View>
  );
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.canvas,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.tint.primary,
              },
            ]}
          >
            <View style={styles.headerTop}>
              <Pressable
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: colors.surface.primary,
                  },
                ]}
              >
                <Icon
                  name="chevron-left"
                  size={14}
                  color={colors.text.primary}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: colors.surface.primary,
                  },
                ]}
                onPress={() => router.push("/settings")}
              >
                <Icon name="gear" size={14} color={colors.text.primary} solid />
              </Pressable>
            </View>
          </View>

          {/* PROFILE CARD */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.surface.primary,
              },
            ]}
          >
            <View style={styles.profileTop}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
                }}
                style={styles.avatar}
              />

              <Pressable
                style={[
                  styles.friendButton,
                  {
                    borderColor: colors.tint.primary,
                  },
                ]}
              >
                <Icon name="plus" size={10} color={colors.tint.primary} solid />

                <Text
                  style={[
                    styles.friendButtonText,
                    { color: colors.tint.primary },
                  ]}
                >
                  Friends
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.name,
                {
                  color: colors.text.primary,
                },
              ]}
            >
              {user?.email?.split("@")[0] ?? "Guest"}
            </Text>

            <Text
              style={[
                styles.email,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              {user?.email ?? "guest@email.com"}
            </Text>

            {/* STATS ROW */}
            <View style={styles.socialStats}>
              <View>
                <Text
                  style={[styles.socialNumber, { color: colors.text.primary }]}
                >
                  1.5K
                </Text>

                <Text
                  style={[styles.socialLabel, { color: colors.text.secondary }]}
                >
                  Followers
                </Text>
              </View>

              <View>
                <Text
                  style={[styles.socialNumber, { color: colors.text.primary }]}
                >
                  320
                </Text>

                <Text
                  style={[styles.socialLabel, { color: colors.text.secondary }]}
                >
                  Following
                </Text>
              </View>

              <Pressable
                style={[
                  styles.recordButton,
                  {
                    backgroundColor: "rgba(255, 253, 1, 0.15)",
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.tint.primary,
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  Record
                </Text>
              </Pressable>
            </View>

            {/* GRID */}
            <View style={styles.grid}>
              <StatCard icon="star" value="51" label="Balance" />

              <StatCard icon="trophy" value="1" label="Level" />

              <StatCard icon="shield" value="Barefoot" label="Current League" />

              <StatCard icon="bolt" value="30" label="Total XP" />
            </View>

            {/* ACTIONS */}
            <View
              style={[
                styles.actionsCard,
                {
                  backgroundColor: colors.surface.secondary,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionsTitle,
                  {
                    color: colors.text.primary,
                  },
                ]}
              >
                Actions
              </Text>

              <View style={{ gap: 18 }}>
                <Pressable style={styles.actionRow}>
                  <Icon
                    name="user"
                    size={15}
                    color={colors.text.primary}
                    solid
                  />

                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.text.primary,
                      },
                    ]}
                  >
                    Edit Profile
                  </Text>
                </Pressable>

                <Pressable style={styles.actionRow}>
                  <Icon
                    name="gear"
                    size={15}
                    color={colors.text.primary}
                    solid
                  />

                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.text.primary,
                      },
                    ]}
                  >
                    Settings
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.actionRow}
                  onPress={handleSignOut}
                  disabled={isSigningOut}
                >
                  <Icon
                    name="right-from-bracket"
                    size={15}
                    color={colors.tint.danger}
                    solid
                  />

                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: colors.tint.danger,
                      },
                    ]}
                  >
                    Logout
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {alertConfig ? (
          <CustomAlert
            visible={isVisible}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            type={alertConfig.type}
            onDismiss={hideAlert}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  header: {
    height: 170,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  profileCard: {
    marginHorizontal: 16,
    marginTop: -70,
    borderRadius: 28,
    padding: 20,
  },

  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },

  friendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  friendButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },

  email: {
    fontSize: 13,
    marginBottom: 22,
  },

  socialStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },

  socialNumber: {
    fontSize: 18,
    fontWeight: "800",
  },

  socialLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  recordButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 24,
  },

  statCard: {
    width: "47%",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    minHeight: 85,
    justifyContent: "space-between",
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: "absolute",
    right: 10,
    top: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  actionsCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },

  actionsTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
