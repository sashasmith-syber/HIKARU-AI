import React, { useContext, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import PromptLibrary from "./PromptLibrary";

const InputBar: React.FC = () => {
  const { 
    isLoading, 
    sendMessage, 
    isAdvisorMode, 
    setIsAdvisorMode,
    isEfficiencyMode,
    setIsEfficiencyMode,
    isSecurityMode,
    setIsSecurityMode,
    isLiveSessionActive,
    toggleLiveSession
  } = useContext(AppContext);

  const [input, setInput] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isPromptLibraryVisible, setIsPromptLibraryVisible] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    setInput(promptText);
    setIsPromptLibraryVisible(false);
  };

  const handleSendClick = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    sendMessage(input, attachment, attachmentPreview);
    setInput("");
    setAttachment(null);
    setAttachmentPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const isUIActive = !isLoading && !isLiveSessionActive;

  return (
    <>
      <PromptLibrary 
        isOpen={isPromptLibraryVisible}
        onClose={() => setIsPromptLibraryVisible(false)}
        onSelectPrompt={handleSelectPrompt}
      />
      <footer className="chat-input-area">
        {attachmentPreview && (
          <div className="attachment-preview">
            <img src={attachmentPreview} alt="Preview" className="preview-image" />
            <button onClick={removeAttachment} className="remove-attachment-btn" aria-label="Remove attachment">
              &times;
            </button>
          </div>
        )}
        <div className="input-controls">
            <div className="mode-toggle-group">
              <div className="mode-toggle">
                  <span>Efficiency</span>
                  <label className="switch">
                  <input type="checkbox" checked={isEfficiencyMode} onChange={() => setIsEfficiencyMode(!isEfficiencyMode)} disabled={!isUIActive} />
                  <span className="slider"></span>
                  </label>
              </div>
              <div className="mode-toggle">
                  <span>Advisor</span>
                  <label className="switch">
                  <input type="checkbox" checked={isAdvisorMode} onChange={() => setIsAdvisorMode(!isAdvisorMode)} disabled={!isUIActive} />
                  <span className="slider"></span>
                  </label>
              </div>
              <div className="mode-toggle">
                  <span>Security</span>
                  <label className="switch">
                  <input type="checkbox" checked={isSecurityMode} onChange={() => setIsSecurityMode(!isSecurityMode)} disabled={!isUIActive} />
                  <span className="slider"></span>
                  </label>
              </div>
            </div>
        </div>
        <div className="input-row">
            <button onClick={() => setIsPromptLibraryVisible(true)} disabled={!isUIActive} aria-label="Open prompt library" className="icon-button prompt-library-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 20.5938V3.40625C12 3.40625 12.4219 2 15.5 2C18.5781 2 19 3.40625 19 3.40625V20.5938C19 20.5938 18.5781 22 15.5 22C12.4219 22 12 20.5938 12 20.5938Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20.5938V3.40625C12 3.40625 11.5781 2 8.5 2C5.42188 2 5 3.40625 5 3.40625V20.5938C5 20.5938 5.42188 22 8.5 22C11.5781 22 12 20.5938 12 20.5938Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
              id="file-input"
            />
            <button onClick={() => fileInputRef.current?.click()} disabled={!isUIActive} aria-label="Attach file" className="icon-button attachment-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 7.5V16.5C12.5 18.1569 11.1569 19.5 9.5 19.5C7.84315 19.5 6.5 18.1569 6.5 16.5V6.5C6.5 4.01472 8.51472 2 11 2C13.4853 2 15.5 4.01472 15.5 6.5V15.5C15.5 16.6046 14.6046 17.5 13.5 17.5C12.3954 17.5 11.5 16.6046 11.5 15.5V7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendClick()}
              placeholder={isLiveSessionActive ? "Live session active..." : "Articulate your query, OPERATOR..."}
              aria-label="Your message to Hikaru"
              disabled={!isUIActive}
            />
            <button onClick={toggleLiveSession} disabled={isLoading} aria-label={isLiveSessionActive ? "Stop voice session" : "Start voice session"} className={`icon-button mic-button ${isLiveSessionActive ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={handleSendClick} disabled={!isUIActive || (!input.trim() && !attachment)} aria-label="Send message" className="icon-button send-button">
              <svg className="send-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
        </div>
      </footer>
    </>
  );
};

export default InputBar;
