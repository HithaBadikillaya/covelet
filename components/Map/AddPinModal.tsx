import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  initialRegion: { latitude: number; longitude: number };
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

interface ReverseGeocodingResult {
  display_name: string;
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialRegion,
}) => {
  const themeColors = Colors.light;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationFromMap, setLocationFromMap] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  React.useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setAddress("");
      setLocationFromMap(null);
    }
  }, [visible]);

  // When modal opens with initialRegion (from map tap), reverse geocode to get address
  React.useEffect(() => {
    if (visible && initialRegion && !locationFromMap) {
      const coords = initialRegion;
      if (
        typeof coords.latitude === "number" &&
        typeof coords.longitude === "number"
      ) {
        setLocationFromMap(coords);
        reverseGeocode(coords.latitude, coords.longitude);
      }
    }
  }, [visible, initialRegion]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      setGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "CoveletApp/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding service unavailable");
      }
      const data: ReverseGeocodingResult = await response.json();
      if (data?.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      Alert.alert(
        "Location lookup",
        "Could not fetch address for these coordinates.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleClose = () => {
    if (!loading && !geocoding) {
      setTitle("");
      setDescription("");
      setAddress("");
      setLocationFromMap(null);
      onClose();
    }
  };

  const geocodeAddress = async (
    addressString: string,
  ): Promise<GeocodingResult | null> => {
    try {
      setGeocoding(true);
      const encodedAddress = encodeURIComponent(addressString.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            "User-Agent": "CoveletApp/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Geocoding service unavailable");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    const t = title.trim();
    const d = description.trim();
    const a = address.trim();

    if (!t) {
      Alert.alert("Missing title", "Enter a title for this memory.");
      return;
    }

    if (!a) {
      Alert.alert("Missing address", "Enter an address for this memory.");
      return;
    }

    setLoading(true);
    try {
      // Geocode the address
      const coordinates = await geocodeAddress(a);

      if (!coordinates) {
        Alert.alert(
          "Invalid address",
          "Could not find the entered address. Please try a different address.",
        );
        return;
      }

      await onSubmit({
        title: t,
        description: d,
        address: a,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setTitle("");
      setDescription("");
      setAddress("");
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add pin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Add memory to map
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              disabled={loading || geocoding}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: themeColors.text }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.muted,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="e.g. Main quad"
            placeholderTextColor={themeColors.textMuted}
            value={title}
            onChangeText={setTitle}
            editable={!loading && !geocoding}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>
            Description
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              {
                color: themeColors.text,
                backgroundColor: themeColors.muted,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="What happened here?"
            placeholderTextColor={themeColors.textMuted}
            multiline
            value={description}
            onChangeText={setDescription}
            editable={!loading && !geocoding}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>
            Address
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.muted,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="e.g. 123 Main Street, City"
            placeholderTextColor={themeColors.textMuted}
            value={address}
            onChangeText={setAddress}
            editable={!loading && !geocoding}
          />

          <TouchableOpacity
            style={[
              styles.submit,
              {
                backgroundColor: "#fff",
                borderColor: themeColors.primary,
                borderWidth: 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading || geocoding}
            activeOpacity={0.85}
          >
            {geocoding ? (
              <View style={styles.submitContent}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={[styles.submitText, { color: "#000" }]}>
                  Finding location...
                </Text>
              </View>
            ) : loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <View style={styles.submitContent}>
                <Ionicons name="location-outline" size={20} color="#000" />
                <Text style={[styles.submitText, { color: "#000" }]}>
                  Add Pin
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 420,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontFamily: Fonts.heading, fontSize: 22 },
  closeBtn: { padding: 8 },
  label: { fontFamily: Fonts.bodyBold, fontSize: 14, marginBottom: 6 },
  input: {
    borderRadius: 12,
    padding: 12,
    fontFamily: Fonts.body,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  submit: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
    marginTop: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitText: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
});
