/**
 * usePipMode
 *
 * Manages the Picture-in-Picture state for RoomScreen.
 *
 * Exposes:
 *  - isPip          → boolean, whether the room is currently minimised
 *  - pipAnim        → Animated.ValueXY for the PiP card position
 *  - pipScale       → Animated.Value (1 → full, 0.92 → landing bounce)
 *  - swipeDownPan   → PanResponder to attach to the top-bar drag handle
 *  - pipDragPan     → PanResponder to attach to the PiP card
 *  - enterPip()     → programmatically minimise
 *  - exitPip()      → programmatically restore
 *  - pipW / pipH    → PiP card dimensions
 */

import { useCallback, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

export const PIP_W = 180;
export const PIP_H = 280;

// Safe landing position: bottom-right corner with 16 px margin
const LANDING_X = SW - PIP_W - 16;
const LANDING_Y = SH - PIP_H - 100; // above tab bar estimate

// Clamp to screen bounds
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function usePipMode() {
  const [isPip, setIsPip] = useState(false);
  const isPipRef = useRef(false);

  // Position of the PiP card; starts off-screen, snaps to landing on enterPip
  const pipAnim = useRef(new Animated.ValueXY({ x: LANDING_X, y: LANDING_Y })).current;
  const pipScale = useRef(new Animated.Value(1)).current;

  // Drag offset while user is moving the PiP card
  const dragOffset = useRef({ x: LANDING_X, y: LANDING_Y });

  // Track the current resting position so drag starts from there
  pipAnim.addListener((v) => {
    dragOffset.current = { x: v.x, y: v.y };
  });

  // ── Enter PiP ────────────────────────────────────────────────────────────
  const enterPip = useCallback(() => {
    if (isPipRef.current) return;
    isPipRef.current = true;
    setIsPip(true);

    Animated.parallel([
      Animated.spring(pipAnim, {
        toValue: { x: LANDING_X, y: LANDING_Y },
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
      Animated.sequence([
        Animated.timing(pipScale, { toValue: 0.94, duration: 120, useNativeDriver: true }),
        Animated.spring(pipScale, { toValue: 1, useNativeDriver: true, tension: 90, friction: 10 }),
      ]),
    ]).start();
  }, []);

  // ── Exit PiP ─────────────────────────────────────────────────────────────
  const exitPip = useCallback(() => {
    if (!isPipRef.current) return;
    isPipRef.current = false;

    Animated.parallel([
      Animated.spring(pipScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start(() => setIsPip(false));
  }, []);

  // ── Swipe-down pan (attached to drag handle at top of full-screen room) ──
  const swipeDownPan = useRef(
    PanResponder.create({
      // Only capture a clear downward swipe from the very top
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 14 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60) enterPip();
      },
    })
  ).current;

  // ── Drag pan (attached to the PiP card itself) ────────────────────────────
  const pipDragPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isPipRef.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        isPipRef.current && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),
      onPanResponderGrant: () => {
        // Freeze animation at current position so drag starts cleanly
        pipAnim.stopAnimation();
        pipAnim.setOffset({ x: dragOffset.current.x, y: dragOffset.current.y });
        pipAnim.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pipAnim.x, dy: pipAnim.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gs) => {
        pipAnim.flattenOffset();

        // Snap to nearest corner
        const cx = dragOffset.current.x + gs.dx;
        const cy = dragOffset.current.y + gs.dy;

        const snapX = cx < SW / 2 ? 16 : SW - PIP_W - 16;
        const snapY = clamp(cy, 60, SH - PIP_H - 80);

        Animated.spring(pipAnim, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      },
    })
  ).current;

  return {
    isPip,
    pipAnim,
    pipScale,
    swipeDownPan,
    pipDragPan,
    enterPip,
    exitPip,
    pipW: PIP_W,
    pipH: PIP_H,
  };
}