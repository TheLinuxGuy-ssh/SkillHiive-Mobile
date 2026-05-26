import React from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}

export default function FeedCard({ children, onPress, style }: Props) {
  const { colors, radii, spacing, elevation } = useTheme();

  const cardStyle = {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden" as const,
    marginBottom: spacing.md,
    ...elevation.sm,
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          ...cardStyle,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}