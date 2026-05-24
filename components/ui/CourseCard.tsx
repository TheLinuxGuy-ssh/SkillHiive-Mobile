import { useTheme } from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/FontAwesome6";

interface CourseCardProps {
  title: string;
  instructor: string;
  description: string;
  progress?: number | null;
  enrolledCount: number;
  lessonCount: number;
  isNew?: boolean;
  thumbnail: any;
  onPress?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  instructor,
  description,
  progress,
  enrolledCount,
  lessonCount,
  isNew = false,
  thumbnail,
  onPress,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
    >
      <Animated.View
        style={[
          {
            borderRadius: 22,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 20,
            elevation: 14,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            borderRadius: 22,
            shadowColor: "#fffd01",
            borderWidth: 0,
            borderColor: "rgba(255, 253, 1, 0.2)",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 18,
            elevation: 0,
          }}
        >
          <View style={{ borderRadius: 22, overflow: "hidden" }}>
            <ImageBackground
              source={thumbnail}
              resizeMode="cover"
              style={{ width: "100%", aspectRatio: 16 / 9 }}
              imageStyle={{ borderRadius: 22 }}
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.15)",
                  "rgba(0,0,0,0.45)",
                  "rgba(0,0,0,0.72)",
                  "rgba(0,0,0,0.92)",
                ]}
                locations={[0, 0.3, 0.65, 1]}
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  borderRadius: 22,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                    paddingTop: 8,
                    gap: 6,
                  }}
                >
                  {isNew && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 2,
                      }}
                    >
                      <Text style={{ fontSize: 11 }}>🟡</Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: colors.text.white,
                          letterSpacing: 1.2,
                          textTransform: "uppercase",
                          opacity: 0.9,
                        }}
                      >
                        NEW COURSE
                      </Text>
                    </View>
                  )}

                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: colors.text.white,
                      lineHeight: 28,
                      letterSpacing: -0.3,
                    }}
                  >
                    {title}
                    {"\n"}
                    <Text
                      style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}
                    >
                      {" "}
                      with {instructor}!
                    </Text>
                  </Text>

                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.72)",
                      lineHeight: 17,
                      fontWeight: "400",
                    }}
                  >
                    {description}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                    }}
                  >
                    {progress === undefined ? (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        Loading...
                      </Text>
                    ) : typeof progress === "number" ? (
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            height: 5,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: "100%",
                              width: `${Math.min(Math.max(progress, 0), 100)}%`,
                              backgroundColor: "#a3e635",
                              borderRadius: 999,
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#a3e635",
                            minWidth: 28,
                            textAlign: "right",
                          }}
                        >
                          {progress}%
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.6)",
                          fontStyle: "italic",
                        }}
                      >
                        Not started
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon
                          name="users"
                          size={11}
                          color="rgba(255,255,255,0.7)"
                          solid
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.7)",
                            fontWeight: "500",
                          }}
                        >
                          {enrolledCount}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon
                          name="message"
                          size={11}
                          color="rgba(255,255,255,0.7)"
                          solid
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.7)",
                            fontWeight: "500",
                          }}
                        >
                          {lessonCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};
