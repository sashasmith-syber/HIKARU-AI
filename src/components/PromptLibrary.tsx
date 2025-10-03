import React, { useState } from 'react';
import { PROMPT_LIBRARY } from '../constants/prompts';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  if (!isOpen) {
    return null;
  }

  const handlePromptClick = (text: string) => {
    onSelectPrompt(text);
    onClose();
  };

  const handleCopyClick = (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const filteredLibrary = PROMPT_LIBRARY.map(category => ({
    ...category,
    prompts: category.prompts.filter(
      prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.text.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.prompts.length > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Prompt Library</h2>
          <button onClick={onClose} className="close-button" aria-label="Close prompt library">&times;</button>
        </div>
        <div className="modal-search-bar">
          <input
            type="text"
            placeholder="Search prompts by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="prompt-search-input"
            aria-label="Search prompts"
          />
        </div>
        <div className="modal-body">
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map((category, catIndex) => (
              <div key={catIndex} className="prompt-category">
                <h3>{category.category}</h3>
                <div className="prompt-list">
                  {category.prompts.map((prompt, pIndex) => {
                    const uniqueKey = `${catIndex}-${pIndex}`;
                    const isCopied = copiedKey === uniqueKey;
                    return (
                      <div key={pIndex} className="prompt-item" onClick={() => handlePromptClick(prompt.text)}>
                        <div className="prompt-content">
                          <h4>{prompt.title}</h4>
                          <p>{prompt.text.substring(0, 100)}...</p>
                        </div>
                        <div className="prompt-actions">
                          <button
                            className={`copy-button ${isCopied ? 'copied' : ''}`}
                            onClick={(e) => handleCopyClick(e, prompt.text, uniqueKey)}
                          >
                            {isCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p style={{textAlign: 'center', color: 'var(--secondary-text-color)'}}>No prompts found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptLibrary;
