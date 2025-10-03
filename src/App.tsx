import React from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import ParticleBackground from "./components/ParticleBackground";
import StatusBar from "./components/StatusBar";

const App: React.FC = () => {
  return (
    <div className="app-wrapper">
      <ParticleBackground />
      <div className="chat-container">
        <ChatWindow />
        <InputBar />
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
