import { useTheme } from "@/hooks/useTheme";
import { BlurView, type BlurTint } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { createElement, memo, useMemo, type ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";

export type SurfaceVariant = "glass" | "solid" | "sunken" | "raised";

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  radius?: number;
  intensity?: number;
  tintColor?: string;
  interactive?: boolean;
  children?: ReactNode;
}

const isIOS = Platform.OS === "ios";
const liquidGlassReady = isIOS && isLiquidGlassAvailable();

function SurfaceImpl(props: SurfaceProps) {
  const {
    variant = "solid",
    radius,
    intensity = 32,
    tintColor,
    interactive = false,
    style,
    children,
    ...rest
  } = props;

  const { colors, mode, elevation } = useTheme();

  const baseStyle = useMemo<ViewStyle>(
    function () {
      const r: ViewStyle = {};
      if (radius != null) {
        r.borderRadius = radius;
      }
      return r;
    },
    [radius],
  );

  if (variant === "glass") {
    if (liquidGlassReady) {
      const glassProps = {
        glassEffectStyle: "regular" as const,
        tintColor: tintColor,
        isInteractive: interactive,
        style: [baseStyle, style] as ViewStyle[],
      };
      return createElement(GlassView, glassProps, children);
    }

    if (isIOS) {
      const blurTint: BlurTint = mode === "dark" ? "dark" : "light";
      const blurProps = {
        tint: blurTint,
        intensity: intensity,
        style: [baseStyle, style] as ViewStyle[],
      };
      return createElement(BlurView, blurProps, children);
    }

    const androidStyle: ViewStyle = {
      backgroundColor: colors.overlay.glassTint,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
    };
    const androidProps = {
      ...rest,
      style: [androidStyle, baseStyle, style] as ViewStyle[],
    };
    return createElement(View, androidProps, children);
  }

  const surfaceColor =
    variant === "sunken"
      ? colors.surface.sunken
      : variant === "raised"
        ? colors.surface.raised
        : colors.surface.primary;

  const raisedShadow: ViewStyle =
    variant === "raised"
      ? {
          shadowColor: "#000",
          shadowOffset: elevation.md.shadowOffset,
          shadowOpacity: mode === "dark" ? 0.5 : elevation.md.shadowOpacity,
          shadowRadius: elevation.md.shadowRadius,
          elevation: elevation.md.elevation,
        }
      : {};

  const solidProps = {
    ...rest,
    style: [
      { backgroundColor: surfaceColor },
      raisedShadow,
      baseStyle,
      style,
    ] as ViewStyle[],
  };

  return createElement(View, solidProps, children);
}

SurfaceImpl.displayName = "Surface";

export const Surface = memo(SurfaceImpl);
