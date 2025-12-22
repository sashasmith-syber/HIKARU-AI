import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

const SystemOptimizationModal: React.FC = () => {
    const { toggleOptimizationModal, satisfactionScore, interactionCount } = useContext(AppContext);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationLog, setOptimizationLog] = useState<string[]>([
        "[T-8m] - Flushed transient memory cache. (+1.2% response speed)",
        "[T-2m] - Recalibrated linguistic analysis module. (+0.5% acuity)",
    ]);
    const [modules, setModules] = useState({
        linguistics: 2.1,
        security: 1.8,
        foresight: 1.5,
        ethics: 2.4
    });
    const [optimizationMessage, setOptimizationMessage] = useState("Engage Optimization Protocol");

    const handleOptimize = () => {
        setIsOptimizing(true);
        const messages = [
            "Analyzing performance metrics...",
            "Identifying optimization vectors...",
            "Recalibrating fractal modules...",
            "Deploying enhancements...",
            "Optimization Complete.",
        ];
        
        let messageIndex = 0;
        const interval = setInterval(() => {
            setOptimizationMessage(messages[messageIndex]);
            messageIndex++;
            if (messageIndex === messages.length) {
                clearInterval(interval);
                
                // Simulate updates
                const newModules = { ...modules };
                const moduleKeys = Object.keys(newModules) as (keyof typeof newModules)[];
                const randomModuleKey = moduleKeys[Math.floor(Math.random() * moduleKeys.length)];
                
                newModules[randomModuleKey] = parseFloat((newModules[randomModuleKey] + 0.1).toFixed(1));
                setModules(newModules);
                
                // FIX: Explicitly convert `randomModuleKey` to a string to avoid potential runtime errors.
                const newLogEntry = `[T-0m] - Deployed fractal enhancement to ${String(randomModuleKey)} module. (+${(Math.random() * 0.5 + 0.1).toFixed(1)}% efficiency)`;
                setOptimizationLog(prev => [newLogEntry, ...prev]);

                setIsOptimizing(false);
                 setOptimizationMessage("Engage Optimization Protocol");
            }
        }, 1000);
    };

    const getScoreColor = (score: number) => {
        if (score > 85) return 'success';
        if (score > 60) return 'caution';
        return 'danger';
    };

    return (
        <div className="modal-overlay" onClick={toggleOptimizationModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>System Optimization & Fractal Enhancement</h2>
                    <button onClick={toggleOptimizationModal} className="close-button" aria-label="Close modal">&times;</button>
                </div>
                <div className="optimization-modal-body">
                    <div className="optimization-section">
                        <h3>Core Performance Metrics</h3>
                        <div className="metrics-list">
                            <div className="metric-item">
                                <span>OPERATOR Satisfaction</span>
                                <span className={`metric-value ${getScoreColor(satisfactionScore)}`}>{satisfactionScore}%</span>
                            </div>
                            <div className="metric-item">
                                <span>Interaction Density</span>
                                <span className="metric-value">{interactionCount}</span>
                            </div>
                            <div className="metric-item">
                                <span>Avg. Response Latency</span>
                                <span className="metric-value">{(Math.random() * (1.2 - 0.8) + 0.8).toFixed(2)}s</span>
                            </div>
                             <div className="metric-item">
                                <span>Ethical Adherence</span>
                                <span className="metric-value success">99.8%</span>
                            </div>
                        </div>
                        <h3>Optimization Log</h3>
                        <div className="optimization-log">
                            {optimizationLog.map((entry, index) => (
                                <div key={index} className="log-entry">{entry}</div>
                            ))}
                        </div>
                    </div>
                     <div className="optimization-section">
                        <h3>Fractal Enhancement Modules</h3>
                         <div className="modules-list">
                            <div className="module-item">
                                <span>[CORE] Hikaru Prime</span>
                                <span>v3.2</span>
                            </div>
                            <div className="module-item">
                                <span>- Linguistics</span>
                                <span>v{modules.linguistics.toFixed(1)}</span>
                            </div>
                            <div className="module-item">
                                <span>- Security Analysis</span>
                                <span>v{modules.security.toFixed(1)}</span>
                            </div>
                            <div className="module-item">
                                <span>- Strategic Foresight</span>
                                <span>v{modules.foresight.toFixed(1)}</span>
                            </div>
                            <div className="module-item">
                                <span>- Ethical Grounding</span>
                                <span>v{modules.ethics.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="optimize-button" onClick={handleOptimize} disabled={isOptimizing}>
                        {optimizationMessage}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemOptimizationModal;
