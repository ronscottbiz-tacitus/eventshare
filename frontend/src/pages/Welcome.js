import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-6" data-testid="welcome-container">
          <div className="inline-block p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
            <Camera className="w-16 h-16 text-emerald-600" />
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            EventShare
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto">
            Share every moment together. Create events and let guests contribute photos instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Create Events</h3>
            <p className="text-gray-600">Host events and generate instant QR codes for guests to join</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Join Together</h3>
            <p className="text-gray-600">Guests scan QR codes or enter event codes to join instantly</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
              <Share2 className="w-7 h-7 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Share Photos</h3>
            <p className="text-gray-600">Everyone uploads photos to one shared gallery in real-time</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button
            data-testid="host-login-btn"
            onClick={() => navigate('/host/login')}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Host an Event
          </Button>
          
          <Button
            data-testid="join-event-btn"
            onClick={() => navigate('/join')}
            size="lg"
            variant="outline"
            className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-10 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Join an Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;