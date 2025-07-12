import React, { useRef, useState, useEffect } from 'react';
import SaveDropdownMenu from './SaveDropdownMenu';

const GraphToolbar = ({ 
  cyRef, 
  zoomLevel, 
  onBackToHome, 
  showNotification 
}) => {
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const saveMenuRef = useRef(null);

  // 处理点击外部关闭保存菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
        setShowSaveMenu(false);
      }
    };

    if (showSaveMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSaveMenu]);

  // 工具栏功能函数
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFitToScreen = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50);
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      const layout = cyRef.current.layout({
        name: 'fcose',
        fit: true,
        padding: 50,
        nodeSeparation: 80,
        nodeRepulsion: 1500,
        idealEdgeLength: 100,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out-cubic',
        randomize: function() {
          // 自定义随机化函数，偏向横向分布
          return {
            x: Math.random() * 1.5 - 0.75, // 横向范围更大
            y: Math.random() * 0.7 - 0.35  // 纵向范围较小
          };
        },
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: 'all',
        samplingType: true,
        sampleSize: 25,
        nodeDimensionsIncludeLabels: true,
        ready: function() {
          // 布局完成后进行横向优化
          if (cyRef.current) {
            const nodes = cyRef.current.nodes();
            const bbox = nodes.boundingBox();
            const centerY = (bbox.y1 + bbox.y2) / 2;
            
            // 将所有节点的Y坐标向中心压缩，增强横向分布
            nodes.forEach(node => {
              const pos = node.position();
              const newY = centerY + (pos.y - centerY) * 0.6; // 压缩Y坐标
              node.position({ x: pos.x, y: newY });
            });
          }
        }
      });
      layout.run();
    }
  };

  const handleCenterGraph = () => {
    if (cyRef.current) {
      cyRef.current.center();
    }
  };

  const handleSaveVisualization = () => {
    setShowSaveMenu(!showSaveMenu);
  };

  return (
    <div className="graph-toolbar" style={toolbarStyle}>
      <button onClick={handleZoomIn} style={toolbarButtonStyle} title="放大">
        🔍+
      </button>
      <button onClick={handleZoomOut} style={toolbarButtonStyle} title="缩小">
        🔍-
      </button>
      <button onClick={handleFitToScreen} style={toolbarButtonStyle} title="适应屏幕">
        📐
      </button>
      <button onClick={handleCenterGraph} style={toolbarButtonStyle} title="居中">
        🎯
      </button>
      <button onClick={handleResetLayout} style={toolbarButtonStyle} title="重新布局">
        🔄
      </button>
      
      {/* 分隔线 */}
      <div style={separatorStyle}></div>
      
      {/* 保存功能 */}
      <div style={saveContainerStyle} ref={saveMenuRef}>
        <button 
          onClick={handleSaveVisualization} 
          style={{...toolbarButtonStyle, ...saveButtonStyle}} 
          title="保存图谱"
        >
          💾
          <span 
            className={`dropdown-arrow ${showSaveMenu ? 'open' : ''}`}
            style={dropdownArrowStyle}
          >
            ▼
          </span>
        </button>
        
        <SaveDropdownMenu 
          show={showSaveMenu}
          cyRef={cyRef}
          onClose={() => setShowSaveMenu(false)}
          showNotification={showNotification}
        />
      </div>
      
      {/* 返回首页功能 */}
      <button 
        onClick={onBackToHome} 
        style={{...toolbarButtonStyle, ...homeButtonStyle}} 
        title="返回首页"
      >
        ⌂
      </button>
      
      <div style={zoomInfoStyle}>
        缩放: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

// 样式定义
const toolbarStyle = {
  position: 'absolute',
  top: '2px',
  right: '2px',
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.95)',
  padding: '8px 12px',
  borderRadius: '25px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
  zIndex: 1000,
  backdropFilter: 'blur(5px)',
};

const toolbarButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer',
  padding: '6px 10px',
  borderRadius: '6px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '32px',
  height: '32px',
};

const separatorStyle = {
  width: '1px',
  height: '20px',
  background: 'rgba(0,0,0,0.1)',
  margin: '0 4px',
};

const saveButtonStyle = {
  color: '#3b82f6',
  position: 'relative',
};

const saveContainerStyle = {
  position: 'relative',
  display: 'inline-block',
};

const dropdownArrowStyle = {
  fontSize: '8px',
  marginLeft: '4px',
  color: '#3b82f6',
  transition: 'transform 0.2s ease',
};

const homeButtonStyle = {
  color: '#f59e0b',
};

const zoomInfoStyle = {
  fontSize: '12px',
  color: '#7f8c8d',
  marginLeft: '8px',
  fontWeight: '500',
};

export default GraphToolbar; 