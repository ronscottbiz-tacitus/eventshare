import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, QrCode, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HostEvents = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'host')) {
      navigate('/host/login');
      return;
    }

    if (user) {
      fetchEvents();
    }
  }, [user, loading]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`, {
        withCredentials: true,
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading || loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              My Events
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              data-testid="create-event-btn"
              onClick={() => navigate('/host/events/create')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Button>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              className="rounded-full px-6 py-2.5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-16 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Create your first event to start sharing memories</p>
            <Button
              onClick={() => navigate('/host/events/create')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-3"
            >
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="events-list">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {event.title}
                  </h3>
                  <div className="flex items-center text-emerald-50 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(event.start_time), 'PPP')}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {event.location && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                  )}

                  <div className="flex items-center text-gray-600 text-sm">
                    <QrCode className="w-4 h-4 mr-2" />
                    Join Code: <span className="font-mono font-bold ml-1">{event.join_code}</span>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      data-testid={`view-gallery-${event.id}`}
                      onClick={() => navigate(`/events/${event.id}/gallery`)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Gallery
                    </Button>
                    <Button
                      data-testid={`event-settings-${event.id}`}
                      onClick={() => navigate(`/events/${event.id}/settings`)}
                      variant="outline"
                      className="rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostEvents;