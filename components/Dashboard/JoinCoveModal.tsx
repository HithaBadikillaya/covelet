import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import {
    arrayUnion,
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
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

interface Props {
    visible: boolean;
    onClose: () => void;
    onJoin: (coveId: string) => void;
}

export default function JoinCoveModal({ visible, onClose, onJoin }: Props) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const auth = getAuth();

    const handleJoin = async () => {
        const trimmedCode = code.trim().toUpperCase();
        if (trimmedCode.length !== 6) return;
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            // 1. Query cove by joinCode
            const q = query(
                collection(db, "coves"),
                where("joinCode", "==", trimmedCode)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                Alert.alert("Invalid Code", "No Cove found with this join code.");
                setLoading(false);
                return;
            }

            const coveDoc = snapshot.docs[0];
            const coveData = coveDoc.data();
            const coveId = coveDoc.id;
            const userId = auth.currentUser.uid;

            // 2. Prevent re-joining or joining own cove
            if (coveData.members.includes(userId)) {
                Alert.alert("Already a Member", "You are already a member of this Cove.");
                setLoading(false);
                onClose();
                return;
            }

            // 3. Atomically join
            await updateDoc(doc(db, "coves", coveId), {
                members: arrayUnion(userId),
            });

            // 4. Cleanup and Navigate
            setCode("");
            setLoading(false);
            onClose();
            // Pass the coveId to the onJoin callback for navigation
            onJoin(coveId);
        } catch (error: any) {
            console.error("Error joining cove:", error);
            Alert.alert("Join Failed", "Something went wrong. Please try again later.");
            setLoading(false);
        }
    };

    const handleCodeChange = (text: string) => {
        // Only alphanumeric, uppercase, max 6
        const filteredText = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (filteredText.length <= 6) {
            setCode(filteredText);
        }
    };

    const renderBoxes = () => {
        const boxes = [];
        for (let i = 0; i < 6; i++) {
            const char = code[i] || "";
            const isFocused = i === code.length;
            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.box,
                        isFocused ? styles.boxFocused : styles.boxUnfocused
                    ]}
                >
                    <Text style={styles.boxText}>{char}</Text>
                </View>
            );
        }
        return boxes;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                }} />

                <View style={styles.modalCard}>
                    <Text style={styles.title}>Join a Cove</Text>
                    <Text style={styles.subtitle}>Enter the invitation code to enter a sanctuary.</Text>

                    {/* Code Input Area with Ghost Input Overlay */}
                    <View style={styles.codeRow}>
                        {renderBoxes()}
                        <TextInput
                            ref={inputRef}
                            onChangeText={handleCodeChange}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoFocus={false} // Handled in useEffect
                            caretHidden={true}
                            allowFontScaling={false}
                            contextMenuHidden={true}
                            style={styles.ghostInput}
                            keyboardType="default"
                            cursorColor="transparent"
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>CANCEL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                (code.length === 6 && !loading) ? styles.joinButtonActive : styles.joinButtonDisabled
                            ]}
                            onPress={handleJoin}
                            disabled={code.length !== 6 || loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.joinButtonText}>JOIN</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: "90%",
        maxWidth: 400,
        backgroundColor: "#09090b", // zinc-950
        padding: 24,
        borderWidth: 1,
        borderColor: "#27272a", // zinc-800
        borderRadius: 0,
    },
    title: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        color: "#a1a1aa", // zinc-400
        fontSize: 14,
        marginBottom: 24,
        textAlign: "center",
    },
    ghostInput: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0, // Completely invisible
        // It's important that it COVERS the boxes.
        // We set opacity to effectively 0 but let it capture touches.
        color: "transparent",
    },
    codeRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 32,
    },
    box: {
        width: 44,
        height: 48,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#18181b", // zinc-900
        marginHorizontal: 4,
        borderRadius: 0,
    },
    boxFocused: {
        borderColor: "#6366f1", // indigo-500
        backgroundColor: "#27272a", // zinc-800
    },
    boxUnfocused: {
        borderColor: "#27272a", // zinc-800
    },
    boxText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "bold",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#27272a", // zinc-800
        borderWidth: 1,
        borderColor: "#3f3f46", // zinc-700
    },
    cancelButtonText: {
        color: "#ffffff",
        fontWeight: "600",
        fontStyle: "italic",
        fontSize: 12,
    },
    joinButton: {
        flex: 1,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    joinButtonActive: {
        backgroundColor: "#4f46e5", // indigo-600
    },
    joinButtonDisabled: {
        backgroundColor: "#312e81", // indigo-900
        opacity: 0.5,
    },
    joinButtonText: {
        color: "#ffffff",
        fontWeight: "600",
        fontStyle: "italic",
        letterSpacing: 1.5,
        fontSize: 12,
    },
});
