import React, { useContext, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import MessageBubble from "./MessageBubble";

const WelcomeScreen: React.FC = () => (
    <div className="welcome-screen">
      <header className="chat-header">
        <h1>Hikaru AI</h1>
      </header>
      <div className="persona-card">
        <h1>光</h1>
        <p>
          System online. Articulate your request, OPERATOR.
        </p>
      </div>
    </div>
);

const ChatWindow: React.FC = () => {
  const { messages, isLoading, startNewChat } = useContext(AppContext);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return <WelcomeScreen />;
  }

  return (
    <>
      <header className="chat-header">
        <button onClick={startNewChat} className="new-chat-button" aria-label="Start new chat">
            {/* FIX: Corrected a typo in the viewBox attribute which was causing a compiler error. */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
        <h1>Hikaru AI</h1>
      </header>
      <main className="chat-box">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={chatEndRef} />
      </main>
    </>
  );
};

export default ChatWindow;