import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { oauth2Service } from '../lib/oauth2';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const savedState = sessionStorage.getItem('oauth2_state');

      // Check for OAuth2 errors first
      if (error) {
        setError(`OAuth2 Error: ${error} - ${errorDescription || 'Unknown error'}`);
        return;
      }

      // Validate state (CSRF protection)
      if (state !== savedState) {
        setError('Invalid state parameter - possible CSRF attack');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        // Exchange code for tokens
        const tokens = await oauth2Service.exchangeCodeForToken(code);

        // Store tokens
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);
        localStorage.setItem('isLoggedIn', 'true');

        // Also store in sessionStorage for Demo Inspection
        sessionStorage.setItem('access_token', tokens.access_token);
        if (tokens.id_token) {
          sessionStorage.setItem('id_token', tokens.id_token);
        }

        // Clean up
        sessionStorage.removeItem('oauth2_state');

        navigate('/registry');
      } catch (err) {
        console.error('Token exchange error:', err);
        setError('Failed to complete login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    // Handle "User Denied Access" gracefully
    if (error.includes('access_denied')) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛑</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Login Canceled</h3>
            <p className="text-sm text-slate-600">
              You denied the access request. To continue, you must authorize the application.
            </p>
            <button
              onClick={() => navigate('/teacher-home')}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors font-medium"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    // Default error view
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 bg-red-50 p-4 rounded border border-red-200">
          <strong>Authentication Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-slate-600 font-medium">Finalizing secure connection...</p>
      </div>
    </div>
  );
}