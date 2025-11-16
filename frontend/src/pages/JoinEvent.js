import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JoinEvent = () => {
  const navigate = useNavigate();
  const { joinCode: urlJoinCode } = useParams();
  const { checkAuth } = useAuth();
  const [joinCode, setJoinCode] = useState(urlJoinCode || '');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlJoinCode) {
      setJoinCode(urlJoinCode);
    }
  }, [urlJoinCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/events/join`, {
        join_code: joinCode.toUpperCase(),
        user_name: userName,
      }, {
        withCredentials: true,
      });

      await checkAuth();
      toast.success('Successfully joined event!');
      navigate(`/events/${response.data.event.id}/gallery`);
    } catch (error) {
      console.error('Failed to join event:', error);
      if (error.response?.status === 404) {
        toast.error('Event not found. Please check the code.');
      } else {
        toast.error('Failed to join event');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button
          data-testid="back-to-welcome-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Welcome
        </Button>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-10">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-4 border border-cyan-500/30">
              <Users className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Join Event
            </h1>
            <p className="text-gray-400">Enter the event code to join and start sharing photos</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-300 font-semibold">
                Your Name *
              </Label>
              <Input
                id="userName"
                data-testid="user-name-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                required
                className="h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:bg-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinCode" className="text-gray-300 font-semibold">
                Event Code *
              </Label>
              <Input
                id="joinCode"
                data-testid="join-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                className="h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:bg-white/10 font-mono text-lg tracking-wider text-center uppercase"
              />
            </div>

            <Button
              data-testid="join-event-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              {loading ? 'Joining...' : 'Join Event'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinEvent;