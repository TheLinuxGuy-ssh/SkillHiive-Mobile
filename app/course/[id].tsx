import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_H = 300;

// ─── Types ────────────────────────────────────────────────────────────────

interface Lesson {
  id: number;
  title: string;
  duration_seconds: number | null;
  order_index: number;
  module_id: number;
}

interface Module {
  id: number;
  title: string;
  order_index: number;
  course_id?: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  total_weeks: number;
  is_published: boolean;
  author: string;
  profiles: { displayname: string; avatar: string | null } | null;
  modules: Module[];
}

interface LessonProgress {
  lesson_id: number;
  watch_percentage: number | null;
  completed_at: string | null;
}

interface EnrollmentState {
  enrolled: boolean;
  isActive: boolean;
  completedLessonIds: Set<number>;
  progressByLesson: Record<number, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatSeconds(secs: number | null): string {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60 > 0 ? `${m % 60}m` : ""}`.trim();
  return `${m}m`;
}

function totalLessons(modules: Module[]): number {
  return modules.reduce((a, m) => a + m.lessons.length, 0);
}

function totalSeconds(modules: Module[]): number {
  return modules.reduce(
    (a, m) => a + m.lessons.reduce((b, l) => b + (l.duration_seconds ?? 0), 0),
    0,
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
  colors,
}: {
  icon: string;
  value: string;
  label: string;
  colors: any;
}) {
  return (
    <View style={[sp.pill, { backgroundColor: colors.surface.raised }]}>
      <Text style={sp.icon}>{icon}</Text>
      <Text style={[sp.value, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[sp.label, { color: colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 2,
    flex: 1,
  },
  icon: { fontSize: 18, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  label: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

// ─── Lesson row ───────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  index,
  progress,
  isCompleted,
  colors,
  onPress,
}: {
  lesson: Lesson;
  index: number;
  progress: number;
  isCompleted: boolean;
  colors: any;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const accent = colors.tint.primary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }).start()
        }
        style={[
          lr.row,
          {
            backgroundColor: isCompleted
              ? accent + "10"
              : colors.surface.raised,
            borderColor: isCompleted ? accent + "35" : colors.border.subtle,
          },
        ]}
      >
        <View
          style={[
            lr.badge,
            {
              backgroundColor: isCompleted ? accent : colors.surface.secondary,
            },
          ]}
        >
          {isCompleted ? (
            <Feather name="check" size={12} color="#000" />
          ) : (
            <Text style={[lr.badgeText, { color: colors.text.tertiary }]}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[lr.title, { color: colors.text.primary }]}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          <View style={lr.meta}>
            <Text style={[lr.dur, { color: colors.text.tertiary }]}>
              {formatSeconds(lesson.duration_seconds)}
            </Text>
            {progress > 0 && !isCompleted && (
              <View
                style={[
                  lr.progTrack,
                  { backgroundColor: colors.border.subtle },
                ]}
              >
                <View
                  style={[
                    lr.progFill,
                    { width: `${progress}%` as any, backgroundColor: accent },
                  ]}
                />
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            lr.play,
            {
              backgroundColor: isCompleted ? accent : colors.surface.secondary,
            },
          ]}
        >
          <Feather
            name={isCompleted ? "check" : "play"}
            size={11}
            color={isCompleted ? "#000" : colors.text.secondary}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
const lr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  title: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  dur: { fontSize: 12, fontWeight: "500" },
  progTrack: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  progFill: { height: "100%", borderRadius: 2 },
  play: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Module section ───────────────────────────────────────────────────────

function ModuleSection({
  module,
  enrollment,
  colors,
  onLessonPress,
}: {
  module: Module;
  enrollment: EnrollmentState;
  colors: any;
  onLessonPress: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const rot = useRef(new Animated.Value(1)).current;
  const accent = colors.tint.primary;

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(rot, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 18,
    }).start();
  }

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  const completedCount = module.lessons.filter((l) =>
    enrollment.completedLessonIds.has(l.id),
  ).length;

  return (
    <View style={ms.wrap}>
      <Pressable onPress={toggle} style={ms.header}>
        <View style={{ flex: 1 }}>
          <Text style={[ms.title, { color: colors.text.primary }]}>
            {module.title}
          </Text>
          <Text style={[ms.sub, { color: colors.text.tertiary }]}>
            {completedCount}/{module.lessons.length} completed
          </Text>
        </View>
        {enrollment.enrolled && module.lessons.length > 0 && (
          <View style={[ms.bar, { backgroundColor: colors.border.subtle }]}>
            <View
              style={[
                ms.barFill,
                {
                  width:
                    `${Math.round((completedCount / module.lessons.length) * 100)}%` as any,
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
        )}
        <Animated.View style={{ transform: [{ rotate }], marginLeft: 8 }}>
          <Feather
            name="chevron-right"
            size={16}
            color={colors.text.tertiary}
          />
        </Animated.View>
      </Pressable>

      {expanded && (
        <View style={{ paddingTop: 2 }}>
          {module.lessons
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((lesson, i) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={i}
                isCompleted={enrollment.completedLessonIds.has(lesson.id)}
                progress={enrollment.progressByLesson[lesson.id] ?? 0}
                colors={colors}
                onPress={() => onLessonPress(lesson.id)}
              />
            ))}
        </View>
      )}
    </View>
  );
}
const ms = StyleSheet.create({
  wrap: { marginBottom: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 2,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  sub: { fontSize: 12, fontWeight: "500" },
  bar: { width: 52, height: 3, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
});

// ─── Tab bar ──────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  active,
  onChange,
  colors,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
  colors: any;
}) {
  const accent = colors.tint.primary;
  return (
    <View style={[tb.wrap, { borderBottomColor: colors.border.subtle }]}>
      {tabs.map((t, i) => (
        <Pressable key={t} onPress={() => onChange(i)} style={tb.tab}>
          <Text
            style={[
              tb.label,
              { color: active === i ? accent : colors.text.tertiary },
            ]}
          >
            {t}
          </Text>
          {active === i && (
            <View style={[tb.bar, { backgroundColor: accent }]} />
          )}
        </Pressable>
      ))}
    </View>
  );
}
const tb = StyleSheet.create({
  wrap: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: -16 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bar: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 2,
  },
});

// ─── Error state ──────────────────────────────────────────────────────────

function ErrorState({
  message,
  onBack,
  colors,
}: {
  message: string;
  onBack: () => void;
  colors: any;
}) {
  return (
    <View
      style={[
        s.fill,
        {
          backgroundColor: colors.bg.canvas,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        },
      ]}
    >
      <Text style={{ fontSize: 32, marginBottom: 16 }}>⚠️</Text>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Couldn't load course
      </Text>
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 13,
          marginBottom: 24,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={onBack}
        style={{
          backgroundColor: colors.tint.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 99,
        }}
      >
        <Text style={{ color: "#000", fontWeight: "700", fontSize: 14 }}>
          Go back
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export default function CoursePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentState>({
    enrolled: false,
    isActive: false,
    completedLessonIds: new Set(),
    progressByLesson: {},
  });
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  const heroTranslate = scrollY.interpolate({
    inputRange: [-100, 0, HERO_H],
    outputRange: [40, 0, -HERO_H * 0.35],
    extrapolate: "clamp",
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 30],
    outputRange: ["transparent", colors.bg.canvas],
    extrapolate: "clamp",
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 70, HERO_H - 10],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const headerBorderOp = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 30],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  // ── Load everything step by step so each failure is visible ─────────
  async function load() {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Step 1: fetch the course row alone (simplest possible query)
      const { data: courseRow, error: courseErr } = await supabase
        .from("courses")
        .select(
          "id, title, description, thumbnail_url, total_weeks, is_published, author",
        )
        .eq("id", id)
        .single();

      if (courseErr) {
        setErrorMsg(
          `Course fetch failed: ${courseErr.message} (code: ${courseErr.code})`,
        );
        setLoading(false);
        return;
      }
      if (!courseRow) {
        setErrorMsg("Course not found.");
        setLoading(false);
        return;
      }

      // Step 2: fetch the instructor profile
      let profile: { displayname: string; avatar: string | null } | null = null;
      if (courseRow.author) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("displayname, avatar")
          .eq("id", courseRow.author)
          .maybeSingle();
        profile = profileRow ?? null;
      }

      // Step 3: fetch modules
      const { data: moduleRows, error: modErr } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .eq("course_id", id)
        .order("order_index");

      if (modErr) {
        // modules might not have course_id — show course with empty modules
        console.warn("Modules fetch failed:", modErr.message);
      }

      const modules: Module[] = [];

      // Step 4: fetch lessons for each module
      if (moduleRows && moduleRows.length > 0) {
        const moduleIds = moduleRows.map((m: any) => m.id);

        const { data: lessonRows, error: lessonErr } = await supabase
          .from("lessons")
          .select("id, title, duration_seconds, order_index, module_id")
          .in("module_id", moduleIds)
          .order("order_index");

        if (lessonErr) {
          console.warn("Lessons fetch failed:", lessonErr.message);
        }

        const lessonsByModule: Record<number, Lesson[]> = {};
        (lessonRows ?? []).forEach((l: Lesson) => {
          if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = [];
          lessonsByModule[l.module_id].push(l);
        });

        moduleRows.forEach((m: any) => {
          modules.push({
            id: m.id,
            title: m.title,
            order_index: m.order_index,
            lessons: lessonsByModule[m.id] ?? [],
          });
        });
      }

      setCourse({
        ...courseRow,
        profiles: profile,
        modules,
      });

      // Step 5: enrollment (non-blocking — failures here don't break the page)
      await loadEnrollment();
    } catch (e: any) {
      setErrorMsg(`Unexpected error: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadEnrollment() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enroll } = await supabase
        .from("enrollments")
        .select("id, is_active")
        .eq("course_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!enroll) return;

      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id, watch_percentage, completed_at")
        .eq("user_id", user.id);

      const rows: LessonProgress[] = prog ?? [];
      const completedLessonIds = new Set(
        rows.filter((r) => r.completed_at !== null).map((r) => r.lesson_id),
      );
      const progressByLesson: Record<number, number> = {};
      rows.forEach((r) => {
        if (r.watch_percentage != null)
          progressByLesson[r.lesson_id] = Math.round(r.watch_percentage);
      });

      setEnrollment({
        enrolled: true,
        isActive: enroll.is_active ?? false,
        completedLessonIds,
        progressByLesson,
      });
    } catch (e) {
      // Enrollment errors are non-fatal
      console.warn("Enrollment load failed:", e);
    }
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("enrollments").insert({
        course_id: Number(id),
        user_id: user.id,
        enrolled_at: new Date().toISOString(),
        is_active: true,
      });
      if (!error)
        setEnrollment((prev) => ({ ...prev, enrolled: true, isActive: true }));
    } finally {
      setEnrolling(false);
    }
  }

  function findNextLesson(): number | null {
    if (!course) return null;
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (!enrollment.completedLessonIds.has(lesson.id)) return lesson.id;
      }
    }
    return course.modules[0]?.lessons[0]?.id ?? null;
  }

  // ── Render states ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <View
        style={[
          s.fill,
          {
            backgroundColor: colors.bg.canvas,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <Text
          style={{
            color: colors.text.tertiary,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (errorMsg || !course) {
    return (
      <ErrorState
        message={errorMsg ?? "Course not found."}
        onBack={() => router.back()}
        colors={colors}
      />
    );
  }

  const accent = colors.tint.primary;
  const allLessons = totalLessons(course.modules);
  const completedCount = enrollment.completedLessonIds.size;
  const progressPct =
    allLessons > 0 ? Math.round((completedCount / allLessons) * 100) : 0;
  const allDone = allLessons > 0 && progressPct === 100;

  return (
    <View style={[s.fill, { backgroundColor: colors.bg.canvas }]}>
      <StatusBar barStyle="light-content" />

      {/* Floating header */}
      <Animated.View
        style={[
          s.floatHeader,
          { paddingTop: insets.top, backgroundColor: headerBg },
        ]}
      >
        <Animated.View
          style={[
            s.floatBorder,
            { backgroundColor: colors.border.subtle, opacity: headerBorderOp },
          ]}
        />
        <View style={s.floatInner}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.backBtn, { backgroundColor: "rgba(0,0,0,0.38)" }]}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Animated.Text
            style={[
              s.floatTitle,
              { color: colors.text.primary, opacity: titleOpacity },
            ]}
            numberOfLines={1}
          >
            {course.title}
          </Animated.Text>
          <View style={{ width: 36 }} />
        </View>
      </Animated.View>

      {/* Scroll body */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Hero */}
        <View style={{ height: HERO_H, overflow: "hidden" }}>
          <Animated.View
            style={[
              s.heroImgWrap,
              { transform: [{ translateY: heroTranslate }] },
            ]}
          >
            {course.thumbnail_url ? (
              <Image
                source={{ uri: course.thumbnail_url }}
                style={s.heroImg}
                resizeMode="cover"
              />
            ) : (
              <View style={[s.heroImg, s.heroPH]}>
                <Text style={{ fontSize: 60 }}>📚</Text>
              </View>
            )}
          </Animated.View>
          <View style={s.heroScrim} />
          <Animated.View style={[s.heroContent, { opacity: heroOpacity }]}>
            {course.is_published && (
              <View style={[s.liveBadge, { backgroundColor: accent }]}>
                <Text style={s.liveText}>LIVE</Text>
              </View>
            )}
            <Text style={s.heroTitle} numberOfLines={3}>
              {course.title}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {course.profiles?.displayname && (
                <View style={s.chip}>
                  <Feather
                    name="user"
                    size={10}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={s.chipText}>{course.profiles.displayname}</Text>
                </View>
              )}
              <View style={s.chip}>
                <Feather
                  name="calendar"
                  size={10}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={s.chipText}>{course.total_weeks} weeks</Text>
              </View>
              <View style={s.chip}>
                <Feather
                  name="book-open"
                  size={10}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={s.chipText}>{allLessons} lessons</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Body */}
        <View style={[s.body, { backgroundColor: colors.bg.canvas }]}>
          {/* Stats */}
          <View style={s.row}>
            <StatPill
              icon="📖"
              value={String(allLessons)}
              label="Lessons"
              colors={colors}
            />
            <StatPill
              icon="⏱"
              value={formatSeconds(totalSeconds(course.modules))}
              label="Content"
              colors={colors}
            />
            <StatPill
              icon="📅"
              value={`${course.total_weeks}w`}
              label="Duration"
              colors={colors}
            />
          </View>

          {/* Enroll / progress card */}
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.surface.raised,
                borderColor: enrollment.enrolled
                  ? accent + "40"
                  : colors.border.subtle,
              },
            ]}
          >
            {enrollment.enrolled ? (
              <>
                <View
                  style={[
                    s.progTrack,
                    { backgroundColor: colors.surface.secondary },
                  ]}
                >
                  <View
                    style={[
                      s.progFill,
                      {
                        width: `${progressPct}%` as any,
                        backgroundColor: accent,
                      },
                    ]}
                  />
                </View>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.text.primary }]}>
                      {allDone ? "Course complete 🎉" : "Continue learning"}
                    </Text>
                    <Text style={[s.cardSub, { color: colors.text.tertiary }]}>
                      {completedCount} of {allLessons} lessons · {progressPct}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: accent }]}
                    onPress={() => {
                      const nxt = findNextLesson();
                      if (nxt) router.push(`/lesson/${nxt}`);
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather
                      name={allDone ? "refresh-cw" : "play"}
                      size={14}
                      color="#000"
                    />
                    <Text style={s.actionBtnText}>
                      {allDone ? "Review" : "Continue"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={s.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: colors.text.primary }]}>
                    Start learning
                  </Text>
                  <Text style={[s.cardSub, { color: colors.text.tertiary }]}>
                    Free to enroll · {allLessons} lessons
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: accent }]}
                  onPress={handleEnroll}
                  disabled={enrolling}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={14} color="#000" />
                  <Text style={s.actionBtnText}>
                    {enrolling ? "Enrolling…" : "Enroll now"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Tabs */}
          <TabBar
            tabs={["Curriculum", "About"]}
            active={activeTab}
            onChange={setActiveTab}
            colors={colors}
          />

          <View style={{ paddingTop: 20 }}>
            {activeTab === 0 &&
              (course.modules.length === 0 ? (
                <Text style={[s.empty, { color: colors.text.tertiary }]}>
                  No curriculum added yet.
                </Text>
              ) : (
                course.modules.map((mod) => (
                  <ModuleSection
                    key={mod.id}
                    module={mod}
                    enrollment={enrollment}
                    colors={colors}
                    onLessonPress={() => router.push(`../web`)}
                  />
                ))
              ))}

            {activeTab === 1 && (
              <View style={{ gap: 12 }}>
                {course.profiles && (
                  <View
                    style={[
                      s.infoCard,
                      {
                        backgroundColor: colors.surface.raised,
                        borderColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <View style={[s.avatarCircle, { backgroundColor: accent }]}>
                      {course.profiles.avatar ? (
                        <Image
                          source={{ uri: course.profiles.avatar }}
                          style={s.avatarImg}
                        />
                      ) : (
                        <Text style={s.avatarInitials}>
                          {course.profiles.displayname
                            ?.slice(0, 2)
                            .toUpperCase() ?? "?"}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text
                        style={[
                          s.instructorName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {course.profiles.displayname}
                      </Text>
                      <Text
                        style={[
                          s.instructorRole,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        Course Instructor
                      </Text>
                    </View>
                  </View>
                )}

                <View
                  style={[
                    s.descCard,
                    {
                      backgroundColor: colors.surface.raised,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={[s.sectionLabel, { color: accent }]}>
                    About this course
                  </Text>
                  <Text style={[s.descText, { color: colors.text.secondary }]}>
                    {course.description || "No description provided."}
                  </Text>
                </View>

                <View
                  style={[
                    s.descCard,
                    {
                      backgroundColor: colors.surface.raised,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={[s.sectionLabel, { color: accent }]}>
                    Course details
                  </Text>
                  {[
                    {
                      icon: "layers" as const,
                      text: `${course.modules.length} modules`,
                    },
                    {
                      icon: "book-open" as const,
                      text: `${allLessons} lessons`,
                    },
                    {
                      icon: "clock" as const,
                      text: `${formatSeconds(totalSeconds(course.modules))} of content`,
                    },
                    {
                      icon: "calendar" as const,
                      text: `${course.total_weeks}-week programme`,
                    },
                  ].map(({ icon, text }) => (
                    <View key={text} style={s.detailRow}>
                      <Feather
                        name={icon}
                        size={14}
                        color={colors.text.tertiary}
                      />
                      <Text
                        style={[s.detailText, { color: colors.text.secondary }]}
                      >
                        {text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },
  floatHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  floatBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  floatInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  floatTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginHorizontal: 8,
  },
  heroImgWrap: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    bottom: -40,
  },
  heroImg: { width: "100%", height: HERO_H + 80 },
  heroPH: {
    backgroundColor: "#0d0d14",
    alignItems: "center",
    justifyContent: "center",
  },
  heroScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_H,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 22,
  },
  liveBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#000",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  body: { paddingHorizontal: 16, paddingTop: 20 },
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  cardSub: { fontSize: 12, fontWeight: "500" },
  progTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progFill: { height: "100%", borderRadius: 2 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  actionBtnText: { fontSize: 13, fontWeight: "800", color: "#000" },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 48, height: 48 },
  avatarInitials: { fontSize: 15, fontWeight: "800", color: "#000" },
  instructorName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  instructorRole: { fontSize: 12, fontWeight: "500" },
  descCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  descText: { fontSize: 14, lineHeight: 22 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 14, fontWeight: "500" },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 40 },
});
