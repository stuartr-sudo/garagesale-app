/**
 * OpenAI Whisper API Integration
 * Transcribes audio files using OpenAI's Whisper model
 */

import OpenAI from 'openai';
import { Blob } from 'buffer'; // Node.js built-in (Node 18+)

const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

if (!openaiApiKey) {
  console.error('⚠️ MISSING OPENAI API KEY!');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

// Whisper limits
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper's limit)
const SUPPORTED_FORMATS = ['webm', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'ogg'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check API key
    if (!openaiApiKey) {
      console.error('MISSING OPENAI API KEY!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        success: false 
      });
    }

    const { audioBase64, audioData, audioFormat = 'webm' } = req.body;
    
    // Support both parameter names for backward compatibility
    const audioDataParam = audioBase64 || audioData;

    if (!audioDataParam) {
      return res.status(400).json({ 
        error: 'Audio data is required',
        success: false 
      });
    }

    // Validate audio format
    if (!SUPPORTED_FORMATS.includes(audioFormat.toLowerCase())) {
      return res.status(400).json({
        error: `Unsupported audio format: ${audioFormat}`,
        supported_formats: SUPPORTED_FORMATS,
        success: false
      });
    }

    console.log('Processing audio with Whisper...', {
      format: audioFormat,
      dataLength: audioDataParam.length
    });

    // ============================================
    // CONVERT BASE64 TO BUFFER
    // ============================================
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioDataParam, 'base64');
    } catch (decodeError) {
      return res.status(400).json({
        error: 'Invalid base64 audio data',
        success: false
      });
    }

    console.log('Audio buffer created:', {
      size: audioBuffer.length,
      sizeMB: (audioBuffer.length / 1024 / 1024).toFixed(2)
    });

    // ============================================
    // VALIDATE FILE SIZE
    // ============================================
    if (audioBuffer.length === 0) {
      return res.status(400).json({
        error: 'Audio data is empty',
        success: false
      });
    }

    if (audioBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'Audio file too large',
        max_size_mb: 25,
        your_size_mb: (audioBuffer.length / 1024 / 1024).toFixed(2),
        success: false
      });
    }

    // ============================================
    // CREATE FILE OBJECT FOR WHISPER (Node.js compatible)
    // ============================================
    // OpenAI SDK expects a File-like object with:
    // - name property
    // - type property
    // - arrayBuffer() or stream() method
    
    const audioBlob = new Blob([audioBuffer], { 
      type: `audio/${audioFormat}` 
    });

    // Create a File-like object that works in Node.js
    const audioFile = new File([audioBlob], `audio.${audioFormat}`, {
      type: `audio/${audioFormat}`
    });

    // ============================================
    // TRANSCRIBE WITH WHISPER
    // ============================================
    console.log('Sending to Whisper API...');
    
    const startTime = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can make this dynamic if needed
      response_format: 'text',
      temperature: 0.2 // Lower = more consistent, higher = more creative
    });

    const processingTime = Date.now() - startTime;

    console.log('Whisper transcription completed:', {
      time: `${processingTime}ms`,
      length: transcription.length,
      preview: transcription.substring(0, 100) + (transcription.length > 100 ? '...' : '')
    });

    // ============================================
    // VALIDATE TRANSCRIPTION
    // ============================================
    const cleanTranscript = transcription.trim();

    if (!cleanTranscript) {
      return res.status(422).json({
        error: 'Transcription resulted in empty text',
        suggestion: 'Audio may be too quiet, unclear, or in unsupported language',
        success: false
      });
    }

    // Check for suspiciously short transcriptions (might indicate poor audio)
    if (audioBuffer.length > 10000 && cleanTranscript.length < 5) {
      console.warn('⚠️ Suspiciously short transcription for audio size');
    }

    return res.status(200).json({
      success: true,
      transcript: cleanTranscript,
      model: 'whisper-1',
      language: 'en',
      processing_time_ms: processingTime,
      audio_size_bytes: audioBuffer.length
    });

  } catch (error) {
    console.error('Whisper transcription error:', error);

    // Provide helpful error messages based on error type
    let errorMessage = error.message || 'Failed to transcribe audio';
    let statusCode = 500;

    if (error.message?.includes('timeout')) {
      errorMessage = 'Transcription timeout - audio may be too long';
      statusCode = 408;
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded - please try again in a moment';
      statusCode = 429;
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Invalid audio format or corrupted file';
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}
