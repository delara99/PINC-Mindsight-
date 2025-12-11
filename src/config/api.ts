const getApiUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!envUrl) return 'http://localhost:3000';

    if (!envUrl.startsWith('http')) {
        return `https://${envUrl}`;
    }
    return envUrl;
};

export const API_URL = getApiUrl();
