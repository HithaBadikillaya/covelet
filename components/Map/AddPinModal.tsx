import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
} from 'react-native';

interface AddPinModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; description: string; latitude: number; longitude: number }) => Promise<void>;
    initialRegion: { latitude: number; longitude: number };
}

export const AddPinModal: React.FC<AddPinModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialRegion,
}) => {
    const themeColors = Colors.light;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState(String(initialRegion.latitude));
    const [longitude, setLongitude] = useState(String(initialRegion.longitude));
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (visible) {
            setLatitude(String(initialRegion.latitude));
            setLongitude(String(initialRegion.longitude));
        }
    }, [visible, initialRegion.latitude, initialRegion.longitude]);

    const handleClose = () => {
        if (!loading) {
            setTitle('');
            setDescription('');
            onClose();
        }
    };

    const handleSubmit = async () => {
        const t = title.trim();
        const d = description.trim();
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!t) {
            Alert.alert('Missing title', 'Enter a title for this memory.');
            return;
        }
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            Alert.alert('Invalid location', 'Enter valid latitude and longitude.');
            return;
        }
        setLoading(true);
        try {
            await onSubmit({ title: t, description: d, latitude: lat, longitude: lng });
            setTitle('');
            setDescription('');
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add pin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={handleClose} />
                <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: themeColors.text }]}>Add memory to map</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
                            <Ionicons name="close" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.label, { color: themeColors.text }]}>Title</Text>
                    <TextInput
                        style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.muted, borderColor: themeColors.border }]}
                        placeholder="e.g. Main quad"
                        placeholderTextColor={themeColors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        editable={!loading}
                    />
                    <Text style={[styles.label, { color: themeColors.text }]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline, { color: themeColors.text, backgroundColor: themeColors.muted, borderColor: themeColors.border }]}
                        placeholder="What happened here?"
                        placeholderTextColor={themeColors.textMuted}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        editable={!loading}
                    />
                    <Text style={[styles.label, { color: themeColors.text }]}>Latitude</Text>
                    <TextInput
                        style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.muted, borderColor: themeColors.border }]}
                        placeholder="e.g. 37.78825"
                        placeholderTextColor={themeColors.textMuted}
                        keyboardType="decimal-pad"
                        value={latitude}
                        onChangeText={setLatitude}
                        editable={!loading}
                    />
                    <Text style={[styles.label, { color: themeColors.text }]}>Longitude</Text>
                    <TextInput
                        style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.muted, borderColor: themeColors.border }]}
                        placeholder="e.g. -122.4324"
                        placeholderTextColor={themeColors.textMuted}
                        keyboardType="decimal-pad"
                        value={longitude}
                        onChangeText={setLongitude}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.submit, { backgroundColor: themeColors.primary }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Add pin</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    card: { borderRadius: 24, padding: 24, width: '90%', maxWidth: 420, maxHeight: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontFamily: Fonts.heading, fontSize: 22 },
    closeBtn: { padding: 8 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 14, marginBottom: 6 },
    input: { borderRadius: 12, padding: 12, fontFamily: Fonts.body, fontSize: 16, borderWidth: 1, marginBottom: 12 },
    inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
    submit: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    submitText: { fontFamily: Fonts.heading, fontSize: 16, color: '#fff' },
});
