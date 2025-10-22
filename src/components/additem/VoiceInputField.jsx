import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function VoiceInputField({ 
  onTranscript, 
  onClose, 
  targetField = 'description',
  placeholder = 'Click the microphone to add voice input...'
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Check if MediaRecorder is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive"
      });
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your item details now. Click stop when finished.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio blob to base64
      const base64Audio = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // Send to Whisper API
      const response = await fetch('/api/whisper-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audioData: base64Audio,
          audioFormat: 'webm'
        })
      });

      const result = await response.json();

      if (result.success) {
        onTranscript(result.transcript);
        toast({
          title: "Voice Input Processed!",
          description: "Your speech has been converted to text.",
        });
      } else {
        throw new Error(result.error || 'Failed to process audio');
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process your voice input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <X className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Voice Input Not Supported</h3>
            <p className="text-gray-400 text-sm mb-4">
              Your browser doesn't support voice recording. Please use the text field instead.
            </p>
            <Button onClick={onClose} variant="outline" className="border-gray-700 text-gray-300">
              Continue with Text
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Voice Input</h3>
          <p className="text-gray-400 text-sm">
            Describe your item details. The text will be added to your {targetField}.
          </p>
        </div>

        <div className="flex gap-3 mb-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isProcessing && (
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Processing your voice...</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-400 text-xs">
            {isRecording 
              ? "Recording... speak clearly and describe your item"
              : "Tap 'Start Recording' to begin speaking"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
