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
        quality: 'default',
        randomize: true,  // 启用随机化初始位置
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out-cubic',
        fit: true,
        padding: 50,
        
        // 节点分离和布局参数 (与CanvasBoard.js保持一致)
        nodeSeparation: 200,          // 减少节点分离距离，避免过度分散
        nodeRepulsion: 3000,          // 减少节点排斥力，避免过度排斥导致直线排列
        edgeElasticity: 0.6,          // 增加边的弹性
        
        // 布局质量和稳定性参数
        gravity: 0.4,                 // 增加重力，让节点更容易聚集
        gravityRangeCompound: 1.5,    // 复合节点重力范围
        gravityCompound: 1.0,         // 复合节点重力
        gravityRange: 3.8,            // 重力作用范围
        
        // 算法控制参数
        numIter: 3000,                // 增加迭代次数以获得更好的布局
        initialTemp: 1000,            // 增加初始温度，让节点有更多初始运动
        coolingFactor: 0.99,          // 更慢的冷却，让算法有更多时间优化
        minTemp: 1.0,                 // 最小温度
        
        // 其他配置
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: 'all',
        nestingFactor: 0.1,           // 嵌套因子
        
        // 边长和重叠控制
        idealEdgeLength: function(edge) {
          // 根据边的类型动态调整边长，增加随机性避免直线排列
          return 150 + Math.random() * 60; // 150-210之间的随机值
        },
        nodeOverlap: 20,              // 节点重叠检测
        
        // 多级别优化
        tile: true,                   // 启用平铺以避免重叠
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10
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