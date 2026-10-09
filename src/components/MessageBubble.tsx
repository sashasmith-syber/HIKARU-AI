
import React, { useContext } from "react";
import { Message, Scenario } from "../types";
import { AppContext } from "../context/AppContext";

interface MessageBubbleProps {
  message: Message;
}

const Proverb: React.FC<{ content: string }> = ({ content }) => {
    const [title, ...descriptionParts] = content.split(':');
    const description = descriptionParts.join(':').trim();
    return (
        <div className="proverb-container">
            <p><span className="proverb-title">{title}:</span> {description}</p>
        </div>
    );
};

const Flowchart: React.FC<{ content: string }> = ({ content }) => {
    const steps = content.split('->');
    return (
        <div className="flowchart-container">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flowchart-step">{step}</div>
                    {index < steps.length - 1 && <div className="flowchart-arrow">→</div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const ScenarioSimulationDisplay: React.FC<{ scenarios: Scenario[] }> = ({ scenarios }) => {
    const getScenarioClass = (title: string) => {
        if (title.toLowerCase().includes('best')) return 'best-case';
        if (title.toLowerCase().includes('worst')) return 'worst-case';
        return 'most-likely';
    };

    return (
        <div className="simulation-container">
            <div className="simulation-title">[HIKARU - SCENARIO SIMULATION]</div>
            <div className="scenarios-wrapper">
                {scenarios.map((scenario, index) => (
                    <div key={index} className={`scenario-card ${getScenarioClass(scenario.title)}`}>
                        <div className="scenario-header">
                            <h4>{scenario.title}</h4>
                            <span className="scenario-probability">{scenario.probability}%</span>
                        </div>
                        <div className="probability-bar">
                            <div className="probability-bar-fill" style={{ width: `${scenario.probability}%` }}></div>
                        </div>
                        <p className="scenario-analysis">{scenario.analysis}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


const renderContent = (text: string) => {
    const parts = text.split(/(\[PROVERB:.+?\]|\[FLOWCHART:.+?\])/g).filter(Boolean);

    return parts.map((part, index) => {
        const proverbMatch = part.match(/\[PROVERB:(.+)\]/);
        if (proverbMatch) {
            return <Proverb key={index} content={proverbMatch[1]} />;
        }
        
        const flowchartMatch = part.match(/\[FLOWCHART:(.+)\]/);
        if (flowchartMatch) {
            return <Flowchart key={index} content={flowchartMatch[1]} />;
        }

        return <pre key={index}>{part}</pre>;
    });
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { handleMessageFeedback, requestMessageExplanation, requestScenarioSimulation } = useContext(AppContext);

  return (
    <div className={`chat-message ${message.role}`}>
      {message.title && <div className="message-title">{message.title}</div>}
      <div className="message-bubble">
        {message.image && <img src={message.image} alt="Attachment" className="message-image" />}
        {message.text && renderContent(message.text)}
        {message.text === '' && message.role === 'model' && (
          <div className={`loading-indicator ${message.isThinking ? 'thinking' : ''}`}></div>
        )}
        {message.role === 'model' && message.text && (
            <div className="message-actions">
                 <button
                    className={`feedback-btn ${message.feedback === 'liked' ? 'active' : ''}`}
                    onClick={() => handleMessageFeedback(message.id, 'liked')}
                    aria-label="Like response"
                    title="Like response"
                    disabled={!!message.feedback}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                </button>
                <button
                    className={`feedback-btn disliked ${message.feedback === 'disliked' ? 'active' : ''}`}
                    onClick={() => handleMessageFeedback(message.id, 'disliked')}
                    aria-label="Dislike response"
                    title="Dislike response"
                    disabled={!!message.feedback}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                </button>
                {!message.explanation && !message.isExplanationLoading && (
                    <button
                        className="explain-btn"
                        onClick={() => requestMessageExplanation(message.id)}
                        aria-label="Request explanation"
                        title="Request meta-analysis of this response"
                    >
                        Explain
                    </button>
                )}
                 {!message.scenarios && !message.isSimulating && (
                    <button 
                        className="simulate-btn"
                        onClick={() => requestScenarioSimulation(message.id)}
                        aria-label="Simulate scenarios"
                        title="Run hyper-scenario simulation"
                    >
                        Simulate
                    </button>
                 )}
            </div>
        )}
      </div>
       {message.isExplanationLoading && (
        <div className="explanation-bubble loading">
            <div className="message-title">[HIKARU - META-ANALYSIS]</div>
            <div className="loading-indicator"></div>
        </div>
      )}
      {message.explanation && !message.isExplanationLoading && (
        <div className="explanation-bubble">
            <div className="message-title">[HIKARU - META-ANALYSIS]</div>
            <pre>{message.explanation}</pre>
        </div>
      )}
      {message.isSimulating && (
          <div className="explanation-bubble loading">
            <div className="message-title">[HIKARU - SIMULATING SCENARIOS...]</div>
            <div className="loading-indicator"></div>
        </div>
      )}
      {message.scenarios && <ScenarioSimulationDisplay scenarios={message.scenarios} />}
    </div>
  );
};

export default MessageBubble;
