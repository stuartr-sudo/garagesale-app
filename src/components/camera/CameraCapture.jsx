import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, X, RotateCcw, Check, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
        
        // Auto-analyze the image
        await analyzeImage(blob);
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const analyzeImage = async (imageBlob) => {
    setIsAnalyzing(true);
    
    try {
      // Convert blob to base64 for API
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imageBlob);
      });

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
        toast({
          title: "Image Analyzed!",
          description: "AI has generated a description and suggested details.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze image. You can still proceed manually.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    startCamera();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const confirmCapture = () => {
    if (capturedImage && analysisResult) {
      onCapture({
        image: capturedImage,
        analysis: analysisResult
      });
    }
  };

  const closeCamera = () => {
    stopCamera();
    onClose();
  };

  // Start camera when component mounts
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Restart camera when facing mode changes
  React.useEffect(() => {
    if (stream) {
      stopCamera();
      startCamera();
    }
  }, [facingMode, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900/95 border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Take Photo
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCamera}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!capturedImage ? (
            // Camera View
            <div className="relative">
              <div className="aspect-video bg-black relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isCapturing && (
                  <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                    <div className="animate-pulse text-white text-lg font-semibold">
                      Capturing...
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg"
                >
                  <Camera className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : (
            // Captured Image View
            <div className="space-y-4">
              <div className="aspect-video bg-black relative overflow-hidden rounded-lg">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <div className="text-sm">AI is analyzing your photo...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">AI Analysis</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Suggested Title:</label>
                      <div className="text-white font-medium">{analysisResult.title}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-400">Description:</label>
                      <div className="text-gray-300 text-sm">{analysisResult.description}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-gray-400">
                        {analysisResult.category}
                      </Badge>
                      <Badge variant="outline" className="text-gray-400">
                        {analysisResult.condition}
                      </Badge>
                      {analysisResult.suggested_price && (
                        <Badge className="bg-green-600 text-white">
                          ${analysisResult.suggested_price}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 p-4">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                
                <Button
                  onClick={confirmCapture}
                  disabled={!analysisResult}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use This Photo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
