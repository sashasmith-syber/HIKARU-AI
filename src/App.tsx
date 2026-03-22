import React, { useContext } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import ParticleBackground from "./components/ParticleBackground";
import StatusBar from "./components/StatusBar";
import SystemOptimizationModal from "./components/SystemOptimizationModal";
import ArtifactViewer from "./components/ArtifactViewer";
import { AppContext } from "./context/AppContext";

const App: React.FC = () => {
  const { isOptimizationModalOpen, activeArtifact } = useContext(AppContext);
  return (
    <div className="app-wrapper">
      <ParticleBackground />
      <div className={`main-content ${activeArtifact ? 'has-artifact' : ''}`}>
        <div className="chat-container">
          <ChatWindow />
          <InputBar />
        </div>
        {activeArtifact && (
          <div className="artifact-container">
            <ArtifactViewer artifact={activeArtifact} />
          </div>
        )}
      </div>
      <StatusBar />
      {isOptimizationModalOpen && <SystemOptimizationModal />}
    </div>
  );
};

export default App;
