import { logger } from '@/utils/logger';
import FeatureInfoModal from "@/components/Dashboard/FeatureInfoModal";
import { AddPinModal } from "@/components/Map/AddPinModal";
import AppDialog, { type AppDialogAction } from "@/components/ui/AppDialog";
import { Colors, Fonts } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useCoveMembers } from "@/hooks/useCoveMembers";
import type { Pin } from "@/hooks/usePins";
import { usePins } from "@/hooks/usePins";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BOARD_SIZE = 1500;
const PIN_WIDTH = 180;
const PIN_HEIGHT = 140;

type DialogState = {
  title: string;
  message: string;
  actions?: AppDialogAction[];
} | null;

const BoardPin = memo(function BoardPin({
  pin,
  authorLabel,
  canDelete,
  onDelete,
  onUpdatePosition,
  onDragStateChange,
}: {
  pin: Pin;
  authorLabel: string;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const pan = useRef(
    new Animated.ValueXY({ x: pin.x ?? 100, y: pin.y ?? 100 }),
  ).current;
  const isDragging = useRef(false);
  const currentPosition = useRef({ x: pin.x ?? 100, y: pin.y ?? 100 });

  useEffect(() => {
    const nextX = pin.x ?? 100;
    const nextY = pin.y ?? 100;
    currentPosition.current = { x: nextX, y: nextY };

    if (!isDragging.current) {
      pan.setValue({ x: nextX, y: nextY });
    }
  }, [pan, pin.x, pin.y]);

  const finishDrag = useCallback(() => {
    pan.flattenOffset();
    const newX = (pan.x as any)._value;
    const newY = (pan.y as any)._value;
    const clampedX = Math.max(0, Math.min(newX, BOARD_SIZE - PIN_WIDTH));
    const clampedY = Math.max(0, Math.min(newY, BOARD_SIZE - PIN_HEIGHT));

    currentPosition.current = { x: clampedX, y: clampedY };
    pan.setValue({ x: clampedX, y: clampedY });
    isDragging.current = false;
    onDragStateChange(false);
    onUpdatePosition(pin.id, clampedX, clampedY);
  }, [onDragStateChange, onUpdatePosition, pan, pin.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDragging.current = true;
        onDragStateChange(true);
        pan.setOffset(currentPosition.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: finishDrag,
      onPanResponderTerminate: finishDrag,
    }),
  ).current;

  const pseudoRandom = pin.id.charCodeAt(0) % 5;
  const tilts = ["-3deg", "-1deg", "0deg", "1deg", "3deg"];
  const tilt = tilts[pseudoRandom];

  const colors = ["#FDFBF7", "#FFF5E6", "#F0F7F4", "#F4F0F7"];
  const bgColor = colors[pin.id.charCodeAt(1) % colors.length];

  return (
    <Animated.View
      style={[
        styles.pinWrapper,
        {
          backgroundColor: bgColor,
          transform: [...pan.getTranslateTransform(), { rotate: tilt }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.pinHeader}>
        <Ionicons name="pin" size={18} color={Colors.light.primary} />
        {canDelete ? (
          <TouchableOpacity onPress={() => onDelete(pin.id)} hitSlop={12}>
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={Colors.light.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.pinTitle}>{pin.title}</Text>
      {pin.description ? (
        <Text style={styles.pinDesc}>{pin.description}</Text>
      ) : null}
      <View style={styles.pinFooter}>
        <Text style={styles.pinMeta}>{authorLabel}</Text>
      </View>
    </Animated.View>
  );
});

export default function MoodBoardScreen() {
  const { coveId } = useLocalSearchParams<{ coveId: string }>();
  const insets = useSafeAreaInsets();
  const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { pins, loading, error, createPin, updatePin, deletePin } =
    usePins(coveId);
  const { members } = useCoveMembers(coveId);
  const currentUser = auth?.currentUser;
  const isOwner = coveOwnerId === currentUser?.uid;

  useEffect(() => {
    setInfoVisible(true);
  }, []);

  useEffect(() => {
    if (!coveId || !db) return;
    return onSnapshot(doc(db, "coves", coveId), (snap) => {
      if (snap.exists()) setCoveOwnerId(snap.data().createdBy);
    });
  }, [coveId]);

  const memberNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members],
  );

  const showDialog = useCallback(
    (title: string, message: string, actions?: AppDialogAction[]) => {
      setDialog({ title, message, actions });
    },
    [],
  );

  const handleCreatePin = useCallback(
    async (data: {
      title: string;
      description: string;
      x: number;
      y: number;
    }) => {
      try {
        await createPin(data);
        setAddModalVisible(false);
      } catch (e: any) {
        showDialog("Error", e.message || "Failed to add note");
      }
    },
    [createPin, showDialog],
  );

  const handleDeletePin = useCallback(
    (pinId: string) => {
      showDialog(
        "Remove Note",
        "Are you sure you want to remove this from the board?",
        [
          { label: "Cancel", variant: "secondary" },
          {
            label: "Remove",
            variant: "danger",
            onPress: () => {
              void deletePin(pinId);
            },
          },
        ],
      );
    },
    [deletePin, showDialog],
  );

  const handleUpdatePosition = useCallback(
    async (pinId: string, x: number, y: number) => {
      try {
        await updatePin(pinId, x, y);
      } catch (e) {
        logger.error("Failed to update pin position", e);
      }
    },
    [updatePin],
  );

  const handleDragStateChange = useCallback((dragging: boolean) => {
    setScrollEnabled(!dragging);
  }, []);

  if (error && pins.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={Colors.light.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtnCircle}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mood Board</Text>
        <TouchableOpacity
          onPress={() => setInfoVisible(true)}
          style={styles.backBtnCircle}
        >
          <Ionicons name="information" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {loading && pins.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : (
        <View style={styles.boardWrapper}>
          {pins.length === 0 ? (
            <View style={styles.emptyOverlay}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color={Colors.light.border}
              />
              <Text style={styles.emptyTitle}>The board is empty</Text>
              <Text style={styles.emptySub}>
                Drop the first sticky note anywhere.
              </Text>
            </View>
          ) : null}
          <ScrollView
            style={styles.scrollView}
            bounces={false}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              horizontal
              bounces={false}
              scrollEnabled={scrollEnabled}
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.board}>
                <View style={styles.gridOverlay} />
                {pins.map((pin) => (
                  <BoardPin
                    key={pin.id}
                    pin={pin}
                    authorLabel={
                      pin.authorName || memberNames[pin.authorId] || "Member"
                    }
                    canDelete={pin.authorId === currentUser?.uid || isOwner}
                    onDelete={handleDeletePin}
                    onUpdatePosition={handleUpdatePosition}
                    onDragStateChange={handleDragStateChange}
                  />
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.light.primary }]}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <AddPinModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleCreatePin}
      />

      <FeatureInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title="Mood Board"
        description="A shared board where your Cove can drop ideas, memories, and quick notes, then move them around together like a living wall of sticky notes."
        howToUse={[
          "Tap the plus button to add a new note to the board.",
          "Drag any note to reposition it and organize the board visually.",
        ]}
        iconName="clipboard"
      />

      <AppDialog
        visible={!!dialog}
        title={dialog?.title || ""}
        message={dialog?.message || ""}
        actions={dialog?.actions}
        onClose={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F2",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.light.text,
  },
  boardWrapper: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: "#F3EEDB",
  },
  emptyOverlay: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    pointerEvents: "none",
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.light.textMuted,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  pinWrapper: {
    position: "absolute",
    width: PIN_WIDTH,
    minHeight: 120,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#2F2E2C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    height: 24,
  },
  pinTitle: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  pinDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  pinFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
  },
  pinMeta: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: Colors.light.textMuted,
    textTransform: "uppercase",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.light.error,
    marginTop: 16,
  },
  errorBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
  },
  errorBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
