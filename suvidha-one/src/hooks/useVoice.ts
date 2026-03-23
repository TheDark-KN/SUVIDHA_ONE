/**
 * useVoice - React hook for Bhashini voice interaction
 * 
 * Provides speech-to-text (ASR) and text-to-speech (TTS) using
 * India's official Bhashini AI APIs.
 * 
 * Supports 11 Indian languages: Hindi, Bengali, Telugu, Tamil, 
 * Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English
 */

import { useState, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VoiceState {
  /** Is currently recording */
  listening: boolean;
  /** Is processing (sending to server) */
  processing: boolean;
  /** Transcribed text from user's speech */
  transcript: string;
  /** Detected intent */
  intent: string;
  /** System's text reply */
  replyText: string;
  /** Audio URL for playback */
  audioUrl: string | null;
  /** Error message if any */
  error: string | null;
}

export interface VoiceActions {
  /** Start recording audio */
  startListening: () => Promise<void>;
  /** Stop recording and process */
  stopListening: () => void;
  /** Play the response audio */
  playResponse: () => void;
  /** Reset all state */
  reset: () => void;
  /** Send text directly for TTS */
  speak: (text: string) => Promise<void>;
}

export interface VoiceResponse {
  transcript: string;
  intent: string;
  reply_text: string;
  reply_audio: string;
  language: string;
}

export interface UseVoiceOptions {
  /** Language code (e.g., "hi", "ta", "en") */
  language?: string;
  /** API base URL */
  apiUrl?: string;
  /** Auto-play response audio */
  autoPlay?: boolean;
  /** Callback when voice is processed */
  onResult?: (result: VoiceResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'en', name: 'English', native: 'English' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useVoice(options: UseVoiceOptions = {}): VoiceState & VoiceActions {
  const {
    language = 'hi',
    apiUrl = process.env.NEXT_PUBLIC_VOICE_API_URL || '/api/voice',
    autoPlay = true,
    onResult,
    onError,
  } = options;

  // State
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [intent, setIntent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Audio conversion: WebM → WAV (Bhashini requires WAV 16kHz)
  // ─────────────────────────────────────────────────────────────────────────
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Get audio data
    const channelData = decoded.getChannelData(0);
    const samples = new Int16Array(channelData.length);
    
    // Convert float32 to int16
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Create WAV file
    const wavBuffer = encodeWav(samples, 16000);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  // Encode samples to WAV format
  const encodeWav = (samples: Int16Array, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // Write samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset + i * 2, samples[i], true);
    }
    
    return buffer;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Start recording
  // ─────────────────────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setIntent('');
      setReplyText('');
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const recorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setError('No audio recorded');
          return;
        }

        setProcessing(true);

        try {
          // Combine chunks and convert to WAV
          const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const wavBlob = await convertToWav(webmBlob);

          // Send to backend
          const formData = new FormData();
          formData.append('audio', wavBlob, 'audio.wav');
          formData.append('language', language);

          const response = await fetch(`${apiUrl}/input`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
          }

          const result = await response.json();
          const data: VoiceResponse = result.data || result;

          setTranscript(data.transcript);
          setIntent(data.intent);
          setReplyText(data.reply_text);

          // Create audio URL from base64
          if (data.reply_audio) {
            const audioBytes = atob(data.reply_audio);
            const audioArray = new Uint8Array(audioBytes.length);
            for (let i = 0; i < audioBytes.length; i++) {
              audioArray[i] = audioBytes.charCodeAt(i);
            }
            const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            // Auto-play if enabled
            if (autoPlay) {
              const audio = new Audio(url);
              audioRef.current = audio;
              await audio.play().catch(() => {
                console.warn('Auto-play blocked by browser');
              });
            }
          }

          onResult?.(data);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to process voice';
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
          setProcessing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setListening(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [language, apiUrl, autoPlay, onResult, onError]);

  // ─────────────────────────────────────────────────────────────────────────
  // Stop recording
  // ─────────────────────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && listening) {
      mediaRecorderRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  // ─────────────────────────────────────────────────────────────────────────
  // Play response audio
  // ─────────────────────────────────────────────────────────────────────────
  const playResponse = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch(console.error);
    }
  }, [audioUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // Send text for TTS
  // ─────────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`${apiUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, gender: 'female' }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const result = await response.json();
      const audioBase64 = result.data?.audio || result.audio;

      if (audioBase64) {
        const audioBytes = atob(audioBase64);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        if (autoPlay) {
          const audio = new Audio(url);
          audioRef.current = audio;
          await audio.play().catch(console.warn);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TTS failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setProcessing(false);
    }
  }, [language, apiUrl, autoPlay, onError]);

  // ─────────────────────────────────────────────────────────────────────────
  // Reset state
  // ─────────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setListening(false);
    setProcessing(false);
    setTranscript('');
    setIntent('');
    setReplyText('');
    setError(null);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    audioChunksRef.current = [];
  }, [audioUrl]);

  return {
    // State
    listening,
    processing,
    transcript,
    intent,
    replyText,
    audioUrl,
    error,
    // Actions
    startListening,
    stopListening,
    playResponse,
    reset,
    speak,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { SUPPORTED_LANGUAGES };
export default useVoice;
