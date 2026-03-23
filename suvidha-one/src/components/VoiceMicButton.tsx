"use client";

/**
 * VoiceMicButton - Voice input button for Bhashini voice assistance
 * 
 * Large touchscreen-friendly mic button that records audio, sends to
 * Bhashini ASR for transcription, and plays back TTS response.
 */

import { useEffect, useRef, useState } from "react";
import { useVoice, SUPPORTED_LANGUAGES } from "@/hooks/useVoice";
import { useAppStore } from "@/store";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";

interface VoiceMicButtonProps {
  /** Language code (e.g., "hi", "ta", "en") */
  language?: string;
  /** Button size in pixels */
  size?: number;
  /** Callback when intent is detected */
  onIntent?: (intent: string, transcript: string) => void;
  /** Show transcript text below button */
  showTranscript?: boolean;
  /** Custom class name */
  className?: string;
}

export function VoiceMicButton({
  language: propLanguage,
  size = 120,
  onIntent,
  showTranscript = true,
  className = "",
}: VoiceMicButtonProps) {
  const { fontScale, highContrast, language: storeLanguage } = useAppStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Use prop language or store language, map to Bhashini code
  const langCode = mapToLanguageCode(propLanguage || storeLanguage || "hindi");

  const {
    listening,
    processing,
    transcript,
    intent,
    replyText,
    audioUrl,
    error,
    startListening,
    stopListening,
    playResponse,
    reset,
  } = useVoice({
    language: langCode,
    autoPlay: true,
    onResult: (result) => {
      if (result.intent && result.intent !== "general") {
        onIntent?.(result.intent, result.transcript);
      }
    },
  });

  // Auto-play TTS response when available
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay
        console.warn("Autoplay blocked - user interaction required");
      });
    }
  }, [audioUrl]);

  // Get button state colors
  const getButtonStyle = () => {
    if (listening) {
      return highContrast
        ? "bg-red-600 border-red-400 animate-pulse"
        : "bg-red-500 border-red-400 animate-pulse shadow-lg shadow-red-500/50";
    }
    if (processing) {
      return highContrast
        ? "bg-yellow-600 border-yellow-400"
        : "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300";
    }
    return highContrast
      ? "bg-blue-800 border-blue-600 hover:bg-blue-700"
      : "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 hover:shadow-xl hover:scale-105";
  };

  // Get status text
  const getStatusText = () => {
    if (listening) {
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      return langInfo ? `सुन रहा हूँ... (${langInfo.native})` : "सुन रहा हूँ...";
    }
    if (processing) return "प्रोसेसिंग...";
    return langCode === "en" ? "Press and hold to speak" : "बोलने के लिए दबाएं";
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Main Mic Button */}
      <button
        onPointerDown={startListening}
        onPointerUp={stopListening}
        onPointerLeave={stopListening}
        disabled={processing}
        className={`
          rounded-full flex items-center justify-center
          text-white font-bold transition-all duration-200
          border-4 cursor-pointer select-none
          ${getButtonStyle()}
        `}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
        }}
        aria-label={listening ? "Recording - release to stop" : "Hold to record voice"}
      >
        {processing ? (
          <Loader2 size={size * 0.4} className="animate-spin" />
        ) : listening ? (
          <div className="relative">
            <Mic size={size * 0.4} />
            {/* Recording indicator waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full border-4 border-white/30 animate-ping" />
            </div>
          </div>
        ) : (
          <Mic size={size * 0.4} />
        )}
      </button>

      {/* Status Text */}
      <p
        className={`text-center font-medium ${
          highContrast ? "text-white" : "text-gray-600"
        }`}
        style={{ fontSize: 18 * fontScale }}
      >
        {getStatusText()}
      </p>

      {/* Error Message */}
      {error && (
        <div
          className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-center"
          style={{ fontSize: 16 * fontScale }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Transcript Display */}
      {showTranscript && transcript && (
        <div
          className={`max-w-md p-4 rounded-xl text-center ${
            highContrast ? "bg-gray-800 text-white" : "bg-blue-50 text-gray-800"
          }`}
          style={{ fontSize: 22 * fontScale }}
        >
          <p className="font-medium mb-2">आपने कहा:</p>
          <p className="text-lg">"{transcript}"</p>
        </div>
      )}

      {/* Reply Text Display */}
      {replyText && (
        <div
          className={`max-w-md p-4 rounded-xl text-center ${
            highContrast ? "bg-green-900 text-white" : "bg-green-50 text-green-800"
          }`}
          style={{ fontSize: 20 * fontScale }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Volume2 size={20} />
            <span className="font-medium">जवाब:</span>
          </div>
          <p>{replyText}</p>
        </div>
      )}

      {/* Replay Button */}
      {audioUrl && !listening && !processing && (
        <button
          onClick={playResponse}
          className={`flex items-center gap-2 px-6 py-3 rounded-full ${
            highContrast
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
          }`}
          style={{ fontSize: 18 * fontScale }}
        >
          <Volume2 size={20} />
          फिर से सुनें
        </button>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />
    </div>
  );
}

/**
 * Map UI language names to Bhashini language codes
 */
function mapToLanguageCode(lang: string): string {
  const langLower = lang.toLowerCase();
  
  const mapping: Record<string, string> = {
    // English names
    hindi: "hi",
    bengali: "bn",
    telugu: "te",
    tamil: "ta",
    marathi: "mr",
    gujarati: "gu",
    kannada: "kn",
    malayalam: "ml",
    punjabi: "pa",
    odia: "or",
    english: "en",
    // Already codes
    hi: "hi",
    bn: "bn",
    te: "te",
    ta: "ta",
    mr: "mr",
    gu: "gu",
    kn: "kn",
    ml: "ml",
    pa: "pa",
    or: "or",
    en: "en",
  };

  return mapping[langLower] || "hi"; // Default to Hindi
}

export default VoiceMicButton;
