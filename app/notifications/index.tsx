import { useProfile } from "@/hooks/profileContext";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

const MONO  = Platform.OS === "ios" ? "Courier New" : "monospace";
const EMBER = "#fffd01";

type AllyRequest = {
  id:           string;
  requester_id: string;
  created_at:   string;
  status:       string;
  requester: {
    id:          string;
    displayname: string;
    username:    string | null;
    avatar:      string | null;
  };
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const { colors }              = useTheme();
  const { profile: myProfile }  = useProfile();

  const [requests,   setRequests]   = useState<AllyRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting,     setActing]     = useState<string | null>(null); // id of row being acted on

  const BG_MUT  = colors?.bg?.muted          ?? "#110f0d";
  const BG      = colors?.bg?.primary        ?? "#16130f";
  const SURFACE = colors?.surface?.secondary ?? "#1a1714";
  const BORDER  = colors?.border?.subtle     ?? "#3a322c";
  const INK     = colors?.text?.primary      ?? "#e8e0d5";
  const INK_MUT = colors?.text?.secondary    ?? "#9a9189";

  // ── fetch ────────────────────────────────────────────────────────────────
  async function fetchRequests(isRefresh = false) {
    if (!myProfile?.id) return;
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);

    const { data, error } = await supabase
      .from("allies")
      .select(`
        id,
        requester_id,
        created_at,
        status,
        requester:profiles!allies_requester_id_fkey (
          id,
          displayname,
          username,
          avatar
        )
      `)
      .eq("receiver_id", myProfile.id)
      .order("created_at", { ascending: false });

    if (!error && data) setRequests(data as any);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    if (!myProfile?.id) return;
    fetchRequests();

    // realtime
    const channel = supabase
      .channel("notifications-allies")
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "allies",
          filter: `receiver_id=eq.${myProfile.id}`,
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myProfile?.id]);

  // ── actions ──────────────────────────────────────────────────────────────
  async function accept(req: AllyRequest) {
    setActing(req.id);
    await supabase
      .from("allies")
      .update({ status: "accepted" })
      .eq("id", req.id);
    await fetchRequests();
    setActing(null);
  }

  async function decline(req: AllyRequest) {
    setActing(req.id);
    await supabase
      .from("allies")
      .delete()
      .eq("id", req.id);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setActing(null);
  }

  // ── empty ────────────────────────────────────────────────────────────────
  const pending  = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");

  return (
    <View style={{ flex: 1, backgroundColor: BG_MUT }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRequests(true)}
            tintColor={EMBER}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: INK }]}>Notifications</Text>
          <Text style={[styles.headerSub, { color: INK_MUT, fontFamily: MONO }]}>
            {pending.length > 0 ? `${pending.length} pending` : "all clear"}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={EMBER} style={{ marginTop: 60 }} />
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: BORDER, fontFamily: MONO }]}>
              [ no notifications ]
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>

            {/* ── Pending requests ── */}
            {pending.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.text.skillhive }]}>
                  Alliance Requests
                </Text>
                {pending.map((req, i) => (
                  <Animated.View
                    key={req.id}
                    entering={FadeInUp.duration(220).delay(i * 40)}
                    style={[styles.card, { backgroundColor: BG, borderColor: EMBER + "55" }]}
                  >
                    <Pressable
                      style={styles.cardTop}
                      onPress={() => router.push(`/profile/${req.requester.id}`)}
                    >
                      {req.requester.avatar ? (
                        <Image
                          source={{ uri: req.requester.avatar }}
                          style={[styles.avatar, { borderColor: BORDER }]}
                        />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: SURFACE, borderColor: BORDER }]}>
                          <Text style={{ color: INK_MUT, fontWeight: "700", fontSize: 16 }}>
                            {req.requester.displayname?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.name, { color: INK }]}>
                          {req.requester.displayname}
                        </Text>
                        {req.requester.username && (
                          <Text style={[styles.username, { color: INK_MUT, fontFamily: MONO }]}>
                            [{req.requester.username}]
                          </Text>
                        )}
                        <Text style={[styles.time, { color: BORDER, fontFamily: MONO }]}>
                          {timeAgo(req.created_at)}
                        </Text>
                      </View>
                      <View style={[styles.pendingBadge, { borderColor: EMBER, backgroundColor: "#24280B" }]}>
                        <Text style={[styles.pendingBadgeText, { color: EMBER }]}>⚔ REQUEST</Text>
                      </View>
                    </Pressable>

                    {/* action buttons */}
                    <View style={[styles.actions, { borderTopColor: BORDER }]}>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: EMBER, backgroundColor: "#24280B", flex: 1 }]}
                        onPress={() => accept(req)}
                        disabled={acting === req.id}
                      >
                        {acting === req.id
                          ? <ActivityIndicator size="small" color={EMBER} />
                          : <Text style={[styles.actionBtnText, { color: EMBER }]}>⚔ ACCEPT</Text>
                        }
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: BORDER, backgroundColor: SURFACE, flex: 1 }]}
                        onPress={() => decline(req)}
                        disabled={acting === req.id}
                      >
                        <Text style={[styles.actionBtnText, { color: INK_MUT }]}>✕ DECLINE</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </>
            )}

            {/* ── Accepted ── */}
            {accepted.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: INK_MUT, marginTop: pending.length > 0 ? 16 : 0 }]}>
                  Recent Allies
                </Text>
                {accepted.map((req, i) => (
                  <Animated.View
                    key={req.id}
                    entering={FadeInUp.duration(220).delay(i * 40)}
                    style={[styles.card, { backgroundColor: BG, borderColor: BORDER }]}
                  >
                    <Pressable
                      style={styles.cardTop}
                      onPress={() => router.push(`/profile/${req.requester.id}`)}
                    >
                      {req.requester.avatar ? (
                        <Image
                          source={{ uri: req.requester.avatar }}
                          style={[styles.avatar, { borderColor: BORDER }]}
                        />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: SURFACE, borderColor: BORDER }]}>
                          <Text style={{ color: INK_MUT, fontWeight: "700", fontSize: 16 }}>
                            {req.requester.displayname?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.name, { color: INK }]}>
                          {req.requester.displayname}
                        </Text>
                        {req.requester.username && (
                          <Text style={[styles.username, { color: INK_MUT, fontFamily: MONO }]}>
                            [{req.requester.username}]
                          </Text>
                        )}
                        <Text style={[styles.time, { color: BORDER, fontFamily: MONO }]}>
                          {timeAgo(req.created_at)}
                        </Text>
                      </View>
                      <View style={[styles.pendingBadge, { borderColor: BORDER, backgroundColor: SURFACE }]}>
                        <Text style={[styles.pendingBadgeText, { color: INK_MUT }]}>⚔ ALLIED</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </>
            )}

          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 11,
    letterSpacing: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 2,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 11,
    marginTop: 1,
  },
  time: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 3,
  },
  pendingBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    gap: 0,
  },
  actionBtn: {
    borderWidth: 0,
    borderTopWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
});