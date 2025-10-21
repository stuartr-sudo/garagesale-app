import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, X, RotateCcw, Check, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MobileCameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [step, setStep] = useState('camera'); // 'camera', 'captured', 'analyzing', 'result'

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
    setStep('captured');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
        
        // Auto-analyze
        setStep('analyzing');
        await analyzeImage(blob);
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const analyzeImage = async (imageBlob) => {
    setIsAnalyzing(true);
    
    try {
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
        setStep('result');
        toast({
          title: "Photo Analyzed!",
          description: "AI has generated listing details for you.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setStep('result');
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
    setStep('camera');
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

  const goBack = () => {
    if (step === 'camera') {
      onClose();
    } else {
      setStep('camera');
      startCamera();
    }
  };

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  useEffect(() => {
    if (stream && step === 'camera') {
      stopCamera();
      startCamera();
    }
  }, [facingMode, startCamera, stopCamera, stream, step]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-lg">
        <Button
          variant="ghost"
          onClick={goBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="text-white font-semibold text-lg">
          {step === 'camera' ? 'Take Photo' : 
           step === 'analyzing' ? 'Analyzing...' : 
           'Review Photo'}
        </h1>
        
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {step === 'camera' && (
          <>
            {/* Camera View */}
            <div className="flex-1 relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                  <div className="animate-pulse text-white text-xl font-semibold">
                    Capturing...
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-6 bg-black/80 backdrop-blur-lg">
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="w-12 h-12 bg-white/20 text-white hover:bg-white/30 rounded-full"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 shadow-2xl"
                >
                  <Camera className="w-8 h-8" />
                </Button>
                
                <div className="w-12 h-12" /> {/* Spacer */}
              </div>
            </div>
          </>
        )}

        {step === 'captured' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4 bg-black/80 backdrop-blur-lg">
              <div className="text-center text-white">
                <div className="text-lg font-semibold mb-2">Photo Captured!</div>
                <div className="text-sm text-gray-300">AI is analyzing your photo...</div>
              </div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex-1 bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
              <div className="text-xl font-semibold mb-2">AI is analyzing your photo...</div>
              <div className="text-sm text-gray-300">This may take a few seconds</div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="flex-1 flex flex-col">
            {/* Image Preview */}
            <div className="flex-1 bg-black relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              {analysisResult && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-600 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Analyzed
                  </Badge>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-t border-purple-800">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Suggested Title:</div>
                    <div className="text-white font-semibold">{analysisResult.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400">Description:</div>
                    <div className="text-gray-300 text-sm">{analysisResult.description}</div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
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
            <div className="p-4 bg-black/80 backdrop-blur-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
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
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
