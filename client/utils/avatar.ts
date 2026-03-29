export const getPfpUrl = (seed: string) => {
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&eyes=bulging,dizzy,eva`;
};

export const getCoveBackgroundUrl = (seed: string) => {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed + '_cove')}&eyes=variant1W10,variant1W12,variant1W14&backgroundType=gradientLinear`;
};

export const generateRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
