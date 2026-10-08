import { Modality } from "@google/genai/web";
import { HIKARU_LIVE_PERSONA } from "./personas";

export const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

export const LIVE_TOKEN_USES = 1;
export const LIVE_TOKEN_TTL_MS = 30 * 60 * 1000;
export const LIVE_NEW_SESSION_TTL_MS = 60 * 1000;

export const liveConnectConfig = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
  },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  systemInstruction: HIKARU_LIVE_PERSONA,
  sessionResumption: {},
};
