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
  const [isSupported, setIsSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    // Check if MediaRecorder is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && MediaRecorder) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn('MediaRecorder not supported on this device');
    }

    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           window.innerWidth <= 768;
    setIsMobile(isMobileDevice);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone access with mobile-friendly constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Lower sample rate for better mobile compatibility
          channelCount: 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Check for supported MIME types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing Failed",
            description: "Could not process your voice input. Please try again.",
            variant: "destructive"
          });
        } finally {
          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };
      
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your item details now. Click stop when finished.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      // Convert audio blob to base64
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          // Extract base64 part after the comma
          const base64 = result.split(',')[1];
          console.log('Base64 audio length:', base64.length);
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(audioBlob);
      });

      console.log('Sending audio to Whisper API...');
      
      // Send to Whisper API with correct parameter name
      const response = await fetch('/api/whisper-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audioBase64: base64Audio
        })
      });

      console.log('Whisper API response status:', response.status);
      const result = await response.json();
      console.log('Whisper API response:', result);

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
        description: `Could not process your voice input: ${error.message}`,
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
      <div className={`bg-gray-900 rounded-lg p-6 w-full ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
        <div className="text-center mb-6">
          <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Mic className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-white`} />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Voice Input</h3>
          <p className="text-gray-400 text-sm">
            {targetField === 'intelligent' 
              ? "Describe your item - AI will intelligently extract title and description"
              : `Describe your item details. The text will be added to your ${targetField}.`
            }
          </p>
        </div>

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 mb-4`}>
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              className={`${isMobile ? 'w-full h-14' : 'flex-1'} bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg`}
            >
              <Mic className="w-5 h-5 mr-2" />
              {isMobile ? 'Tap to Start Recording' : 'Start Recording'}
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className={`${isMobile ? 'w-full h-14' : 'flex-1'} bg-red-600 hover:bg-red-700 text-white text-lg`}
            >
              <MicOff className="w-5 h-5 mr-2" />
              {isMobile ? 'Tap to Stop Recording' : 'Stop Recording'}
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className={`${isMobile ? 'w-full' : ''} border-gray-700 text-gray-300 hover:bg-gray-800`}
          >
            <X className="w-4 h-4 mr-2" />
            {isMobile ? 'Cancel' : ''}
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
              ? (isMobile ? "Recording... speak clearly into your device" : "Recording... speak clearly and describe your item")
              : (isMobile ? "Tap the button to start recording" : "Tap 'Start Recording' to begin speaking")
            }
            {targetField === 'intelligent' && !isRecording && (
              <><br />You can mention the item name, features, condition, or any details you want to highlight.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
