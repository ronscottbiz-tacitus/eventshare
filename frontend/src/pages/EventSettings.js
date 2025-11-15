import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, QrCode, Share2, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventSettings = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [settings, setSettings] = useState({
    allow_upload: true,
    require_approval: false,
  });
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`, {
        withCredentials: true,
      });
      setEvent(response.data);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Failed to load event:', error);
      toast.error('Failed to load event');
      navigate('/host/events');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (key, value) => {
    try {
      await axios.put(
        `${API}/events/${eventId}/settings`,
        { [key]: value },
        { withCredentials: true }
      );
      setSettings({ ...settings, [key]: value });
      toast.success('Settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/events/${eventId}`, { withCredentials: true });
      toast.success('Event deleted');
      navigate('/host/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!event) return null;

  const joinUrl = `${window.location.origin}/join/${event.join_code}`;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          data-testid="back-btn"
          onClick={() => navigate(`/events/${eventId}/gallery`)}
          variant="ghost"
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Event Settings
            </h1>
            <p className="text-gray-600 mb-8">{event.title}</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
                <div className="space-y-3 text-gray-600">
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {format(new Date(event.start_time), 'PPP')}
                  </div>
                  {event.location && (
                    <div>
                      <span className="font-medium">Location:</span> {event.location}
                    </div>
                  )}
                  {event.description && (
                    <div>
                      <span className="font-medium">Description:</span> {event.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Share Options</h3>
                
                <div className="bg-emerald-50 rounded-2xl p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Event Code</p>
                    <div className="flex gap-2">
                      <Input
                        value={event.join_code}
                        readOnly
                        className="font-mono text-2xl font-bold text-center"
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(event.join_code);
                          toast.success('Code copied!');
                        }}
                        variant="outline"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Join Link</p>
                    <div className="flex gap-2">
                      <Input value={joinUrl} readOnly className="text-sm" />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(joinUrl);
                          toast.success('Link copied!');
                        }}
                        variant="outline"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <Dialog open={showQR} onOpenChange={setShowQR}>
                    <DialogTrigger asChild>
                      <Button
                        data-testid="show-qr-btn"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Show QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Event QR Code</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center py-6">
                        <QRCodeReact value={joinUrl} size={300} />
                      </div>
                      <p className="text-center text-sm text-gray-600">
                        Guests can scan this QR code to join the event
                      </p>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Privacy & Permissions</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between" data-testid="allow-upload-setting">
                <div className="space-y-1">
                  <Label htmlFor="allow-upload" className="text-base font-medium">
                    Allow guests to upload photos
                  </Label>
                  <p className="text-sm text-gray-600">
                    Enable or disable photo uploads from guests
                  </p>
                </div>
                <Switch
                  id="allow-upload"
                  data-testid="allow-upload-switch"
                  checked={settings.allow_upload}
                  onCheckedChange={(checked) => updateSettings('allow_upload', checked)}
                />
              </div>

              <div className="flex items-center justify-between" data-testid="require-approval-setting">
                <div className="space-y-1">
                  <Label htmlFor="require-approval" className="text-base font-medium">
                    Require host approval for photos
                  </Label>
                  <p className="text-sm text-gray-600">
                    Review photos before they appear in the gallery
                  </p>
                </div>
                <Switch
                  id="require-approval"
                  data-testid="require-approval-switch"
                  checked={settings.require_approval}
                  onCheckedChange={(checked) => updateSettings('require_approval', checked)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h3>
            <p className="text-gray-600 mb-4">
              Once you delete an event, there is no going back. All photos and data will be permanently removed.
            </p>
            <Button
              data-testid="delete-event-btn"
              onClick={handleDelete}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSettings;