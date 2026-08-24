import React from 'react';
import { X } from 'lucide-react';
import '../styles/components/Modal.css';

const Modal = ({ isOpen, onClose, title, children, closeDisabled = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} disabled={closeDisabled}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
