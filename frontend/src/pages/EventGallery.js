import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Camera, Trash2, Settings as SettingsIcon, QrCode, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventGallery = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user, checkAuth } = useAuth();
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      await checkAuth();
      
      const [eventRes, mediaRes] = await Promise.all([
        axios.get(`${API}/events/${eventId}`, { withCredentials: true }),
        axios.get(`${API}/events/${eventId}/media`, { withCredentials: true }),
      ]);

      setEvent(eventRes.data);
      setMedia(mediaRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('You need to join this event first');
        navigate('/join');
      } else {
        toast.error('Failed to load event');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(`${API}/media/${mediaId}`, { withCredentials: true });
      setMedia(media.filter((m) => m.id !== mediaId));
      setSelectedMedia(null);
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete photo');
    }
  };

  const isHost = user && event && event.host_user_id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading gallery...</p>
      </div>
    );
  }

  if (!event) return null;

  const joinUrl = `${window.location.origin}/join/${event.join_code}`;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            data-testid="back-btn"
            onClick={() => navigate(isHost ? '/host/events' : '/')}
            variant="ghost"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {isHost && (
              <>
                <Dialog open={showQR} onOpenChange={setShowQR}>
                  <DialogTrigger asChild>
                    <Button
                      data-testid="show-qr-btn"
                      variant="outline"
                      className="rounded-full"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="flex justify-center">
                        <QRCodeCanvas value={joinUrl} size={256} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">Event Code</p>
                        <p className="text-3xl font-mono font-bold text-emerald-600">
                          {event.join_code}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={joinUrl}
                          readOnly
                          className="text-sm"
                        />
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
                  </DialogContent>
                </Dialog>

                <Button
                  data-testid="settings-btn"
                  onClick={() => navigate(`/events/${eventId}/settings`)}
                  variant="outline"
                  className="rounded-full"
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span>{format(new Date(event.start_time), 'PPP')}</span>
            {event.location && <span>• {event.location}</span>}
            <span>• {media.length} photos</span>
          </div>
        </div>

        {media.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-16 text-center" data-testid="empty-gallery">
            <Camera className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-6">Be the first to share a photo!</p>
            <Button
              data-testid="add-photos-btn-empty"
              onClick={() => navigate(`/events/${eventId}/upload`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Photos
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6" data-testid="photo-grid">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  data-testid={`photo-${item.id}`}
                >
                  <img
                    src={`${BACKEND_URL}${item.storage_url}`}
                    alt="Event photo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium truncate">{item.uploader_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-6 right-6">
              <Button
                data-testid="add-photos-btn"
                onClick={() => navigate(`/events/${eventId}/upload`)}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full px-8 py-6 shadow-2xl hover:shadow-3xl transition-all"
              >
                <Plus className="w-6 h-6 mr-2" />
                Add Photos
              </Button>
            </div>
          </>
        )}

        {selectedMedia && (
          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent className="sm:max-w-4xl" data-testid="photo-detail-modal">
              <img
                src={`${BACKEND_URL}${selectedMedia.storage_url}`}
                alt="Full size"
                className="w-full rounded-lg"
              />
              <div className="space-y-3 pt-4">
                <div>
                  <p className="text-sm text-gray-600">Uploaded by</p>
                  <p className="font-semibold">{selectedMedia.uploader_name}</p>
                </div>
                {selectedMedia.caption && (
                  <div>
                    <p className="text-sm text-gray-600">Caption</p>
                    <p>{selectedMedia.caption}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Uploaded</p>
                  <p>{format(new Date(selectedMedia.uploaded_at), 'PPp')}</p>
                </div>
                {(isHost || selectedMedia.uploader_user_id === user?.id) && (
                  <Button
                    data-testid="delete-photo-btn"
                    onClick={() => handleDelete(selectedMedia.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Photo
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default EventGallery;