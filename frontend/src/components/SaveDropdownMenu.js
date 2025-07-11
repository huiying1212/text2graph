import React from 'react';

const SaveDropdownMenu = ({ show, cyRef, onClose, showNotification }) => {
  // 保存为PNG图片
  const saveToPNG = () => {
    try {
      const png64 = cyRef.current.png({
        output: 'base64uri',
        bg: 'white',
        full: true,
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `知识图谱_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.href = png64;
      link.click();
      
      showNotification('🎉 PNG图片已保存到下载文件夹！', 'success');
      onClose();
    } catch (error) {
      console.error('PNG保存失败:', error);
      showNotification('❌ PNG保存失败，请稍后重试', 'error');
    }
  };

  // 保存为SVG矢量图
  const saveToSVG = () => {
    try {
      // 检查Cytoscape实例是否存在
      if (!cyRef.current) {
        showNotification('❌ 图谱未加载，无法保存SVG', 'error');
        return;
      }

      // 检查是否有节点数据
      if (cyRef.current.nodes().length === 0) {
        showNotification('❌ 没有图谱数据可保存', 'error');
        return;
      }

      console.log('开始生成SVG...');
      
      const svgStr = cyRef.current.svg({
        full: true,
        bg: 'white',
        scale: 1,
        width: undefined,
        height: undefined
      });
      
      console.log('SVG生成成功，长度:', svgStr.length);
      
      // 验证SVG内容
      if (!svgStr || svgStr.length < 100) {
        throw new Error('生成的SVG内容为空或过短');
      }
      
      const svgBlob = new Blob([svgStr], { 
        type: 'image/svg+xml;charset=utf-8' 
      });
      
      const link = document.createElement('a');
      const fileName = `知识图谱_${new Date().toLocaleDateString().replace(/\//g, '-')}.svg`;
      link.download = fileName;
      link.href = URL.createObjectURL(svgBlob);
      
      // 添加到DOM并点击
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理对象URL
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
      
      showNotification('🎉 SVG矢量图已保存到下载文件夹！', 'success');
      onClose();
    } catch (error) {
      console.error('SVG保存失败:', error);
      console.error('错误堆栈:', error.stack);
      
      let errorMessage = 'SVG保存失败，请稍后重试';
      if (error.message.includes('svg is not a function')) {
        errorMessage = 'SVG插件未正确加载，请刷新页面重试';
      } else if (error.message.includes('空或过短')) {
        errorMessage = '生成的SVG文件为空，请检查图谱数据';
      }
      
      showNotification(`❌ ${errorMessage}`, 'error');
    }
  };

  // 保存为JSON数据
  const saveToJSON = () => {
    try {
      const graphJSON = {
        nodes: cyRef.current.nodes().map(node => ({
          id: node.id(),
          data: node.data(),
          position: node.position(),
          classes: node.classes()
        })),
        edges: cyRef.current.edges().map(edge => ({
          id: edge.id(),
          data: edge.data(),
          classes: edge.classes()
        })),
        exportTime: new Date().toISOString(),
      };
      
      const dataStr = JSON.stringify(graphJSON, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.download = `知识图谱数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      link.href = URL.createObjectURL(dataBlob);
      link.click();
      
      showNotification('💾 图谱数据已导出为JSON文件！', 'success');
      onClose();
    } catch (error) {
      console.error('JSON保存失败:', error);
      showNotification('❌ 数据导出失败，请稍后重试', 'error');
    }
  };

  if (!show) return null;

  return (
    <div className="save-dropdown-menu" style={saveMenuStyle}>
      <div 
        className="save-menu-item" 
        style={saveMenuItemStyle}
        onClick={saveToPNG}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59,130,246,0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <span style={saveIconStyle}>🖼️</span>
        <div style={saveTextContainerStyle}>
          <div style={saveMenuTitleStyle}>PNG 图片</div>
          <div style={saveMenuDescStyle}>高清位图，适合分享</div>
        </div>
      </div>
      
      <div 
        className="save-menu-item" 
        style={saveMenuItemStyle}
        onClick={saveToSVG}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59,130,246,0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <span style={saveIconStyle}>📐</span>
        <div style={saveTextContainerStyle}>
          <div style={saveMenuTitleStyle}>SVG 矢量图</div>
          <div style={saveMenuDescStyle}>可缩放矢量，适合印刷</div>
        </div>
      </div>
      
      <div style={separatorStyle}></div>
      
      <div 
        className="save-menu-item" 
        style={saveMenuItemStyle}
        onClick={saveToJSON}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59,130,246,0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <span style={saveIconStyle}>📄</span>
        <div style={saveTextContainerStyle}>
          <div style={saveMenuTitleStyle}>JSON 数据</div>
          <div style={saveMenuDescStyle}>完整数据，可重新导入</div>
        </div>
      </div>
    </div>
  );
};

// 样式定义
const saveMenuStyle = {
  position: 'absolute',
  top: '100%',
  right: '0',
  minWidth: '200px',
  background: 'rgba(255,255,255,0.98)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.3)',
  zIndex: 10001,
  marginTop: '8px',
  padding: '8px',
  animation: 'slideInDown 0.2s ease-out',
};

const saveMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  margin: '2px 0',
};

const saveIconStyle = {
  fontSize: '20px',
  marginRight: '12px',
  flexShrink: 0,
};

const saveTextContainerStyle = {
  flex: 1,
};

const saveMenuTitleStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2c3e50',
  marginBottom: '2px',
};

const saveMenuDescStyle = {
  fontSize: '12px',
  color: '#7f8c8d',
  lineHeight: '1.3',
};

const separatorStyle = {
  width: '100%',
  height: '1px',
  background: 'rgba(0,0,0,0.1)',
  margin: '4px 0',
};

export default SaveDropdownMenu; 