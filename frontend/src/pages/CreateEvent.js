import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    location: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/events`,
        {
          title: formData.title,
          description: formData.description || null,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: null,
          location: formData.location || null,
        },
        {
          withCredentials: true,
        }
      );

      toast.success('Event created successfully!');
      navigate(`/events/${response.data.id}/settings`);
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          data-testid="back-btn"
          onClick={() => navigate('/host/events')}
          variant="ghost"
          className="mb-6 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-10">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Create New Event
          </h1>
          <p className="text-gray-400 mb-8">Fill in the details for your event</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300 font-semibold">
                Event Name *
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <Input
                  id="title"
                  data-testid="event-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Birthday Party, Team BBQ, etc."
                  required
                  className="pl-11 h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300 font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                data-testid="event-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add more details about your event..."
                rows={4}
                className="rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-gray-300 font-semibold">
                Event Date & Time *
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <Input
                  id="start_time"
                  data-testid="event-datetime-input"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="pl-11 h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-blue-500 focus:bg-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-300 font-semibold">
                Location (Optional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <Input
                  id="location"
                  data-testid="event-location-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where is the event happening?"
                  className="pl-11 h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                onClick={() => navigate('/host/events')}
                variant="outline"
                className="flex-1 h-12 rounded-full font-semibold border-white/20 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-event-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-12 rounded-full font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;