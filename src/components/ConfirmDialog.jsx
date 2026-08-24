import React from 'react';
import { AlertTriangle } from 'lucide-react';
import '../styles/components/Modal.css';
import '../styles/components/ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Confirmer', danger = false, isLoading = false, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-dialog glass">
        <div className="modal-body confirm-body">
          <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
            <AlertTriangle size={22} />
          </div>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>Annuler</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
