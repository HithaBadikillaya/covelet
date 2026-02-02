import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CreateStoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string, isAnonymous: boolean) => Promise<void>;
}

const MAX_WORDS = 500;

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const themeColors = Colors.light;
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // #region agent log
    React.useEffect(() => {
        if (visible) {
            fetch('http://127.0.0.1:7242/ingest/207d706e-498d-4353-8c5c-780361927bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateStoryModal.tsx:36',message:'Modal opened',data:{visible,contentLength:content.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }
    }, [visible, content.length]);
    // #endregion

    const trimmedContent = content.trim();
    const wordCount = trimmedContent.length > 0 
        ? trimmedContent.split(/\s+/).filter((w) => w.length > 0).length 
        : 0;
    const isOverLimit = wordCount > MAX_WORDS;
    const canSubmit = trimmedContent.length > 0 && !isOverLimit && !loading;

    const handleClose = () => {
        if (!loading) {
            setContent('');
            setIsAnonymous(false);
            onClose();
        }
    };

    const handleSubmit = async () => {
        const trimmed = content.trim();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/207d706e-498d-4353-8c5c-780361927bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateStoryModal.tsx:53',message:'handleSubmit called',data:{contentLength:content.length,trimmedLength:trimmed.length,isOverLimit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (!trimmed || trimmed.length === 0) {
            Alert.alert('Empty Story', 'Please write something before sharing.');
            return;
        }
        
        if (isOverLimit) {
            Alert.alert('Story Too Long', `Your story is ${wordCount} words. Please keep it under ${MAX_WORDS} words.`);
            return;
        }

        if (loading) return;

        setLoading(true);
        try {
            await onSubmit(trimmed, isAnonymous);
            setContent('');
            setIsAnonymous(false);
            onClose();
        } catch (error: any) {
            console.error('Error creating story:', error);
            Alert.alert('Error', error.message || 'Failed to create story');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={handleClose} />

                <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={[styles.title, { color: themeColors.text }]}>
                                Share Your Story
                            </Text>
                            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                                What moment do you want to share?
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeBtn}
                            disabled={loading}
                        >
                            <Ionicons name="close" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* User Identity Section */}
                    {currentUser && (
                        <View style={styles.userIdentitySection}>
                            <Avatar className="h-10 w-10">
                                {currentUser.photoURL ? (
                                    <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || 'User'} />
                                ) : null}
                                <AvatarFallback className="bg-primary">
                                    <Text style={styles.avatarText}>
                                        {currentUser.displayName 
                                            ? currentUser.displayName.substring(0, 2).toUpperCase()
                                            : 'U'}
                                    </Text>
                                </AvatarFallback>
                            </Avatar>
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: themeColors.text }]}>
                                    {isAnonymous ? 'Anonymous' : (currentUser.displayName || 'User')}
                                </Text>
                                <Text style={[styles.userHint, { color: themeColors.textMuted }]}>
                                    {isAnonymous ? 'Your identity will be hidden' : 'Posting as yourself'}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.scrollContainer}>
                        <ScrollView 
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={true}
                            onLayout={(e) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/207d706e-498d-4353-8c5c-780361927bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateStoryModal.tsx:114',message:'ScrollView layout',data:{height:e.nativeEvent.layout.height,width:e.nativeEvent.layout.width},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                // #endregion
                            }}
                        >
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    color: themeColors.text,
                                    backgroundColor: themeColors.muted,
                                    borderColor: isOverLimit
                                        ? themeColors.error
                                        : themeColors.border,
                                },
                            ]}
                            placeholder="Tell us your story..."
                            placeholderTextColor={themeColors.textMuted}
                            multiline
                            value={content}
                            onChangeText={(text) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/207d706e-498d-4353-8c5c-780361927bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateStoryModal.tsx:130',message:'TextInput onChangeText',data:{textLength:text.length,hasText:text.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                // #endregion
                                setContent(text);
                            }}
                            maxLength={MAX_WORDS * 10} // Rough estimate: ~10 chars per word
                            textAlignVertical="top"
                            editable={!loading}
                            onLayout={(e) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/207d706e-498d-4353-8c5c-780361927bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateStoryModal.tsx:133',message:'TextInput layout',data:{height:e.nativeEvent.layout.height,width:e.nativeEvent.layout.width,visible:e.nativeEvent.layout.height>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                                // #endregion
                            }}
                        />

                            <View style={styles.counterRow}>
                                <Text
                                    style={[
                                        styles.counter,
                                        {
                                            color: isOverLimit
                                                ? themeColors.error
                                                : themeColors.textMuted,
                                        },
                                    ]}
                                >
                                    {wordCount} / {MAX_WORDS} words
                                </Text>
                                {isOverLimit && (
                                    <Text style={[styles.errorText, { color: themeColors.error }]}>
                                        Please reduce your story length
                                    </Text>
                                )}
                            </View>

                        <View style={styles.anonymousRow}>
                            <View style={styles.anonymousInfo}>
                                <Ionicons
                                    name={isAnonymous ? "eye-off-outline" : "eye-outline"}
                                    size={22}
                                    color={isAnonymous ? themeColors.primary : themeColors.textMuted}
                                />
                                <View style={styles.anonymousTextContainer}>
                                    <Text style={[styles.anonymousLabel, { color: themeColors.text }]}>
                                        Post anonymously
                                    </Text>
                                    <Text
                                        style={[
                                            styles.anonymousHint,
                                            { color: themeColors.textMuted },
                                        ]}
                                    >
                                        {isAnonymous 
                                            ? 'Your name and avatar will be hidden from others'
                                            : 'Your name and avatar will be visible'}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isAnonymous}
                                onValueChange={setIsAnonymous}
                                disabled={loading}
                                trackColor={{
                                    false: themeColors.muted,
                                    true: themeColors.primary,
                                }}
                                thumbColor="#fff"
                            />
                        </View>
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            {
                                backgroundColor: canSubmit
                                    ? themeColors.primary
                                    : themeColors.muted,
                                opacity: loading ? 0.6 : 1,
                            },
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Share Story</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        paddingBottom: 24,
        maxHeight: '85%',
        width: '90%',
        maxWidth: 420,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 1,
    },
    scrollContainer: {
        flex: 1,
        minHeight: 280,
        maxHeight: 380,
        marginBottom: 20,
    },
    inputSection: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerContent: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userIdentitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        marginBottom: 2,
    },
    userHint: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    avatarText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    textInput: {
        minHeight: 180,
        borderRadius: 12,
        padding: 16,
        fontFamily: Fonts.body,
        fontSize: 16,
        lineHeight: 24,
        borderWidth: 1,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    counter: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    anonymousRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 8,
    },
    anonymousInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    anonymousTextContainer: {
        flex: 1,
    },
    anonymousLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 16,
        marginBottom: 4,
    },
    anonymousHint: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    submitButton: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    submitText: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#fff',
        letterSpacing: 1,
    },
});
