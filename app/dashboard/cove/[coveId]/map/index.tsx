import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddPinModal } from "@/components/Map/AddPinModal";
import { FEATURE_DESCRIPTIONS } from "@/constants/features";
import { Colors, Fonts } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import type { Pin } from "@/hooks/usePins";
import { usePins } from "@/hooks/usePins";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapScreen() {
  const { coveId } = useLocalSearchParams<{ coveId: string }>();
  const insets = useSafeAreaInsets();
  const themeColors = Colors.light;
  const [coveOwnerId, setCoveOwnerId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { pins, loading, error, createPin, deletePin } = usePins(coveId);
  const currentUser = auth.currentUser;
  const isOwner = coveOwnerId === currentUser?.uid;

  useEffect(() => {
    if (!coveId) return;
    return onSnapshot(doc(db, "coves", coveId), (snap) => {
      if (snap.exists()) setCoveOwnerId(snap.data().createdBy);
    });
  }, [coveId]);

  useEffect(() => {
    if (
      pins.length > 0 &&
      pins[0].location?.latitude != null &&
      pins[0].location?.longitude != null
    ) {
      setRegion((r) => ({
        ...r,
        latitude: pins[0].location.latitude,
        longitude: pins[0].location.longitude,
      }));
    }
  }, [pins]);

  const handleCreatePin = async (data: {
    title: string;
    description: string;
    address?: string;
    latitude: number;
    longitude: number;
  }) => {
    try {
      await createPin({
        title: data.title,
        description: data.description,
        address: data.address || "",
        latitude: data.latitude,
        longitude: data.longitude,
      });
      setAddModalVisible(false);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add pin";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const coordinates = event.nativeEvent.coordinate;
    setSelectedCoordinates(coordinates);
    setAddModalVisible(true);
  };

  const handleDeletePin = (pin: Pin) => {
    const canDelete = pin.authorId === currentUser?.uid || isOwner;
    if (!canDelete) return;
    Alert.alert("Delete pin", "Remove this memory from the map?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePin(pin.id),
      },
    ]);
  };

  if (error && pins.length === 0) {
    return (
      <AuthGuard>
        <View
          style={[
            styles.container,
            styles.center,
            { backgroundColor: themeColors.background },
          ]}
        >
          <Text style={[styles.errorText, { color: themeColors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: "#fff",
                borderColor: themeColors.primary,
                borderWidth: 1,
              },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.backBtnText, { color: "#000" }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Memory Map
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={[styles.description, { color: themeColors.textMuted }]}>
          {FEATURE_DESCRIPTIONS.map}
        </Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            mapType="standard"
          >
            {pins
              .filter(
                (p) =>
                  p.location?.latitude != null && p.location?.longitude != null,
              )
              .map((p) => (
                <Marker
                  key={p.id}
                  coordinate={{
                    latitude: p.location.latitude,
                    longitude: p.location.longitude,
                  }}
                  title={p.title}
                  description={p.description}
                />
              ))}
          </MapView>
        </View>
        {loading && pins.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={themeColors.primary} />
          </View>
        ) : pins.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="map-outline"
              size={48}
              color={themeColors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              No pins yet
            </Text>
            <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
              Add a memory to a place.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pins}
            keyExtractor={(p) => p.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const canDelete = item.authorId === currentUser?.uid || isOwner;
              return (
                <View
                  style={[
                    styles.pinCard,
                    { backgroundColor: themeColors.card },
                  ]}
                >
                  <View style={styles.pinRow}>
                    <Text
                      style={[styles.pinTitle, { color: themeColors.text }]}
                    >
                      {item.title}
                    </Text>
                    {canDelete && (
                      <TouchableOpacity onPress={() => handleDeletePin(item)}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={themeColors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text
                    style={[styles.pinDesc, { color: themeColors.textMuted }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                  {item.address && (
                    <View style={styles.pinAddressRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={themeColors.textMuted}
                      />
                      <Text
                        style={[
                          styles.pinMeta,
                          { color: themeColors.textMuted, marginLeft: 4 },
                        ]}
                      >
                        {item.address}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: "#fff",
              borderColor: themeColors.primary,
              borderWidth: 1,
            },
          ]}
          onPress={() => {
            setSelectedCoordinates(null);
            setAddModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
        <AddPinModal
          visible={addModalVisible}
          onClose={() => {
            setAddModalVisible(false);
            setSelectedCoordinates(null);
          }}
          onSubmit={handleCreatePin}
          initialRegion={selectedCoordinates || region}
        />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontFamily: Fonts.heading, fontSize: 20 },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  pinCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pinTitle: { fontFamily: Fonts.bodyBold, fontSize: 16 },
  pinDesc: { fontFamily: Fonts.body, fontSize: 14, marginBottom: 4 },
  pinAddressRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  pinMeta: { fontFamily: Fonts.body, fontSize: 11 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: { fontFamily: Fonts.heading, fontSize: 18, marginTop: 12 },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, marginTop: 6 },
  errorText: { fontFamily: Fonts.body, marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backBtnText: { fontFamily: Fonts.heading, color: "#fff" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
