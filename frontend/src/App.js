import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Welcome from "@/pages/Welcome";
import HostLogin from "@/pages/HostLogin";
import HostEvents from "@/pages/HostEvents";
import CreateEvent from "@/pages/CreateEvent";
import JoinEvent from "@/pages/JoinEvent";
import EventGallery from "@/pages/EventGallery";
import UploadPhotos from "@/pages/UploadPhotos";
import EventSettings from "@/pages/EventSettings";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/host/login" element={<HostLogin />} />
            <Route path="/host/events" element={<HostEvents />} />
            <Route path="/host/events/create" element={<CreateEvent />} />
            <Route path="/join" element={<JoinEvent />} />
            <Route path="/join/:joinCode" element={<JoinEvent />} />
            <Route path="/events/:eventId/gallery" element={<EventGallery />} />
            <Route path="/events/:eventId/upload" element={<UploadPhotos />} />
            <Route path="/events/:eventId/settings" element={<EventSettings />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;