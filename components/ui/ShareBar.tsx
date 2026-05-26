import React, { useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BottomSheet, {
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import * as ImagePicker from "expo-image-picker";

import DateTimePicker from "@react-native-community/datetimepicker";

import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";

type Props = {
  onPosted?: () => void;
};

type PostType = "project" | "media" | "offer";

export default function ShareBar({ onPosted }: Props) {
  const { colors, spacing, radii, typography } = useTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["55%", "92%"], []);

  const [posting, setPosting] = useState(false);

  const [postType, setPostType] = useState<PostType>("project");

  const [caption, setCaption] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [currentlyWorking, setCurrentlyWorking] = useState(true);

  const [startedAt, setStartedAt] = useState<Date | null>(new Date());

  const [endedAt, setEndedAt] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);

  const [showEndPicker, setShowEndPicker] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string) {
    const response = await fetch(uri);

    const blob = await response.blob();

    const fileName = `${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handlePost() {
    try {
      setPosting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: createdPost, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          post_type: postType,
          caption: caption.trim() || null,
        })
        .select("id")
        .single();

      if (postError) {
        throw postError;
      }

      const postId = createdPost.id;

      if (postType === "project") {
        const { error: projectError } = await supabase
          .from("project_posts")
          .insert({
            post_id: postId,
            title,
            description: description || null,
            started_at: startedAt
              ? startedAt.toISOString().split("T")[0]
              : null,
            ended_at:
              currentlyWorking || !endedAt
                ? null
                : endedAt.toISOString().split("T")[0],
            status: currentlyWorking ? "active" : "completed",
          });

        if (projectError) {
          throw projectError;
        }
      }

      if (imageUri) {
        const publicUrl = await uploadImage(imageUri);

        const { error: imageError } = await supabase
          .from("post_images")
          .insert({
            post_id: postId,
            url: publicUrl,
            sort_order: 0,
          });

        if (imageError) {
          throw imageError;
        }
      }

      setCaption("");
      setTitle("");
      setDescription("");
      setImageUri(null);

      bottomSheetRef.current?.close();

      onPosted?.();
    } catch (err) {
      console.log(err);
    } finally {
      setPosting(false);
    }
  }

  function TypeButton({
    label,
    value,
  }: {
    label: string;
    value: PostType;
  }) {
    const active = value === postType;

    return (
      <Pressable
        onPress={() => setPostType(value)}
        style={{
          backgroundColor: active
            ? colors.surface.skillhive
            : colors.surface.secondary,

          borderRadius: radii.pill,

          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Text
          style={{
            color: active
              ? colors.text.black
              : colors.text.secondary,

            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => bottomSheetRef.current?.expand()}
        style={{
          backgroundColor: colors.surface.primary,

          borderRadius: radii.lg,

          borderWidth: 1,
          borderColor: colors.border.subtle,

          padding: spacing.md,

          flexDirection: "row",
          alignItems: "center",

          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,

            borderRadius: radii.pill,

            backgroundColor: colors.surface.skillhive,

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.text.black,
              fontWeight: "700",
            }}
          >
            AK
          </Text>
        </View>

        <View
          style={{
            flex: 1,

            marginLeft: spacing.sm,

            backgroundColor: colors.surface.secondary,

            borderRadius: radii.pill,

            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.text.tertiary,
            }}
          >
            Share your progress...
          </Text>
        </View>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: colors.surface.primary,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.text.tertiary,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: 120,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,

              marginBottom: spacing.md,
            }}
          >
            <TypeButton label="Project" value="project" />
            <TypeButton label="Media" value="media" />
            <TypeButton label="Offer" value="offer" />
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What are you building?"
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={{
              minHeight: 120,

              backgroundColor: colors.surface.secondary,

              borderRadius: radii.lg,

              padding: spacing.md,

              color: colors.text.primary,

              textAlignVertical: "top",

              marginBottom: spacing.md,
            }}
          />

          {postType === "project" && (
            <>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Project title"
                placeholderTextColor={colors.text.tertiary}
                style={{
                  backgroundColor: colors.surface.secondary,

                  borderRadius: radii.lg,

                  padding: spacing.md,

                  color: colors.text.primary,

                  marginBottom: spacing.md,
                }}
              />

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Short description"
                placeholderTextColor={colors.text.tertiary}
                multiline
                style={{
                  minHeight: 100,

                  backgroundColor: colors.surface.secondary,

                  borderRadius: radii.lg,

                  padding: spacing.md,

                  color: colors.text.primary,

                  textAlignVertical: "top",

                  marginBottom: spacing.md,
                }}
              />

              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={{
                  backgroundColor: colors.surface.secondary,

                  borderRadius: radii.lg,

                  padding: spacing.md,

                  marginBottom: spacing.md,
                }}
              >
                <Text
                  style={{
                    color: colors.text.primary,
                  }}
                >
                  Started At:{" "}
                  {startedAt?.toISOString().split("T")[0]}
                </Text>
              </Pressable>

              {!currentlyWorking && (
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  style={{
                    backgroundColor: colors.surface.secondary,

                    borderRadius: radii.lg,

                    padding: spacing.md,

                    marginBottom: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text.primary,
                    }}
                  >
                    Ended At:{" "}
                    {endedAt
                      ? endedAt.toISOString().split("T")[0]
                      : "Select"}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() =>
                  setCurrentlyWorking((prev) => !prev)
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",

                  marginBottom: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,

                    borderRadius: 5,

                    backgroundColor: currentlyWorking
                      ? colors.surface.skillhive
                      : colors.surface.secondary,

                    marginRight: spacing.sm,
                  }}
                />

                <Text
                  style={{
                    color: colors.text.secondary,
                  }}
                >
                  I am currently working on this
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            onPress={pickImage}
            style={{
              backgroundColor: colors.surface.secondary,

              borderRadius: radii.lg,

              padding: spacing.md,

              justifyContent: "center",
              alignItems: "center",

              minHeight: 180,

              overflow: "hidden",

              marginBottom: spacing.lg,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: 180,
                }}
              />
            ) : (
              <Text
                style={{
                  color: colors.text.tertiary,
                }}
              >
                Tap to add cover image
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={posting || !caption.trim()}
            onPress={handlePost}
            style={{
              opacity:
                posting || !caption.trim()
                  ? 0.6
                  : 1,

              backgroundColor: colors.surface.skillhive,

              borderRadius: radii.pill,

              paddingVertical: spacing.md,

              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {posting ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={{
                  color: colors.text.black,

                  fontWeight: "700",

                  fontSize: typography.body.size,
                }}
              >
                Publish Post
              </Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>

      {showStartPicker && (
        <DateTimePicker
          value={startedAt || new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowStartPicker(false);

            if (selectedDate) {
              setStartedAt(selectedDate);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endedAt || new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowEndPicker(false);

            if (selectedDate) {
              setEndedAt(selectedDate);
            }
          }}
        />
      )}
    </>
  );
}