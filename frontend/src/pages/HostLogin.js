import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/host/events')}`;

const HostLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const hash = location.hash;
    
    // Process session_id first before checking user
    if (hash && hash.includes('session_id=')) {
      processSessionId(hash);
      return;
    }
    
    // Only redirect if we have a user and no session_id to process
    if (user && user.role === 'host') {
      navigate('/host/events');
    }
  }, [user, location]);

  const processSessionId = async (hash) => {
    setProcessing(true);
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setProcessing(false);
      return;
    }

    try {
      console.log('Processing session_id:', sessionId);
      const response = await axios.post(`${API}/auth/google-callback`, null, {
        params: { session_id: sessionId },
        withCredentials: true,
      });
      
      console.log('Auth callback response:', response.data);

      // Clean URL
      window.history.replaceState(null, '', '/host/login');
      
      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check auth status
      await checkAuth();
      
      toast.success('Login successful!');
      navigate('/host/events');
    } catch (error) {
      console.error('Auth failed:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Authentication failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = AUTH_URL;
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-lg text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-emerald-100 rounded-2xl">
            <Camera className="w-12 h-12 text-emerald-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Host Login
          </h2>
          
          <p className="text-gray-600">
            Sign in with Google to create and manage your events
          </p>
        </div>

        <Button
          data-testid="google-login-btn"
          onClick={handleGoogleLogin}
          size="lg"
          className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center">
          <button
            data-testid="back-to-welcome-btn"
            onClick={() => navigate('/')}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostLogin;