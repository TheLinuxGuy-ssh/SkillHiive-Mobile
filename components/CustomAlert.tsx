import { Feather } from "@expo/vector-icons";
import { createElement, memo, useCallback, useEffect } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export type AlertType = "default" | "success" | "error" | "warning" | "info";

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  type?: AlertType;
}

/**
 * Themed confirmation / message alert.
 *
 * Replaces the legacy iOS-only blur+gradient stack with the platform-aware
 * Surface primitive so Android shows a flat themed sheet (no BlurView)
 * while iOS 26+ shows real Liquid Glass and iOS<26 falls back to BlurView.
 *
 * Tap-to-dismiss on the scrim is enabled — removing the friction of a
 * "Cancel" button when there's nothing destructive to confirm respects
 * the user's time.
 */
function CustomAlertImpl(props: CustomAlertProps) {
  const {
    visible,
    title,
    message,
    buttons = [{ text: "OK" }],
    onDismiss,
    type = "default",
  } = props;

  const { colors, spacing, radii } = useTheme();
  const sheetProgress = useSharedValue(0);

  useEffect(
    function () {
      sheetProgress.value = withTiming(visible ? 1 : 0, { duration: 220 });
    },
    [visible, sheetProgress],
  );

  const sheetStyle = useAnimatedStyle(function () {
    return {
      opacity: sheetProgress.value,
      transform: [{ scale: 0.96 + sheetProgress.value * 0.04 }],
    };
  });

  const handleBackdropPress = useCallback(
    function () {
      const single =
        buttons.length === 1 && buttons[0]?.style !== "destructive";
      if (single) {
        onDismiss?.();
      }
    },
    [buttons, onDismiss],
  );

  const tone =
    type === "success"
      ? colors.tint.success
      : type === "error"
        ? colors.tint.danger
        : type === "warning"
          ? colors.tint.warning
          : colors.tint.primary;

  const icon: keyof typeof Feather.glyphMap =
    type === "success"
      ? "check-circle"
      : type === "error"
        ? "alert-circle"
        : type === "warning"
          ? "alert-triangle"
          : "info";

  const iconBadge =
    type !== "default"
      ? createElement(
          View,
          {
            style: {
              width: 48,
              height: 48,
              borderRadius: radii.pill,
              backgroundColor: colors.surface.secondary,
              alignItems: "center" as const,
              justifyContent: "center" as const,
              alignSelf: "flex-start" as const,
            },
          },
          createElement(Feather, { name: icon, size: 22, color: tone }),
        )
      : null;

  const buttonRow = createElement(
    View,
    {
      style: {
        flexDirection:
          buttons.length > 2 ? ("column" as const) : ("row" as const),
        gap: spacing.sm,
        marginTop: spacing.sm,
      },
    },
    ...buttons.map(function (btn, i) {
      return createElement(Button, {
        key: btn.text + "-" + i,
        label: btn.text,
        fullWidth: buttons.length > 2,
        variant:
          btn.style === "destructive"
            ? "danger"
            : btn.style === "cancel"
              ? "secondary"
              : "primary",
        onPress: function () {
          btn.onPress?.();
          onDismiss?.();
        },
      });
    }),
  );

  const sheet = createElement(
    Surface,
    {
      variant: "solid",
      radius: radii.xl,
      style: {
        width: 320,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        gap: spacing.md,
      },
    },
    iconBadge,
    createElement(
      View,
      null,
      createElement(Text, { variant: "title", tone: "primary" }, title),
      createElement(
        Text,
        {
          variant: "body",
          tone: "secondary",
          style: { marginTop: spacing.xs },
        },
        message,
      ),
    ),
    buttonRow,
  );

  const innerPressable = createElement(
    Pressable,
    {
      onPress: function () {
        return undefined;
      },
    },
    createElement(Animated.View, { style: sheetStyle }, sheet),
  );

  const scrim = createElement(
    Pressable,
    {
      style: {
        flex: 1,
        backgroundColor: colors.overlay.scrim,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        padding: spacing.lg,
      },
      onPress: handleBackdropPress,
    },
    innerPressable,
  );

  return createElement(
    Modal,
    {
      visible: visible,
      transparent: true,
      animationType: "fade",
      onRequestClose: onDismiss,
      statusBarTranslucent: true,
    },
    scrim,
  );
}

CustomAlertImpl.displayName = "CustomAlert";

export const CustomAlert = memo(CustomAlertImpl);
export default CustomAlert;
