import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function VoiceInput({ onTranscript, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak your item details now.",
        });
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Recognition Error",
          description: "Could not process speech. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive"
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Speech Detected",
        description: "Please speak your item details first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Send transcript to AI for processing
      const response = await fetch('/api/process-voice-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() })
      });

      const result = await response.json();

      if (result.success) {
        onTranscript(result);
        toast({
          title: "Voice Processing Complete!",
          description: "AI has extracted your listing details.",
        });
      } else {
        throw new Error(result.error || 'Failed to process voice input');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process your speech. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
        <CardContent className="p-6 text-center">
          <VolumeX className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Voice Input Not Supported</h3>
          <p className="text-gray-400 text-sm mb-4">
            Your browser doesn't support voice input. Please use the text fields instead.
          </p>
          <Button onClick={onClose} variant="outline" className="border-slate-500 text-gray-300">
            Continue with Text
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Voice Input</h3>
          <p className="text-gray-400 text-sm">
            Describe your item, price, and any other details. AI will extract the information.
          </p>
        </div>

        {/* Transcript Display */}
        <div className="mb-6">
          <label className="text-white text-sm font-medium mb-2 block">
            What you said:
          </label>
          <div className="bg-slate-600 border border-slate-500 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
            {transcript ? (
              <p className="text-gray-300 text-sm leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-gray-500 text-sm italic">
                {isListening ? "Listening... speak now" : "Tap the microphone to start speaking"}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-4">
          {!isListening ? (
            <Button
              onClick={startListening}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Speaking
            </Button>
          ) : (
            <Button
              onClick={stopListening}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </Button>
          )}

          {transcript && (
            <Button
              onClick={clearTranscript}
              variant="outline"
              className="border-slate-500 text-gray-300 hover:bg-slate-600"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Process Button */}
        {transcript && (
          <Button
            onClick={processTranscript}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white mb-4"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Process with AI
              </>
            )}
          </Button>
        )}

        {/* Instructions */}
        <div className="text-center">
          <p className="text-gray-400 text-xs">
            Try saying: "This is a vintage leather chair in excellent condition, I'm asking $150 but would take $120 minimum"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
