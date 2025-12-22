import React, { useContext } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import ParticleBackground from "./components/ParticleBackground";
import StatusBar from "./components/StatusBar";
import SystemOptimizationModal from "./components/SystemOptimizationModal";
import { AppContext } from "./context/AppContext";

const App: React.FC = () => {
  const { isOptimizationModalOpen } = useContext(AppContext);
  return (
    <div className="app-wrapper">
      <ParticleBackground />
      <div className="chat-container">
        <ChatWindow />
        <InputBar />
      </div>
      <StatusBar />
      {isOptimizationModalOpen && <SystemOptimizationModal />}
    </div>
  );
};

export default App;
