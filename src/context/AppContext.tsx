
import React, { createContext, useState, useRef, useEffect } from "react";
import { Message, AnalysisMode, Artifact } from "../types";
import { 
    fileToGenerativePart,
    generateImage, 
    generateOneOffContentStream,
    startChat,
    generateJsonContent,
    checkBackendHealth,
    getBackendFeatures,
    BackendUnavailableError,
    BackendNotConfiguredError,
    AuthenticationRequiredError,
    RateLimitError,
    LIVE_SESSION_NOT_SUPPORTED,
    getStoredAuthToken,
    setStoredAuthToken,
    clearStoredAuthToken,
    decode, 
    decodeAudioData,
    createBlob,
    Type,
} from "../services/geminiServiceBFF";
import { HIKARU_PERSONA, ADVISOR_PERSONA, HIKARU_EFFICIENCY_PERSONA, HIKARU_LIVE_PERSONA, SECURITY_REVIEW_PERSONA, ANALYSIS_MODE_PROMPTS } from "../constants/personas";

type EthicalStatus = 'idle' | 'approved' | 'caution' | 'rejected';
type BackendStatus = 'checking' | 'available' | 'unavailable' | 'not_configured' | 'auth_required';

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
  isLiveSessionSupported: boolean;
  toggleLiveSession: () => void;
  ethicalStatus: EthicalStatus;
  interactionCount: number;
  intentDrift: number;
  ethicalThreshold: number;
  isOptimizationModalOpen: boolean;
  toggleOptimizationModal: () => void;
  handleMessageFeedback: (messageId: string, feedback: 'liked' | 'disliked') => void;
  requestMessageExplanation: (messageId: string) => void;
  satisfactionScore: number;
  analysisMode: AnalysisMode;
  setAnalysisMode: (mode: AnalysisMode) => void;
  requestScenarioSimulation: (messageId: string) => void;
  activeArtifact: Artifact | null;
  setActiveArtifact: (artifact: Artifact | null) => void;
  backendStatus: BackendStatus;
  backendError: string | null;
  retryBackendConnection: () => void;
  isAuthModalOpen: boolean;
  authError: string | null;
  submitAuthToken: (token: string) => void;
  closeAuthModal: () => void;
  isAuthenticated: boolean;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdvisorMode, setIsAdvisorMode] = useState<boolean>(false);
  const [isEfficiencyMode, setIsEfficiencyMode] = useState<boolean>(false);
  const [isSecurityMode, setIsSecurityMode] = useState<boolean>(false);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const chatSessionRef = useRef<ReturnType<typeof startChat> | null>(null);

  const [ethicalStatus, setEthicalStatus] = useState<EthicalStatus>('idle');
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [intentDrift, setIntentDrift] = useState<number>(0);
  const ethicalThreshold = 70;

  const [isLiveSessionActive, setIsLiveSessionActive] = useState<boolean>(false);
  const isLiveSessionSupported = !LIVE_SESSION_NOT_SUPPORTED;

  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState<boolean>(false);
  const [satisfactionScore, setSatisfactionScore] = useState<number>(95);
  
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredAuthToken());

  const checkBackend = async () => {
    setBackendStatus('checking');
    setBackendError(null);
    try {
      const health = await checkBackendHealth();
      if (!health.configured) {
        setBackendStatus('not_configured');
        setBackendError('The backend service is not configured with API credentials.');
        return;
      }
      
      // Check if auth is required and we have a token
      if (health.authRequired) {
        const token = getStoredAuthToken();
        if (!token) {
          setBackendStatus('auth_required');
          setBackendError('Authentication required for this private preview.');
          setIsAuthModalOpen(true);
          return;
        }
        // Validate token by fetching features
        try {
          await getBackendFeatures();
          setIsAuthenticated(true);
          setBackendStatus('available');
        } catch (err) {
          if (err instanceof AuthenticationRequiredError) {
            setBackendStatus('auth_required');
            setBackendError('Invalid or expired token. Please re-authenticate.');
            setIsAuthenticated(false);
            setIsAuthModalOpen(true);
          } else {
            throw err;
          }
        }
      } else {
        setBackendStatus('available');
      }
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendStatus('unavailable');
        setBackendError('Cannot connect to the backend service. Please try again later.');
      } else if (err instanceof AuthenticationRequiredError) {
        setBackendStatus('auth_required');
        setBackendError('Authentication required.');
        setIsAuthModalOpen(true);
      } else {
        setBackendStatus('unavailable');
        setBackendError('An unexpected error occurred while checking the backend.');
      }
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const retryBackendConnection = () => {
    checkBackend();
  };

  const submitAuthToken = async (token: string) => {
    setStoredAuthToken(token);
    setAuthError(null);
    try {
      await getBackendFeatures();
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setBackendStatus('available');
      setBackendError(null);
    } catch (err) {
      clearStoredAuthToken();
      setIsAuthenticated(false);
      if (err instanceof AuthenticationRequiredError) {
        setAuthError('Invalid token. Please check and try again.');
      } else {
        setAuthError('Failed to authenticate. Please try again.');
      }
    }
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

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

  const simulateStatusUpdate = () => {
    setInteractionCount(prev => prev + 1);
    const statuses: EthicalStatus[] = ['approved', 'caution', 'rejected'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    setEthicalStatus(randomStatus);
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

  const sendMessage = async (input: string, attachment: File | null, attachmentPreview: string | null) => {
    if (backendStatus !== 'available') {
      const errorMessage: Message = {
        id: generateUniqueId(),
        role: 'model',
        text: backendStatus === 'not_configured' 
          ? '⚠️ The backend service is not configured. Please contact the administrator to set up API credentials.'
          : '⚠️ Cannot connect to the backend service. Please try again later.',
      };
      setMessages(prev => [...prev, { id: generateUniqueId(), role: 'user', text: input, image: attachmentPreview || undefined }, errorMessage]);
      return;
    }

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

      const messageParts: any[] = [];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }
      if (finalPrompt.trim()) {
        messageParts.push({ text: finalPrompt });
      }

      if (messageParts.length === 0) return;

      const stream = chatSessionRef.current.sendMessageStream({ message: messageParts });

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          
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
      const stream = generateOneOffContentStream(text, attachmentFile, ADVISOR_PERSONA, model, config);
      for await (const chunk of stream) {
        if (chunk.text) {
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

      const messageParts: any[] = [{ text: hikaruPromptText }];
      if (attachmentFile) {
        messageParts.push(await fileToGenerativePart(attachmentFile));
      }

      const stream = chatSessionRef.current.sendMessageStream({ message: messageParts });

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

  const handleError = (error: any, messageId: string, customPrefix?: string) => {
    console.error(customPrefix || "Error in generation:", error);
    
    let errorMessage = `${customPrefix || "Error"}: Could not retrieve response from the model.`;
    
    if (error instanceof BackendNotConfiguredError) {
      errorMessage = "⚠️ Backend not configured. Please contact the administrator.";
      setBackendStatus('not_configured');
    } else if (error instanceof BackendUnavailableError) {
      errorMessage = "⚠️ Backend service unavailable. Please try again later.";
      setBackendStatus('unavailable');
    } else if (error instanceof AuthenticationRequiredError) {
      errorMessage = "⚠️ Authentication required. Please authenticate to continue.";
      setBackendStatus('auth_required');
      setIsAuthenticated(false);
      setIsAuthModalOpen(true);
    } else if (error instanceof RateLimitError) {
      errorMessage = `⚠️ Rate limit exceeded. Please wait ${error.retryAfter} seconds before trying again.`;
    }
    
    setMessages((prev) => prev.map(msg => msg.id === messageId ? {...msg, text: errorMessage, isThinking: false } : msg));
    setEthicalStatus('rejected');
  };

  const toggleLiveSession = () => {
    if (!isLiveSessionSupported) {
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'model',
        text: '⚠️ Live audio sessions are not available in this deployment. This feature requires direct API access which is disabled for security.',
      }]);
      return;
    }
    setIsLiveSessionActive(prev => !prev);
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
      const stream = generateOneOffContentStream(metaPrompt, null, HIKARU_PERSONA, model, config);
      for await (const chunk of stream) {
        if (chunk.text) {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, explanation: (msg.explanation || '') + chunk.text } 
              : msg
          ));
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
      const result = await generateJsonContent<{ scenarios: Array<{ title: string; probability: number; analysis: string }> }>(simulationPrompt, schema, model);
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
      isLiveSessionSupported,
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
      setActiveArtifact,
      backendStatus,
      backendError,
      retryBackendConnection,
      isAuthModalOpen,
      authError,
      submitAuthToken,
      closeAuthModal,
      isAuthenticated,
    }}>
      {children}
    </AppContext.Provider>
  );
};
