import { useProfile } from "@/hooks/profileContext";
import {
  LiveKitRoom,
  registerGlobals,
  TrackReference,
  useTracks,
  VideoTrack,
} from "@livekit/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Participant,
  Room,
  RoomEvent,
  RoomOptions,
  Track,
  VideoPresets,
} from "livekit-client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Replace the Unicode icon characters below with your icon library.
// e.g. import { Feather } from "@expo/vector-icons";
// A helper component is included at the bottom of the file.
// ─────────────────────────────────────────────────────────────────────────────

registerGlobals();

const LIVEKIT_URL = "ws://192.168.1.50:7880";
const TOKEN_ENDPOINT = "http://192.168.1.50:3000/getToken";
const { width: SCREEN_W } = Dimensions.get("window");
const SIDEBAR_W = Math.min(300, SCREEN_W * 0.78);

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0e11",
  surface: "#16181e",
  surfaceHigh: "#1d2029",
  border: "#262932",
  borderFaint: "#1c1f27",
  accent: "#4f78f1",
  accentDim: "rgba(79,120,241,0.14)",
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.14)",
  red: "#f36060",
  redDim: "rgba(243,96,96,0.12)",
  text: "#f0f2f8",
  textMid: "#9299b0",
  textDim: "#555d75",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getResolutionPreset(count: number) {
  if (count <= 3) return VideoPresets.h720;
  if (count <= 6) return VideoPresets.h480;
  return VideoPresets.h360;
}
function getResolutionLabel(count: number) {
  if (count <= 3) return "720p";
  if (count <= 6) return "480p";
  return "360p";
}
function getGridColumns(count: number) {
  if (count === 1) return 1;
  if (count <= 4) return 2;
  return 3;
}
function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// ─── Audio device hook ────────────────────────────────────────────────────────
// Replace the static list with your platform audio-session library of choice
// (e.g. react-native-audio-session, react-native-incall-manager, etc.)
interface AudioDevice {
  id: string;
  name: string;
}

