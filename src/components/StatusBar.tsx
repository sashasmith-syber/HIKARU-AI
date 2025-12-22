import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const StatusBar: React.FC = () => {
    const { 
        ethicalStatus, 
        interactionCount, 
        intentDrift, 
        ethicalThreshold,
        toggleOptimizationModal,
        satisfactionScore 
    } = useContext(AppContext);

    const getEthicalStatusIcon = () => {
        switch (ethicalStatus) {
            case 'approved':
                return <span className="icon success" title="Ethical Review: Approved">✅</span>;
            case 'caution':
                return <span className="icon caution" title="Ethical Review: Caution">⚠️</span>;
            case 'rejected':
                return <span className="icon danger" title="Ethical Review: Rejected">❌</span>;
            default:
                 return <span className="icon" title="Ethical Review: Idle">➖</span>;
        }
    };
    
    const getStatusColor = () => {
        if (satisfactionScore > 85) return 'success';
        if (satisfactionScore > 60) return 'caution';
        return 'danger';
    };

    return (
        <div className="status-bar">
            <div className="status-section">
                <div className="status-item" title="Ethical Review Status">
                    {getEthicalStatusIcon()}
                    <span>Ethical Review</span>
                </div>
                 <div className="status-item clickable" onClick={toggleOptimizationModal} title="Open System Optimization Panel">
                    <span className={`icon ${getStatusColor()}`}>⚙️</span>
                    <span>System Status</span>
                </div>
            </div>
            <div className="status-section">
                <div className="status-item" title={`Session Interaction Count: ${interactionCount}`}>
                    <span>Memory: {interactionCount}</span>
                </div>
                <div className="status-item memory-bar" title={`Intent Drift: ${intentDrift}% | Threshold: ${ethicalThreshold}%`}>
                    <span>Intent Drift</span>
                    <div className="memory-bar-progress">
                        <div 
                            className="memory-bar-fill" 
                            style={{ width: `${intentDrift}%` }}
                        ></div>
                        <div 
                            className="memory-bar-threshold" 
                            style={{ left: `${ethicalThreshold}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
