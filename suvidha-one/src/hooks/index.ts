// Kiosk Hooks
export { useOtpAuth, sendOtp, verifyOtp, getStoredAuthToken, clearStoredAuthToken } from "./useOtpAuth";
export { useKioskMode, useOfflineStorage } from "./useKioskMode";
export { useVoice, SUPPORTED_LANGUAGES } from "./useVoice";
export type { VoiceState, VoiceActions, VoiceResponse, UseVoiceOptions } from "./useVoice";
