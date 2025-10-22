/**
 * OpenAI Whisper API Integration
 * Transcribes audio files using OpenAI's Whisper model
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('MISSING OPENAI API KEY!');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioData, audioFormat = 'webm' } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    console.log('Processing audio with Whisper...');

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Create a temporary file-like object for Whisper
    const audioFile = new File([audioBuffer], `audio.${audioFormat}`, {
      type: `audio/${audioFormat}`
    });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });

    console.log('Whisper transcription completed:', transcription.substring(0, 100) + '...');

    return res.status(200).json({
      success: true,
      transcript: transcription.trim(),
      model: 'whisper-1'
    });

  } catch (error) {
    console.error('Whisper transcription error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to transcribe audio',
      details: error.toString()
    });
  }
}
