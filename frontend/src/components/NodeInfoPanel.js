import React from 'react';

const NodeInfoPanel = ({ selectedNode }) => {
  if (!selectedNode) return null;

  return (
    <div className="node-info-panel" style={infoPanelStyle}>
      <h4 style={{margin: '0 0 8px 0', color: '#2c3e50'}}>节点信息</h4>
      <p style={{margin: '4px 0', fontSize: '14px', color: '#7f8c8d'}}>
        选中节点: {selectedNode}
      </p>
    </div>
  );
};

// 样式定义
const infoPanelStyle = {
  position: 'absolute',
  bottom: '15px',
  left: '15px',
  background: 'rgba(255,255,255,0.95)',
  padding: '12px 16px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  zIndex: 1000,
  backdropFilter: 'blur(5px)',
  minWidth: '200px',
};

export default NodeInfoPanel; 