function useAudioDevices() {
  // Static demo list — swap with real device enumeration in production
  const [devices] = useState<AudioDevice[]>([
    { id: "speaker", name: "Speaker" },
    { id: "earpiece", name: "Earpiece" },
  ]);
  const [activeId, setActiveId] = useState("speaker");

  function selectDevice(id: string) {
    // TODO: call your audio-session library here
    setActiveId(id);
  }

  const active = devices.find((d) => d.id === activeId) ?? devices[0];
  return { devices, active, selectDevice };
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function RoomScreen() {
  const { roomName } = useLocalSearchParams<{ roomName: string }>();
  const { profile } = useProfile();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isFrontCam, setIsFrontCam] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarX = useRef(new Animated.Value(SIDEBAR_W)).current;
  const sidebarOpacity = useRef(new Animated.Value(0)).current;
  const roomRef = useRef<Room | null>(null);
  const sidebarOpenRef = useRef(false);
  const { devices, active: activeDevice, selectDevice } = useAudioDevices();

  const EDGE_HIT_SLOP = 28;
  const SWIPE_THRESHOLD = 40;

  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) =>
        !sidebarOpenRef.current &&
        evt.nativeEvent.pageX > SCREEN_W - EDGE_HIT_SLOP,
      onMoveShouldSetPanResponder: (evt, gs) =>
        !sidebarOpenRef.current &&
        gs.dx < -8 &&
        evt.nativeEvent.pageX > SCREEN_W - EDGE_HIT_SLOP * 4,
      onPanResponderMove: (_, gs) => {
        if (sidebarOpenRef.current) return;
        const tx = Math.max(0, SIDEBAR_W + gs.dx);
        sidebarX.setValue(tx);
        sidebarOpacity.setValue(1 - tx / SIDEBAR_W);
      },
      onPanResponderRelease: (_, gs) => {
        if (sidebarOpenRef.current) return;
        gs.dx < -SWIPE_THRESHOLD ? commitOpen() : commitClose();
      },
    }),
  ).current;

  const sidebarPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        sidebarOpenRef.current &&
        gs.dx > 8 &&
        Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (!sidebarOpenRef.current) return;
        sidebarX.setValue(Math.max(0, gs.dx));
        sidebarOpacity.setValue(1 - Math.max(0, gs.dx) / SIDEBAR_W);
      },
      onPanResponderRelease: (_, gs) => {
        if (!sidebarOpenRef.current) return;
        gs.dx > SWIPE_THRESHOLD ? commitClose() : commitOpen();
      },
    }),
  ).current;

  function commitOpen() {
    sidebarOpenRef.current = true;
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 14,
      }),
      Animated.timing(sidebarOpacity, {
        toValue: 1,
        useNativeDriver: true,
        duration: 180,
      }),
    ]).start();
  }

  function commitClose() {
    sidebarOpenRef.current = false;
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue: SIDEBAR_W,
        useNativeDriver: true,
        tension: 80,
        friction: 14,
      }),
      Animated.timing(sidebarOpacity, {
        toValue: 0,
        useNativeDriver: true,
        duration: 160,
      }),
    ]).start(() => setSidebarOpen(false));
  }

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      await requestPermissions();
      await fetchToken();
    } catch (e: any) {
      Alert.alert("Setup error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function requestPermissions() {
    if (Platform.OS !== "android") return;
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    if (
      result[PermissionsAndroid.PERMISSIONS.CAMERA] !== "granted" ||
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== "granted"
    )
      throw new Error("Camera/mic permissions denied");
  }

  async function fetchToken() {
    const res = await fetch(
      `${TOKEN_ENDPOINT}?room=${roomName}&username=${profile?.username}`,
    );
    if (!res.ok) throw new Error(`Token server error: ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token received");
    setToken(data.token);
  }

  const participantCount = participants.length;
  const resPreset = getResolutionPreset(participantCount);

  const room = useMemo(() => {
    const r = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: resPreset,
        facingMode: "user", // start on front cam explicitly
      },
    } as RoomOptions);
    roomRef.current = r;
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resPreset]);

  function handleConnected() {
    const sync = () => {
      if (!roomRef.current) return;
      const remote = Array.from(roomRef.current.remoteParticipants.values());
      setParticipants([roomRef.current.localParticipant, ...remote]);
    };
    sync();
    room.on(RoomEvent.ParticipantConnected, sync);
    room.on(RoomEvent.ParticipantDisconnected, sync);
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  async function toggleMic() {
    const next = !micEnabled;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }

  async function toggleCam() {
    const next = !camEnabled;
    await roomRef.current?.localParticipant.setCameraEnabled(next);
    setCamEnabled(next);
  }

  async function flipCamera() {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;

    const nextFront = !isFrontCam;
    const facingMode = nextFront ? "user" : "environment";

    try {
      // 1. Unpublish the current camera track
      const camPub = lp.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) {
        await lp.unpublishTrack(camPub.track);
      }

      // 2. Re-enable camera with the new facing mode — livekit-react-native
      //    reads videoCaptureDefaults merged with the options passed here.
      await lp.setCameraEnabled(true, {
        facingMode,
        resolution: getResolutionPreset(participantCount),
      } as any);

      setIsFrontCam(nextFront);
    } catch (e: any) {
      Alert.alert("Camera flip failed", e.message);
    }
  }

  function showOutputPicker() {
    const opts = [...devices.map((d) => d.name), "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Audio Output",
          options: opts,
          cancelButtonIndex: opts.length - 1,
        },
        (i) => {
          if (i < devices.length) selectDevice(devices[i].id);
        },
      );
    } else {
      Alert.alert("Audio Output", "Select output device", [
        ...devices.map((d) => ({
          text: d.id === activeDevice.id ? `✓  ${d.name}` : d.name,
          onPress: () => selectDevice(d.id),
        })),
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  async function leave() {
    await roomRef.current?.disconnect();
    router.back();
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.loader} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.loaderText}>Joining meeting…</Text>
      </SafeAreaView>
    );
  }
  if (!token) {
    return (
      <SafeAreaView style={s.loader} edges={["top", "bottom"]}>
        <Text style={s.loaderText}>Failed to get token</Text>
      </SafeAreaView>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      connect
      audio
      video
      room={room}
      onConnected={handleConnected}
      onDisconnected={() => router.back()}
      onError={(e) => Alert.alert("Connection error", e?.message ?? "Unknown")}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {/* Edge-swipe zone covers full screen; sidebar pan captures right-side drags */}
      <View style={s.root} {...edgePanResponder.panHandlers}>
        {/* ── Top bar */}
        <SafeAreaView edges={["top"]} style={s.topBarWrap}>
          <TopBar
            roomName={roomName ?? "Meeting"}
            participantCount={participantCount}
            resolution={getResolutionLabel(participantCount)}
            onParticipants={commitOpen}
          />
        </SafeAreaView>

        {/* ── Video grid */}
        <View style={s.gridWrap}>
          <ConferenceView participantCount={participantCount} />
        </View>

        {/* ── Control bar */}
        <SafeAreaView edges={["bottom"]} style={s.ctrlWrap}>
          <ControlBar
            micEnabled={micEnabled}
            camEnabled={camEnabled}
            isFrontCam={isFrontCam}
            outputLabel={activeDevice.name}
            onMic={toggleMic}
            onCam={toggleCam}
            onFlip={flipCamera}
            onOutput={showOutputPicker}
            onLeave={leave}
          />
        </SafeAreaView>

        {/* ── Scrim: always rendered (opacity 0 when closed) so gestures work */}
        <Animated.View
          style={[s.scrim, { opacity: sidebarOpacity }]}
          pointerEvents={sidebarOpen ? "auto" : "none"}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={commitClose} />
        </Animated.View>

        {/* ── Sidebar drawer: always in tree so pan responder is always attached */}
        <Animated.View
          style={[s.sidebarShell, { transform: [{ translateX: sidebarX }] }]}
          {...sidebarPanResponder.panHandlers}
        >
          <ParticipantsSidebar
            participants={participants}
            onClose={commitClose}
          />
        </Animated.View>
      </View>
    </LiveKitRoom>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({
  roomName,
  participantCount,
  resolution,
  onParticipants,
}: {
  roomName: string;
  participantCount: number;
  resolution: string;
  onParticipants: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <View style={s.topBar}>
      <View style={s.topLeft}>
        <View style={s.liveChip}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>LIVE</Text>
        </View>
        <Text style={s.roomName} numberOfLines={1}>
          {roomName}
        </Text>
      </View>

      <Text style={s.timer}>
        {mm}:{ss}
      </Text>

      <View style={s.topRight}>
        <View style={s.resBadge}>
          <Text style={s.resBadgeText}>{resolution}</Text>
        </View>
        <TouchableOpacity
          style={s.participantsBtn}
          onPress={onParticipants}
          activeOpacity={0.72}
        >
          {/* Replace with: <Feather name="users" size={15} color={C.text} /> */}
          <Text style={s.participantsBtnIcon}>&#9651;</Text>
          <Text style={s.participantsBtnCount}>{participantCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Video grid ───────────────────────────────────────────────────────────────
function ConferenceView({ participantCount }: { participantCount: number }) {
  const tracks = useTracks([Track.Source.Camera]);
  const columns = getGridColumns(participantCount);
  const GAP = 5;
  const tileW = (SCREEN_W - GAP * (columns + 1)) / columns;
  const tileH = tileW * (9 / 16);

  if (tracks.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>⬡</Text>
        <Text style={s.emptyTitle}>Waiting for participants</Text>
        <Text style={s.emptySub}>Share the room name to invite others</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[s.grid, { padding: GAP, gap: GAP }]}
      showsVerticalScrollIndicator={false}
    >
      {tracks.map((ref) => (
        <ParticipantTile
          key={`${ref.participant.identity}-${ref.publication.trackSid}`}
          trackRef={ref}
          width={tileW}
          height={tileH}
        />
      ))}
    </ScrollView>
  );
}

// ─── Participant tile ─────────────────────────────────────────────────────────
function ParticipantTile({
  trackRef,
  width,
  height,
}: {
  trackRef: TrackReference;
  width: number;
  height: number;
}) {
  const { participant: p } = trackRef;
  const isSpeaking = p.isSpeaking;
  const isMuted = !p.isMicrophoneEnabled;

  return (
    <View style={[s.tile, { width, height }, isSpeaking && s.tileSpeaking]}>
      <VideoTrack trackRef={trackRef} style={StyleSheet.absoluteFill} />
      <View style={s.tileOverlay} />
      <View style={s.tileBottom}>
        <View style={s.tileAvatar}>
          <Text style={s.tileAvatarText}>{initials(p.identity)}</Text>
        </View>
        <Text style={s.tileName} numberOfLines={1}>
          {p.identity}
        </Text>
        {isMuted && (
          <View style={s.mutedPill}>
            <Text style={s.mutedPillText}>MIC OFF</Text>
          </View>
        )}
        {isSpeaking && <SpeakingBars />}
      </View>
    </View>
  );
}

function SpeakingBars() {
  return (
    <View style={s.bars}>
      <View style={[s.bar, { height: 8 }]} />
      <View style={[s.bar, { height: 14 }]} />
      <View style={[s.bar, { height: 8 }]} />
    </View>
  );
}

// ─── Participants sidebar ─────────────────────────────────────────────────────
function ParticipantsSidebar({
  participants,
  onClose,
}: {
  participants: Participant[];
  onClose: () => void;
}) {
  return (
    <View style={s.sidebar}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.surface }}>
        <View style={s.sidebarHeader}>
          <Text style={s.sidebarTitle}>Participants</Text>
          <View style={s.sidebarCountChip}>
            <Text style={s.sidebarCountText}>{participants.length}</Text>
          </View>
          <TouchableOpacity
            style={s.sidebarCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={s.sidebarCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <View style={s.divider} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {participants.map((p, idx) => {
          const speaking = p.isSpeaking;
          const muted = !p.isMicrophoneEnabled;
          return (
            <View key={p.identity} style={s.pRow}>
              <View style={[s.pAvatar, speaking && s.pAvatarSpeaking]}>
                <Text style={s.pAvatarText}>{initials(p.identity)}</Text>
              </View>
              <View style={s.pInfo}>
                <Text style={s.pName} numberOfLines={1}>
                  {p.identity}
                  {idx === 0 ? "  (You)" : ""}
                </Text>
                <Text style={s.pStatus}>
                  {speaking ? "Speaking…" : "In meeting"}
                </Text>
              </View>
              <View style={[s.pBadge, muted ? s.pBadgeOff : s.pBadgeOn]}>
                <Text
                  style={[s.pBadgeText, { color: muted ? C.red : C.green }]}
                >
                  {muted ? "MUTED" : "LIVE"}
                </Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Control bar ─────────────────────────────────────────────────────────────
function ControlBar({
  micEnabled,
  camEnabled,
  isFrontCam,
  outputLabel,
  onMic,
  onCam,
  onFlip,
  onOutput,
  onLeave,
}: {
  micEnabled: boolean;
  camEnabled: boolean;
  isFrontCam: boolean;
  outputLabel: string;
  onMic: () => void;
  onCam: () => void;
  onFlip: () => void;
  onOutput: () => void;
  onLeave: () => void;
}) {
  return (
    <View style={s.controlBar}>
      <CtrlBtn
        // icon: <Feather name={micEnabled ? "mic" : "mic-off"} …/>
        icon={micEnabled ? "M" : "M✕"}
        label={micEnabled ? "Mute" : "Unmute"}
        onPress={onMic}
        state={micEnabled ? "on" : "off"}
      />
      <CtrlBtn
        // icon: <Feather name={camEnabled ? "video" : "video-off"} …/>
        icon={camEnabled ? "V" : "V✕"}
        label={camEnabled ? "Stop Video" : "Start Video"}
        onPress={onCam}
        state={camEnabled ? "on" : "off"}
      />
      <CtrlBtn
        // icon: <MaterialIcons name="flip-camera-ios" …/>
        icon="↺"
        label={isFrontCam ? "Rear Cam" : "Front Cam"}
        onPress={onFlip}
        state="on"
      />
      <CtrlBtn
        // icon: <Feather name="volume-2" …/>
        icon="▲"
        label={outputLabel}
        sublabel="Output"
        onPress={onOutput}
        state="on"
      />
      <CtrlBtn
        // icon: <Feather name="phone-off" …/>
        icon="✕"
        label="End"
        onPress={onLeave}
        state="danger"
      />
    </View>
  );
}

function CtrlBtn({
  icon,
  label,
  sublabel,
  onPress,
  state,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  state: "on" | "off" | "danger";
}) {
  return (
    <TouchableOpacity style={s.ctrlBtn} onPress={onPress} activeOpacity={0.72}>
      <View
        style={[
          s.ctrlCircle,
          state === "off" && s.ctrlCircleOff,
          state === "danger" && s.ctrlCircleDanger,
        ]}
      >
        <Text
          style={[
            s.ctrlIcon,
            state === "off" && { color: C.red },
            state === "danger" && { color: "#fff" },
          ]}
        >
          {icon}
        </Text>
      </View>
      {sublabel && <Text style={s.ctrlSublabel}>{sublabel}</Text>}
      <Text
        style={[
          s.ctrlLabel,
          state === "off" && { color: C.red },
          state === "danger" && { color: C.red },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Loader
  loader: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loaderText: { color: C.textMid, fontSize: 15, fontWeight: "500" },

  // Top bar
  topBarWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.greenDim,
    borderWidth: 0.5,
    borderColor: "rgba(52,211,153,0.3)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText: {
    color: C.green,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
    fontFamily: MONO,
  },
  roomName: { color: C.text, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  timer: {
    color: C.textMid,
    fontSize: 13,
    fontFamily: MONO,
    flex: 1,
    textAlign: "center",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  resBadge: {
    backgroundColor: C.accentDim,
    borderWidth: 0.5,
    borderColor: "rgba(79,120,241,0.4)",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  resBadgeText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: MONO,
  },
  participantsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.surfaceHigh,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  participantsBtnIcon: { fontSize: 14, color: C.text },
  participantsBtnCount: { color: C.text, fontSize: 13, fontWeight: "700" },

  // Grid
  gridWrap: { flex: 1, backgroundColor: C.bg },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 44, color: C.surfaceHigh, marginBottom: 4 },
  emptyTitle: { color: C.textMid, fontSize: 17, fontWeight: "600" },
  emptySub: { color: C.textDim, fontSize: 13 },

  // Tile
  tile: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderFaint,
  },
  tileSpeaking: {
    borderColor: C.green,
    shadowColor: C.green,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  tileBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 6,
  },
  tileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  tileAvatarText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  tileName: { color: C.text, fontSize: 12, fontWeight: "500", flex: 1 },
  mutedPill: {
    backgroundColor: C.redDim,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mutedPillText: {
    color: C.red,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 3, backgroundColor: C.green, borderRadius: 2 },

  // Sidebar shell
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 10,
  },
  sidebarShell: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: SIDEBAR_W,
    zIndex: 20,
  },
  sidebar: {
    flex: 1,
    backgroundColor: C.surface,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  sidebarTitle: { color: C.text, fontSize: 17, fontWeight: "700", flex: 1 },
  sidebarCountChip: {
    backgroundColor: C.accentDim,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sidebarCountText: { color: C.accent, fontSize: 12, fontWeight: "700" },
  sidebarCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarCloseIcon: { color: C.textMid, fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: C.border },

  // Participant row
  pRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderFaint,
  },
  pAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  pAvatarSpeaking: { borderColor: C.green },
  pAvatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pInfo: { flex: 1, gap: 2 },
  pName: { color: C.text, fontSize: 14, fontWeight: "600" },
  pStatus: { color: C.textDim, fontSize: 12 },
  pBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4 },
  pBadgeOn: { backgroundColor: C.greenDim },
  pBadgeOff: { backgroundColor: C.redDim },
  pBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  // Control bar
  ctrlWrap: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  ctrlBtn: { alignItems: "center", gap: 5, minWidth: 56, maxWidth: 68 },
  ctrlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  ctrlCircleOff: {
    backgroundColor: C.redDim,
    borderColor: "rgba(243,96,96,0.28)",
  },
  ctrlCircleDanger: { backgroundColor: C.red, borderColor: C.red },
  ctrlIcon: { fontSize: 18, color: C.text, includeFontPadding: false },
  ctrlSublabel: {
    color: C.textDim,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: -3,
  },
  ctrlLabel: {
    color: C.textMid,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
