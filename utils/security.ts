export const SECURITY_LIMITS = {
    coveName: 50,
    coveDescription: 180,
    avatarSeed: 80,
    joinCodeLength: 6,
    maxMembersPerCove: 50,
    pinTitle: 40,
    pinDescription: 300,
    quoteContent: 500,
    replyContent: 280,
    memberRole: 30,
    memberBio: 150,
    timeCapsuleEntry: 500,
    maxCapsuleYears: 10,
    boardWidth: 1500,
    boardHeight: 1500,
    pinWidth: 180,
    pinHeight: 140,
} as const;

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const MULTI_WHITESPACE_REGEX = /\s+/g;

function stripControlChars(value: string) {
    return value.replace(CONTROL_CHARS_REGEX, '');
}

export function normalizeSingleLineText(value: string, maxLength: number) {
    return stripControlChars(value)
        .replace(MULTI_WHITESPACE_REGEX, ' ')
        .trim()
        .slice(0, maxLength);
}

export function normalizeMultilineText(value: string, maxLength: number) {
    return stripControlChars(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .slice(0, maxLength);
}

export function normalizeAvatarSeed(value: string) {
    return normalizeSingleLineText(value, SECURITY_LIMITS.avatarSeed);
}

export function normalizeJoinCode(value: string) {
    return stripControlChars(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, SECURITY_LIMITS.joinCodeLength);
}

export function isValidJoinCode(value: string) {
    return new RegExp(`^[A-Z0-9]{${SECURITY_LIMITS.joinCodeLength}}$`).test(value);
}

export function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let index = 0; index < SECURITY_LIMITS.joinCodeLength; index += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function normalizeDisplayName(value: string | null | undefined) {
    return normalizeSingleLineText(value || 'Member', 60) || 'Member';
}

export function clampPinPosition(x: number, y: number) {
    const maxX = SECURITY_LIMITS.boardWidth - SECURITY_LIMITS.pinWidth;
    const maxY = SECURITY_LIMITS.boardHeight - SECURITY_LIMITS.pinHeight;

    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;

    return {
        x: Math.max(0, Math.min(Math.round(safeX), maxX)),
        y: Math.max(0, Math.min(Math.round(safeY), maxY)),
    };
}

export function isReasonableCapsuleDate(unlockAt: Date) {
    const now = Date.now();
    const unlockMs = unlockAt.getTime();
    const maxFutureMs = now + (SECURITY_LIMITS.maxCapsuleYears * 365 * 24 * 60 * 60 * 1000);

    return unlockMs > now && unlockMs <= maxFutureMs;
}