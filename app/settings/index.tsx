import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";

import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";

const Settings = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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

  const settingsItems = [
    {
      icon: "mail",
      label: "Email",
      value: user?.email ?? "No email",
    },
    {
      icon: "user",
      label: "Username",
      value: user?.email?.split("@")[0] ?? "guest",
    },
    {
      icon: "database",
      label: "Storage",
      value: "Cloud synced",
    },
    {
      icon: "globe",
      label: "Language",
      value: "English",
    },
    {
      icon: "shield",
      label: "Privacy",
      value: "Standard",
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.muted,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingBottom: 120,
          }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.surface.primary,
                  borderColor: colors.border.subtle,
                },
              ]}
              onPress={() => router.push("/main/profile")}
            >
              <Icon name="chevron-left" size={18} color={colors.text.primary} />
            </Pressable>

            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text.primary,
                },
              ]}
            >
              Settings
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* SETTINGS CARD */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            {settingsItems.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.settingRow,
                  index !== settingsItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: colors.surface.secondary,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon as any}
                      size={15}
                      color={colors.text.primary}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: colors.text.primary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>

                    <Text
                      style={[
                        styles.settingValue,
                        {
                          color: colors.text.secondary,
                        },
                      ]}
                    >
                      {item.value}
                    </Text>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            ))}
          </View>

          {/* PREMIUM CARD */}
          <View
            style={[
              styles.premiumCard,
              {
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: "rgba(255, 253, 1, 0.15)",
                  },
                ]}
              >
                <Icon name="star" size={15} color={colors.tint.primary} />
              </View>

              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: colors.text.primary,
                    },
                  ]}
                >
                  Premium Status
                </Text>

                <Text
                  style={[
                    styles.inactiveText,
                    {
                      color: colors.tint.danger,
                    },
                  ]}
                >
                  Inactive
                </Text>
              </View>
            </View>

            <Icon name="chevron-right" size={18} color={colors.tint.primary} />
          </View>

          {/* REFERRAL CARD */}
          <View
            style={[
              styles.referralCard,
              {
                backgroundColor: "#FF8A34",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.referralTitle}>Refer a friend</Text>

              <View style={styles.referralBadge}>
                <Icon name="gift" size={13} color="#fff" />

                <Text style={styles.referralBadgeText}>50 referral points</Text>
              </View>
            </View>

            <Text style={styles.referralEmoji}>🐼</Text>
          </View>

          {/* EXTRA */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: colors.surface.secondary,
                    },
                  ]}
                >
                  <Icon name="image" size={15} color={colors.text.primary} />
                </View>

                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: colors.text.primary,
                    },
                  ]}
                >
                  App Icon
                </Text>
              </View>

              <Icon
                name="chevron-right"
                size={18}
                color={colors.text.tertiary}
              />
            </Pressable>

            <Pressable
              style={[
                styles.settingRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: colors.surface.secondary,
                    },
                  ]}
                >
                  <Icon name="grid" size={15} color={colors.text.primary} />
                </View>

                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: colors.text.primary,
                    },
                  ]}
                >
                  Widgets
                </Text>
              </View>

              <Icon
                name="chevron-right"
                size={18}
                color={colors.text.tertiary}
              />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 26,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },

  settingRow: {
    minHeight: 74,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  settingValue: {
    marginTop: 2,
    fontSize: 12,
  },

  premiumCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inactiveText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },

  referralCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  referralTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },

  referralBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  referralBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  referralEmoji: {
    fontSize: 54,
  },
});
