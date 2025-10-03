import React, { createContext, useState, useRef } from "react";
import { Message } from "../types";
import { 
    fileToGenerativePart,
    generateImage, 
    generateOneOffContentStream,
    startChat,
    connectLiveSession, 
    createBlob, 
    decode, 
    decodeAudioData 
} from "../services/geminiService";
import { HIKARU_PERSONA, ADVISOR_PERSONA, HIKARU_EFFICIENCY_PERSONA, HIKARU_LIVE_PERSONA, SECURITY_REVIEW_PERSONA } from "../constants/personas";
import { LiveSession } from "../services/geminiService";
import { Chat } from "@google/genai";

type EthicalStatus = 'idle' | 'approved' | 'caution' | 'rejected';

interface AppContextType {
  messages: Message[];
  isLoading: boolean;
  isAdvisorMode: boolean;
  setIsAdvisorMode: (isAdvisorMode: boolean) => void;
  isEfficiencyMode: boolean;
  setIsEfficiencyMode: (isEfficiencyMode: boolean) => void;
  isSecurityMode: boolean;
  setIsSecurityMode: (isSecurityMode: boolean) => void;
  sendMessage: (input: string, attachment: File | null, attachmentPreview: string | null) => Promise<void>;
  startNewChat: () => void;
  isLiveSessionActive: boolean;
  toggleLiveSession: () => void;
  // Status Bar State
  ethicalStatus: EthicalStatus;
  interactionCount: number;
  intentDrift: number; // 0-100
  ethicalThreshold: number; // 0-100
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdvisorMode, setIsAdvisorMode] = useState<boolean>(false);
  const [isEfficiencyMode, setIsEfficiencyMode] = useState<boolean>(false);
  const [isSecurityMode, setIsSecurityMode] = useState<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Status Bar State
  const [ethicalStatus, setEthicalStatus] = useState<EthicalStatus>('idle');
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [intentDrift, setIntentDrift] = useState<number>(0);
  const ethicalThreshold = 70; // Constant for now

  // Live Session State
  const [isLiveSessionActive, setIsLiveSessionActive] = useState<boolean>(false);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Transcription Refs
  const currentInputTranscriptionId = useRef<string | null>(null);
  const currentOutputTranscriptionId = useRef<string | null>(null);
  
  const startNewChat = () => {
    setMessages([]);
    chatSessionRef.current = null;
    setInteractionCount(0);
    setIntentDrift(0);
    setEthicalStatus('idle');
  };
  
  const handleSetIsAdvisorMode = (value: boolean) => {
    setIsAdvisorMode(value);
    if (value) {
        setIsEfficiencyMode(false);
        setIsSecurityMode(false);
    }
    startNewChat();
  };

  const handleSetIsEfficiencyMode = (value: boolean) => {
      setIsEfficiencyMode(value);
      if (value) {
          setIsAdvisorMode(false);
          setIsSecurityMode(false);
      }
      startNewChat();
  };

  const handleSetIsSecurityMode = (value: boolean) => {
      setIsSecurityMode(value);
      if (value) {
          setIsAdvisorMode(false);
          setIsEfficiencyMode(false);
      }
      startNewChat();
  };
  
  const generateUniqueId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const isImageGenerationRequest = (prompt: string): boolean => {
    const lowerCasePrompt = prompt.toLowerCase().trim();
    const keywords = ['generate image', 'create an image', 'draw a picture of', 'imagine:', 'visualize'];
    return keywords.some(keyword => lowerCasePrompt.startsWith(keyword));
  };

  const handleImageGeneration = async (prompt: string, messageId: string) => {
    try {
      const imageDataUrl = await generateImage(prompt);
      setMessages(prev => prev.map(msg => 
          msg.id === messageId 
          ? { ...msg, text: `Image generated based on your request.`, image: imageDataUrl } 
          : msg
      ));
    } catch (error) {
      handleError(error, messageId, "Image generation failed.");
    }
  };

  // Simulate status updates for demonstration
  const simulateStatusUpdate = () => {
    setInteractionCount(prev => prev + 1);
    // Simulate ethical status
    const statuses: EthicalStatus[] = ['approved', 'caution', 'rejected'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    setEthicalStatus(randomStatus);
    // Simulate intent drift
    setIntentDrift(prev => Math.min(100, prev + Math.floor(Math.random() * 15)));
  };


  const sendMessage = async (input: string, attachment: File | null, attachmentPreview: string | null) => {
    const userMessage: Message = { id: generateUniqueId(), role: "user", text: input, image: attachmentPreview || undefined };
    
    if (isImageGenerationRequest(input) && !attachment) {
      setIsLoading(true);
      const modelMessageId = generateUniqueId();
      const modelMessage: Message = { id: modelMessageId, role: "model", text: "" };
      setMessages((prev) => [...prev, userMessage, modelMessage]);
      await handleImageGeneration(input, modelMessageId);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    simulateStatusUpdate();

    if (isAdvisorMode) {
      const advisorMessage: Message = { id: generateUniqueId(), role: "model", text: "", title: "Advisor Analysis" };
      const finalMessage: Message = { id: generateUniqueId(), role: "model", text: "", title: "Hikaru's Final Response" };
      setMessages((prev) => [...prev, userMessage, advisorMessage, finalMessage]);
      await handleAdvisorModeSend(input, attachment, HIKARU_PERSONA, advisorMessage.id, finalMessage.id);
    } else {
      let persona = HIKARU_PERSONA;
      if (isEfficiencyMode) persona = HIKARU_EFFICIENCY_PERSONA;
      if (isSecurityMode) persona = SECURITY_REVIEW_PERSONA;

      const modelMessage: Message = { id: generateUniqueId(), role: "model", text: "" };
      setMessages((prev) => [...prev, userMessage, modelMessage]);
      await handleStandardSend(input, attachment, persona, modelMessage.id);
    }

    setIsLoading(false);
  };

  const handleStandardSend = async (text: string, attachmentFile: File | null, hikaruPersona: string, messageId: string) => {
    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = startChat(hikaruPersona);
      }
      
      const messageParts: any[] = [];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }
      if (text.trim()) {
        messageParts.push({ text });
      }

      if (messageParts.length === 0) return;

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageParts });

      for await (const chunk of stream) {
        if (chunk.text) {
            setMessages((prev) => prev.map(msg => msg.id === messageId ? {...msg, text: msg.text + chunk.text} : msg));
        }
      }
    } catch (error) {
      handleError(error, messageId);
    }
  };
  
  const handleAdvisorModeSend = async (text: string, attachmentFile: File | null, hikaruPersona: string, advisorMessageId: string, finalMessageId: string) => {
    let advisorResponse = "";
    try {
      const stream = await generateOneOffContentStream(text, attachmentFile, ADVISOR_PERSONA);
      if (stream) {
        for await (const chunk of stream) {
            advisorResponse += chunk.text;
            setMessages((prev) => prev.map(msg => msg.id === advisorMessageId ? {...msg, text: advisorResponse} : msg));
        }
      }
    } catch (error) {
      handleError(error, advisorMessageId, "Advisor analysis failed.");
      setIsLoading(false);
      return; 
    }

    try {
       if (!chatSessionRef.current) {
        chatSessionRef.current = startChat(hikaruPersona);
      }

      const hikaruPromptText = `
**INTERNAL ADVISOR'S ANALYSIS:**
---
${advisorResponse}
---
**OPERATOR'S REQUEST:**
"${text}"
Formulate your final, structured response based on the analysis.
`;

      const messageParts: any[] = [{ text: hikaruPromptText }];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageParts });

      for await (const chunk of stream) {
         if (chunk.text) {
            setMessages((prev) => prev.map(msg => msg.id === finalMessageId ? {...msg, text: msg.text + chunk.text} : msg));
        }
      }
    } catch (error) {
        handleError(error, finalMessageId, "Final response generation failed.");
    }
  };

  const handleError = (error: any, messageId: string, customPrefix?: string) => {
    console.error(customPrefix || "Error in generation:", error);
    const errorMessage = `${customPrefix || "Error"}: Could not retrieve response from the model. Check console for details.`;
    setMessages((prev) => prev.map(msg => msg.id === messageId ? {...msg, text: errorMessage } : msg));
    setEthicalStatus('rejected');
  };
  
  const stopLiveSession = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
    if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
    audioSources.current.forEach(source => source.stop());
    audioSources.current.clear();
    setIsLiveSessionActive(false);
  };

  const startLiveSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsLiveSessionActive(true);
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTime.current = 0;

      const sessionPromise = connectLiveSession({
        systemInstruction: HIKARU_LIVE_PERSONA,
        onMessage: async (message) => {
          const { serverContent } = message;
          if (serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64AudioData = serverContent.modelTurn.parts[0].inlineData.data;
              const outputAudioContext = outputAudioContextRef.current;
              if (outputAudioContext) {
                const audioData = decode(base64AudioData);
                const decodedBuffer = await decodeAudioData(audioData, outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = decodedBuffer;
                source.connect(outputAudioContext.destination);
                const currentTime = outputAudioContext.currentTime;
                const startTime = Math.max(currentTime, nextStartTime.current);
                source.start(startTime);
                nextStartTime.current = startTime + decodedBuffer.duration;
                audioSources.current.add(source);
                source.onended = () => audioSources.current.delete(source);
              }
          }
           if (serverContent?.interrupted) {
                audioSources.current.forEach(source => source.stop());
                audioSources.current.clear();
                nextStartTime.current = 0;
           }

          if (serverContent?.inputTranscription) {
              const text = serverContent.inputTranscription.text;
              if (!currentInputTranscriptionId.current) {
                  const newId = generateUniqueId();
                  currentInputTranscriptionId.current = newId;
                  setMessages(prev => [...prev, {id: newId, role: 'user', text}]);
              } else {
                  setMessages(prev => prev.map(msg => msg.id === currentInputTranscriptionId.current ? { ...msg, text } : msg));
              }
          }

          if (serverContent?.outputTranscription) {
              const text = serverContent.outputTranscription.text;
              if (!currentOutputTranscriptionId.current) {
                  const newId = generateUniqueId();
                  currentOutputTranscriptionId.current = newId;
                  setMessages(prev => [...prev, {id: newId, role: 'model', text}]);
              } else {
                  setMessages(prev => prev.map(msg => msg.id === currentOutputTranscriptionId.current ? { ...msg, text } : msg));
              }
          }

          if (serverContent?.turnComplete) {
              currentInputTranscriptionId.current = null;
              currentOutputTranscriptionId.current = null;
          }
        },
        onError: (err) => { console.error("Live session error:", err); stopLiveSession(); },
        onClose: () => { console.log("Live session closed."); stopLiveSession(); },
      });

      sessionPromise.then(session => {
        liveSessionRef.current = session;
        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;
        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContextRef.current!.destination);
      });
    } catch (error) {
      console.error("Failed to start live session:", error);
      setIsLiveSessionActive(false);
    }
  };

  const toggleLiveSession = () => {
    if (isLiveSessionActive) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  return (
    <AppContext.Provider value={{ 
        messages, 
        isLoading, 
        sendMessage, 
        isAdvisorMode, 
        setIsAdvisorMode: handleSetIsAdvisorMode, 
        isEfficiencyMode,
        setIsEfficiencyMode: handleSetIsEfficiencyMode,
        isSecurityMode,
        setIsSecurityMode: handleSetIsSecurityMode,
        startNewChat,
        isLiveSessionActive,
        toggleLiveSession,
        ethicalStatus,
        interactionCount,
        intentDrift,
        ethicalThreshold
    }}>
      {children}
    </AppContext.Provider>
  );
};
