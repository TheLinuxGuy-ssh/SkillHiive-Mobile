import type { TypographyToken } from "@/constants/tokens";
import { useTheme } from "@/hooks/useTheme";
import { createElement, memo, useMemo } from "react";
import {
    Text as RNText,
    type ColorValue,
    type TextProps as RNTextProps,
    type TextStyle,
} from "react-native";

type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "tint"
  | "accent"
  | "danger"
  | "success";

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  tone?: TextTone;
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
}

function ThemedTextImpl(props: TextProps) {
  const {
    variant = "body",
    tone = "primary",
    align,
    weight,
    style,
    ...rest
  } = props;

  const { typography, colors } = useTheme();

  const t = typography[variant] ?? typography.body;

  const toneMap = useMemo<Record<TextTone, ColorValue>>(
    function () {
      return {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        tertiary: colors.text.tertiary,
        inverse: colors.text.inverse,
        tint: colors.tint.primary,
        accent: colors.tint.accent,
        danger: colors.tint.danger,
        success: colors.tint.success,
      };
    },
    [colors],
  );

  const baseStyle = useMemo<TextStyle>(
    function () {
      return {
        fontSize: t.size,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        fontWeight: (weight ?? t.weight) as TextStyle["fontWeight"],
        color: toneMap[tone],
        textAlign: align,
      };
    },
    [t, weight, toneMap, tone, align],
  );

  const mergedStyle = [baseStyle, style];

  return createElement(RNText, Object.assign({}, rest, { style: mergedStyle }));
}

ThemedTextImpl.displayName = "Text";

export const Text = memo(ThemedTextImpl);
