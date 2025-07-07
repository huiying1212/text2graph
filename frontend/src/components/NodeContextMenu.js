import React from 'react';

function NodeContextMenu({ position, isVisible, onExtendNode, onClose }) {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        minWidth: '120px',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #f0f0f0',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
        onClick={() => {
          onExtendNode();
          onClose();
        }}
      >
        <span style={{ fontSize: '16px' }}>🌿</span>
        <span>拓展节点</span>
      </div>
      
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#666',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
        onClick={onClose}
      >
        <span style={{ fontSize: '16px' }}>❌</span>
        <span>取消</span>
      </div>
    </div>
  );
}

export default NodeContextMenu; 