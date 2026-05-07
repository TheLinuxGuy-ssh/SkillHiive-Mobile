import { CourseCard } from "@/components/ui/CourseCard";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Learn = () => {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg.muted }]}>
      <SafeAreaView style={{ marginHorizontal: 10 }}>
        <Animated.ScrollView>
          <CourseCard
            title="Web Development"
            instructor="Aninda"
            onPress={() => router.push("/course")}
            description="A comprehensive course on understanding video editing, from foundational theories to color grading & more.."
            progress={23}
            enrolledCount={312}
            lessonCount={10}
            isNew={true}
            thumbnail={require("@/assets/images/course.jpg")}
          />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
});

export default Learn;
