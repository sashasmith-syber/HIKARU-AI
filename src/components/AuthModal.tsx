import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onSubmit: (token: string) => void;
  onClose: () => void;
  error?: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSubmit, onClose, error }) => {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onSubmit(token.trim());
    }
  };

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="preview-auth-title">
        <h2 id="preview-auth-title">Preview Access Required</h2>
        <p>This is a private preview. Enter your access token to continue.</p>
        {error && <div className="auth-modal-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter preview access token"
            aria-label="Preview access token"
            autoFocus
          />
          <div className="auth-modal-actions">
            <button type="submit" disabled={!token.trim()}>Authenticate</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
        <p className="auth-modal-note">
          Token is stored locally in your browser and sent with each request.
          It is never embedded in the application code.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
