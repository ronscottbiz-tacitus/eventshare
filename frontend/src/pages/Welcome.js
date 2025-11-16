import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Users, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();

  // Photo URLs for moving background
  const photoUrls = [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=400&h=400&fit=crop',
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Animated Photo Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-4 gap-4 animate-slow-scroll">
          {[...photoUrls, ...photoUrls].map((url, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-lg overflow-hidden animate-float"
              style={{
                animationDelay: `${idx * 0.5}s`,
                animationDuration: `${20 + (idx % 3) * 5}s`
              }}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover blur-sm hover:blur-none transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900/90" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-5xl w-full space-y-12">
          <div className="text-center space-y-8" data-testid="welcome-container">
            <div className="inline-block p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/30">
              <Camera className="w-16 h-16 text-emerald-400" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent animate-gradient" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                EventShare
              </h1>
              <div className="flex items-center justify-center gap-2 text-emerald-400/80">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium tracking-wider uppercase">Share Every Moment</span>
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Create events and let everyone share photos instantly. One gallery, countless memories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Create Events</h3>
              <p className="text-gray-400">Generate instant QR codes and invite guests to share memories</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-teal-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Join Together</h3>
              <p className="text-gray-400">Scan QR codes or enter event codes to join in seconds</p>
            </div>

            <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Share2 className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Share Photos</h3>
              <p className="text-gray-400">Everyone uploads to one shared gallery in real-time</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              data-testid="host-login-btn"
              onClick={() => navigate('/host/login')}
              size="lg"
              className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-12 py-7 rounded-full text-lg font-semibold shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Host an Event</span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            
            <Button
              data-testid="join-event-btn"
              onClick={() => navigate('/join')}
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-2 border-emerald-400/50 text-white hover:bg-white/20 hover:border-emerald-400 px-12 py-7 rounded-full text-lg font-semibold shadow-2xl transition-all duration-300"
            >
              Join an Event
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slow-scroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          75% {
            transform: translateY(10px) rotate(-1deg);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-slow-scroll {
          animation: slow-scroll 40s linear infinite;
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Welcome;