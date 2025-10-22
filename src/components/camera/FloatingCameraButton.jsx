import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingCameraButton() {
  const navigate = useNavigate();

  const handleCameraClick = () => {
    // Navigate to the full AddItem wizard
    navigate('/additem');
  };

  return (
    <>
      {/* Floating Camera Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleCameraClick}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
        >
          <Camera className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}
