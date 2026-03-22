import React, { useContext, useState } from 'react';
import { Artifact } from '../types';
import { AppContext } from '../context/AppContext';

interface ArtifactViewerProps {
  artifact: Artifact;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact }) => {
  const { setActiveArtifact, sendMessage } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const handleAnalyze = () => {
    const prompt = `Please analyze the following ${artifact.type === 'code' ? 'code' : 'document'} and provide a brief, insightful review with suggestions for improvement:\n\nTitle: ${artifact.title}\n\n\`\`\`\n${artifact.content}\n\`\`\``;
    sendMessage(prompt, null, null);
  };

  return (
    <div className="artifact-viewer">
      <div className="artifact-header">
        <div className="artifact-title">{artifact.title}</div>
        <div className="artifact-tabs">
          <button 
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          {artifact.type === 'code' && (
            <button 
              className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
          )}
        </div>
        <div className="artifact-actions">
          <button className="analyze-btn" onClick={handleAnalyze} title="Analyze with Gemini Pro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Analyze
          </button>
          <button className="close-btn" onClick={() => setActiveArtifact(null)}>&times;</button>
        </div>
      </div>
      <div className="artifact-body">
        {activeTab === 'code' || artifact.type === 'text/markdown' ? (
          <pre className="artifact-code">
            <code>{artifact.content}</code>
          </pre>
        ) : (
          <div className="artifact-preview">
            <iframe 
              srcDoc={artifact.content} 
              title="Artifact Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactViewer;
