// src/components/SalarySlipModal.js
import React from 'react';
import './SalarySlipModal.css'; // You can style the modal as you like

const SalarySlipModal = ({ html, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>❌</button>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default SalarySlipModal;
