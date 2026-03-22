
import React, { createContext, useState, useRef } from "react";
import { Message, AnalysisMode, Artifact } from "../types";
import { 
    fileToGenerativePart,
    generateImage, 
    generateOneOffContentStream,
    startChat,
    connectLiveSession, 
    createBlob, 
    decode, 
    decodeAudioData,
    generateJsonContent,
    LiveSession
} from "../services/geminiService";
import { HIKARU_PERSONA, ADVISOR_PERSONA, HIKARU_EFFICIENCY_PERSONA, HIKARU_LIVE_PERSONA, SECURITY_REVIEW_PERSONA, ANALYSIS_MODE_PROMPTS } from "../constants/personas";
import { Chat, Type, Part } from "@google/genai";

type EthicalStatus = 'idle' | 'approved' | 'caution' | 'rejected';

// Define proper window type extensions
interface AIStudioWindow extends Window {
  aistudio?: {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  };
  webkitAudioContext?: typeof AudioContext;
}

interface AppContextType {
  messages: Message[];
  isLoading: boolean;
  isAdvisorMode: boolean;
  setIsAdvisorMode: (isAdvisorMode: boolean) => void;
  isEfficiencyMode: boolean;
  setIsEfficiencyMode: (isEfficiencyMode: boolean) => void;
  isSecurityMode: boolean;
  setIsSecurityMode: (isSecurityMode: boolean) => void;
  isThinkingMode: boolean;
  setIsThinkingMode: (isThinkingMode: boolean) => void;
  sendMessage: (input: string, attachment: File | null, attachmentPreview: string | null) => Promise<void>;
  startNewChat: () => void;
  isLiveSessionActive: boolean;
  toggleLiveSession: () => void;
  // Status Bar State
  ethicalStatus: EthicalStatus;
  interactionCount: number;
  intentDrift: number; // 0-100
  ethicalThreshold: number; // 0-100
  // Self-Optimization Features
  isOptimizationModalOpen: boolean;
  toggleOptimizationModal: () => void;
  handleMessageFeedback: (messageId: string, feedback: 'liked' | 'disliked') => void;
  requestMessageExplanation: (messageId: string) => void;
  satisfactionScore: number;
  // Hyperdimensional Features
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  requestScenarioSimulation: (messageId: string) => void;
  // Artifacts
  activeArtifact: Artifact | null;
  setActiveArtifact: (artifact: Artifact | null) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdvisorMode, setIsAdvisorMode] = useState<boolean>(false);
  const [isEfficiencyMode, setIsEfficiencyMode] = useState<boolean>(false);
  const [isSecurityMode, setIsSecurityMode] = useState<boolean>(false);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
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

  // Optimization State
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState<boolean>(false);
  const [satisfactionScore, setSatisfactionScore] = useState<number>(95);
  
  // Hyperdimensional State
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');

  // Artifact State
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const startNewChat = () => {
    setMessages([]);
    chatSessionRef.current = null;
    setInteractionCount(0);
    setIntentDrift(0);
    setEthicalStatus('idle');
    setActiveArtifact(null);
  };
  
  const handleSetIsAdvisorMode = (value: boolean) => {
    setIsAdvisorMode(value);
    if (value) {
        setIsEfficiencyMode(false);
        setIsSecurityMode(false);
        setIsThinkingMode(false);
    }
    startNewChat();
  };

  const handleSetIsEfficiencyMode = (value: boolean) => {
      setIsEfficiencyMode(value);
      if (value) {
          setIsAdvisorMode(false);
          setIsSecurityMode(false);
          setIsThinkingMode(false);
      }
      startNewChat();
  };

  const handleSetIsSecurityMode = (value: boolean) => {
      setIsSecurityMode(value);
      if (value) {
          setIsAdvisorMode(false);
          setIsEfficiencyMode(false);
          setIsThinkingMode(false);
      }
      startNewChat();
  };

  const handleSetIsThinkingMode = (value: boolean) => {
      setIsThinkingMode(value);
      if (value) {
          setIsAdvisorMode(false);
          setIsEfficiencyMode(false);
          setIsSecurityMode(false);
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

  const getModelConfig = () => {
    if (isThinkingMode) {
      return { 
        model: 'gemini-3-pro-preview', 
        config: { thinkingConfig: { thinkingBudget: 32768 } } 
      };
    }
    if (isEfficiencyMode) {
      return { model: 'gemini-2.5-flash-lite-latest', config: {} };
    }
    return { model: 'gemini-3-flash-preview', config: {} };
  };

  const checkApiKeyRequirement = async () => {
    if (isThinkingMode) {
        const aiStudioWindow = window as AIStudioWindow;
        if (aiStudioWindow.aistudio && !(await aiStudioWindow.aistudio.hasSelectedApiKey())) {
            await aiStudioWindow.aistudio.openSelectKey();
            return true; // Assume success and proceed
        }
    }
    return true;
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

    await checkApiKeyRequirement();
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

      const modelMessage: Message = { id: generateUniqueId(), role: "model", text: "", isThinking: isThinkingMode };
      setMessages((prev) => [...prev, userMessage, modelMessage]);
      await handleStandardSend(input, attachment, persona, modelMessage.id);
    }

    setIsLoading(false);
  };

  const handleStandardSend = async (text: string, attachmentFile: File | null, hikaruPersona: string, messageId: string) => {
    try {
      const { model, config } = getModelConfig();
      if (!chatSessionRef.current) {
        chatSessionRef.current = startChat(hikaruPersona, model, config);
      }
      
      let finalPrompt = text;
      if (analysisMode !== 'standard' && ANALYSIS_MODE_PROMPTS[analysisMode]) {
          finalPrompt = `${ANALYSIS_MODE_PROMPTS[analysisMode]}\n\n--- OPERATOR REQUEST ---\n${text}`;
      }

      const messageParts: Part[] = [];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }
      if (finalPrompt.trim()) {
        messageParts.push({ text: finalPrompt });
      }

      if (messageParts.length === 0) return;

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageParts });

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) {
            fullText += chunk.text;
            
            // Parse artifacts on the fly
            const artifacts = parseArtifacts(fullText);
            if (artifacts.length > 0) {
                setActiveArtifact(artifacts[artifacts.length - 1]);
            }

            setMessages((prev) => prev.map(msg => msg.id === messageId ? {...msg, text: fullText, isThinking: false, artifacts} : msg));
        }
      }
    } catch (error) {
      handleError(error, messageId);
    }
  };
  
  const handleAdvisorModeSend = async (text: string, attachmentFile: File | null, hikaruPersona: string, advisorMessageId: string, finalMessageId: string) => {
    let advisorResponse = "";
    const { model, config } = getModelConfig();
    try {
      const stream = await generateOneOffContentStream(text, attachmentFile, ADVISOR_PERSONA, model, config);
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
        chatSessionRef.current = startChat(hikaruPersona, model, config);
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

      const messageParts: Part[] = [{ text: hikaruPromptText }];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageParts });

      let fullText = "";
      for await (const chunk of stream) {
         if (chunk.text) {
            fullText += chunk.text;
            
            const artifacts = parseArtifacts(fullText);
            if (artifacts.length > 0) {
                setActiveArtifact(artifacts[artifacts.length - 1]);
            }

            setMessages((prev) => prev.map(msg => msg.id === finalMessageId ? {...msg, text: fullText, artifacts} : msg));
        }
      }
    } catch (error) {
        handleError(error, finalMessageId, "Final response generation failed.");
    }
  };

  const handleError = (error: unknown, messageId: string, customPrefix?: string) => {
    console.error(customPrefix || "Error in generation:", error);
    const errorMessage = `${customPrefix || "Error"}: Could not retrieve response from the model. Check console for details.`;
    setMessages((prev) => prev.map(msg => msg.id === messageId ? {...msg, text: errorMessage, isThinking: false } : msg));
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
      const aiStudioWindow = window as AIStudioWindow;
      const AudioContextConstructor = AudioContext || aiStudioWindow.webkitAudioContext;
      inputAudioContextRef.current = new AudioContextConstructor({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextConstructor({ sampleRate: 24000 });
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
        const inputContext = inputAudioContextRef.current;
        if (!inputContext) {
          console.error("Input audio context not initialized");
          return;
        }
        const source = inputContext.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;
        const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputContext.destination);
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

  const toggleOptimizationModal = () => setIsOptimizationModalOpen(prev => !prev);
  
  const handleMessageFeedback = (messageId: string, feedback: 'liked' | 'disliked') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    if (feedback === 'liked') {
        setSatisfactionScore(prev => Math.min(100, prev + 2));
    } else {
        setSatisfactionScore(prev => Math.max(0, prev - 5));
    }
  };

  const requestMessageExplanation = async (messageId: string) => {
    const messageToExplain = messages.find(msg => msg.id === messageId);
    if (!messageToExplain) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isExplanationLoading: true, explanation: '' } : msg
    ));

    const metaPrompt = `You are Hikaru. Your previous response was: "${messageToExplain.text}". The OPERATOR has requested a meta-analysis. Provide a concise explanation of your reasoning, the key data points you utilized, and the methodology behind your response. Structure this as a debriefing for the OPERATOR.`;
    
    try {
      const { model, config } = getModelConfig();
      const stream = await generateOneOffContentStream(metaPrompt, null, HIKARU_PERSONA, model, config);
      if (stream) {
        for await (const chunk of stream) {
            if (chunk.text) {
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                    ? { ...msg, explanation: (msg.explanation || '') + chunk.text } 
                    : msg
                ));
            }
        }
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
        ? { ...msg, explanation: "Error: Could not retrieve meta-analysis." } 
        : msg
      ));
    } finally {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isExplanationLoading: false } : msg
        ));
    }
  };

  const requestScenarioSimulation = async (messageId: string) => {
    const messageToSimulate = messages.find(msg => msg.id === messageId);
    if (!messageToSimulate) return;

    setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isSimulating: true } : msg
    ));

    const simulationPrompt = `Based on your previous response: "${messageToSimulate.text}". Generate three distinct scenarios: a best-case outcome, a worst-case outcome, and a most-likely outcome. For each, provide a title, a probability score as a number between 0 and 100, and a concise analysis.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
          scenarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                analysis: { type: Type.STRING }
              },
              required: ['title', 'probability', 'analysis']
            }
          }
        },
        required: ['scenarios']
    };

    try {
        const { model } = getModelConfig();
        const result = await generateJsonContent(simulationPrompt, schema, model);
        if (result && result.scenarios) {
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, scenarios: result.scenarios } : msg
            ));
        } else {
            throw new Error("Invalid or empty response from scenario simulation.");
        }
    } catch (error) {
        console.error("Error fetching scenarios:", error);
         setMessages(prev => prev.map(msg => 
            msg.id === messageId 
            ? { ...msg, text: `${msg.text}\n\n[HIKARU - SIMULATION FAILED: Could not generate scenarios.]` } 
            : msg
        ));
    } finally {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isSimulating: false } : msg
        ));
    }
  };

  const parseArtifacts = (text: string): Artifact[] => {
      const artifacts: Artifact[] = [];
      const artifactRegex = /<artifact\s+id="([^"]+)"\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/artifact>/g;
      
      let match;
      while ((match = artifactRegex.exec(text)) !== null) {
          let content = match[4].trim();
          let language = undefined;
          
          if (match[2] === 'code') {
              const codeMatch = content.match(/^```(\w+)?\n([\s\S]*?)```$/);
              if (codeMatch) {
                  language = codeMatch[1];
                  content = codeMatch[2].trim();
              }
          }
          
          artifacts.push({
              id: match[1],
              type: match[2] as 'code' | 'text/markdown',
              title: match[3],
              content,
              language
          });
      }
      return artifacts;
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
        isThinkingMode,
        setIsThinkingMode: handleSetIsThinkingMode,
        startNewChat,
        isLiveSessionActive,
        toggleLiveSession,
        ethicalStatus,
        interactionCount,
        intentDrift,
        ethicalThreshold,
        isOptimizationModalOpen,
        toggleOptimizationModal,
        handleMessageFeedback,
        requestMessageExplanation,
        satisfactionScore,
        analysisMode,
        setAnalysisMode,
        requestScenarioSimulation,
        activeArtifact,
        setActiveArtifact
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use AppContext with proper type checking
export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
