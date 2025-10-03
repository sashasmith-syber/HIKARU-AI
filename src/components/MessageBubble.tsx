import React from "react";
import { Message } from "../types";

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
  return (
    <div className={`chat-message ${message.role}`}>
      {message.title && <div className="message-title">{message.title}</div>}
      <div className="message-bubble">
        {message.image && <img src={message.image} alt="Attachment" className="message-image" />}
        {message.text && renderContent(message.text)}
        {message.text === '' && message.role === 'model' && (
          <div className="loading-indicator"></div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
