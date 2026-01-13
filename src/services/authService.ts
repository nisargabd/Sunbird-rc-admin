// Configuration
const HYDRA_PUBLIC_URL = import.meta.env.VITE_ORY_HYDRA_PUBLIC || "http://localhost:4444";
const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID || "rc-client";
const REDIRECT_URI = import.meta.env.VITE_OAUTH2_REDIRECT_URI || "http://localhost:5173/callback";

// 1. Login with Redirect (Starts OAuth2 Flow)
export const loginWithRedirect = () => {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('oauth_state', state);

    // Redirect to Hydra
    window.location.href = `${HYDRA_PUBLIC_URL}/oauth2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `response_type=code&` +
        `scope=openid offline email profile&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `state=${state}`;
};

// 2. Handle Callback (Exchanges Code for JWT)
export const handleAuthCallback = async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
        console.error('State mismatch!');
        return false;
    }

    if (!code) return false;

    try {
        const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: import.meta.env.VITE_OAUTH2_CLIENT_SECRET || "",
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            // ✅ SUCCESS: We got a JWT!
            localStorage.setItem("accessToken", data.access_token);
            if (data.refresh_token) {
                localStorage.setItem("refreshToken", data.refresh_token);
            }
            return true;
        }
    } catch (error) {
        console.error("Token exchange failed:", error);
    }
    return false;
};

// 3. Logout
export const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
};
