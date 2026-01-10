import { Configuration, OAuth2Api } from '@ory/client';

const hydraConfig = new Configuration({
  basePath: import.meta.env.VITE_ORY_HYDRA_PUBLIC || "http://localhost:4444",
  baseOptions: {
    withCredentials: true,
  },
});

export const hydraOAuth2 = new OAuth2Api(hydraConfig);

export const oauth2Service = {
  // Start OAuth2 flow
  startAuthFlow() {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI || 'http://localhost:5173/callback';
    const scope = 'openid offline email profile';

    if (!clientId) {
      throw new Error('OAuth2 client ID not configured');
    }

    // Generate random state for CSRF protection (at least 8 characters)
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth2_state', state);

    // Build authorization URL
    const authUrl = new URL(`${import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444'}/oauth2/auth`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);

    console.log('Starting OAuth2 flow, redirecting to:', authUrl.toString());

    // Redirect to Hydra
    window.location.href = authUrl.toString();
  },

  // Exchange authorization code for tokens
  async exchangeCodeForToken(code: string): Promise<{ access_token: string, refresh_token: string, id_token?: string }> {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_OAUTH2_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI || 'http://localhost:5173/callback';

    console.log('Exchanging code for token...', { code, clientId });

    const response = await fetch(`${import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444'}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await response.json();
    console.log('Token exchange successful!');
    return tokens;
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const clientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_OAUTH2_CLIENT_SECRET;

    const response = await fetch(`${import.meta.env.VITE_ORY_HYDRA_PUBLIC || 'http://localhost:4444'}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  },
};