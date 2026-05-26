import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";

import FloatingSectionNav from "@/components/ui/FloatingSectionNav";
import OfferCard from "@/components/ui/OfferCard";
import ProjectCard, { ProjectCardData } from "@/components/ui/ProjectCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ShareBar from "@/components/ui/ShareBar";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type RawPost = {
  id: string;
  post_type: "project" | "media" | "offer";
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;

  profiles: {
    username: string | null;
    avatar: string | null;
  } | null;

  project_posts: {
    title: string;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    status: "active" | "completed" | "paused";
  } | null;

  post_images: {
    url: string;
    sort_order: number;
  }[] | null;
};

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const FEED_QUERY = `
  id,
  post_type,
  caption,
  likes_count,
  comments_count,
  created_at,

  profiles:profiles!posts_user_id_profiles_fkey (
    username,
    avatar
  ),

  project_posts:project_posts!project_posts_post_id_fkey (
    title,
    description,
    started_at,
    ended_at,
    status
  ),

  post_images:post_images!post_images_post_id_fkey (
    url,
    sort_order
  )
`;

// ─────────────────────────────────────────
// MIGRATION MARKER
// ─────────────────────────────────────────
//
// FEED SECTIONS — currently "Global only"
//
// When the platform grows and you're ready to introduce Hive + Cohort sections:
//
//   1. FloatingSectionNav  — add "hive" and "cohort" tabs back to the nav items
//
//   2. FeedScreen          — restore the three-section ScrollView layout:
//        <SectionHeader title="Hive" />       → posts from users the viewer follows
//        <SectionHeader title="My Cohort" />  → posts from cohort_members
//        <SectionHeader title="Global" />     → all posts (current behaviour)
//
//   3. Supabase queries needed:
//        Hive:   SELECT ... FROM posts WHERE user_id IN (
//                  SELECT following_id FROM follows WHERE follower_id = $uid
//                )
//        Cohort: SELECT ... FROM posts WHERE user_id IN (
//                  SELECT user_id FROM cohort_members WHERE cohort_id = (
//                    SELECT cohort_id FROM cohort_members WHERE user_id = $uid LIMIT 1
//                  )
//                )
//        Global: SELECT ... FROM posts  ← what we do today, no filter
//
//   4. Tables required (already in schema, just unused):
//        follows         { id, follower_id, following_id, created_at }
//        cohort_members  { id, cohort_id, user_id, created_at }
//        cohorts         { id, name, created_at }
//
//   5. Scroll breakpoints live in POSITIONS — recalculate after adding sections.
//
// No schema changes needed. The DB is already ready for all three modes.
//
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────

function toProjectCardData(row: RawPost): ProjectCardData | null {
  const pp = row.project_posts;

  if (!pp) return null;

  const profile = row.profiles;

  const sortedImages = [...(row.post_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return {
    post_id: row.id,
    caption: row.caption,
    likes_count: row.likes_count,
    comments_count: row.comments_count,

    title: pp.title,
    description: pp.description,
    started_at: pp.started_at,
    ended_at: pp.ended_at,
    status: pp.status,

    cover_url: sortedImages[0]?.url ?? null,

    author_name: profile?.username ?? "Unknown",
    author_avatar: profile?.avatar ?? null,
  };
}

// ─────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────

export default function FeedScreen() {
  const { colors, spacing, statusBarStyle } = useTheme();

  const scrollRef = useRef<ScrollView>(null);

  const [posts, setPosts] = useState<RawPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all posts, newest first ──────

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    const { data, error: fetchError } = await supabase
      .from("posts")
      .select(FEED_QUERY)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<RawPost[]>();

    console.log("FEED ERROR:", fetchError);
    console.log("FEED DATA:", JSON.stringify(data, null, 2));

    if (fetchError) {
      setError("Couldn't load posts. Pull down to try again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setPosts(data ?? []);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ── Render a single post row ───────────

  function renderPost(row: RawPost) {
    switch (row.post_type) {
      case "project": {
        const data = toProjectCardData(row);

        if (!data) return null;

        return (
          <ProjectCard
            key={row.id}
            data={data}
            onPress={(id) => {
              console.log("open project", id);
            }}
          />
        );
      }

      case "offer":
        return <OfferCard key={row.id} />;

      case "media":
        return null;

      default:
        return null;
    }
  }

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.canvas }}>
    
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFeed(true)}
            tintColor={colors.tint.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <SectionHeader title="Feed" subtitle="Everyone" />

        <View style={{ padding: spacing.base }}>
          <ShareBar />

          {loading ? (
            <ActivityIndicator
              color={colors.tint.primary}
              style={{ marginVertical: 40 }}
            />
          ) : error ? (
            <Text
              style={{
                color: colors.text.tertiary,
                textAlign: "center",
                marginVertical: 40,
                fontSize: 14,
              }}
            >
              {error}
            </Text>
          ) : posts.length === 0 ? (
            <Text
              style={{
                color: colors.text.tertiary,
                textAlign: "center",
                marginVertical: 40,
                fontSize: 14,
              }}
            >
              No posts yet. Be the first to share something.
            </Text>
          ) : (
            posts.map(renderPost)
          )}
        </View>
      </ScrollView>

      <FloatingSectionNav active="global" onPress={() => {}} />
    </View>
  );
}