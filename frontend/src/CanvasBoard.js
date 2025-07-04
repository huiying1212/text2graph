// CanvasBoard.js
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose'; // fCoSE图布局算法
import svg from 'cytoscape-svg'; // SVG导出插件

import GraphToolbar from './components/GraphToolbar';
import WelcomePage from './components/WelcomePage';
import NodeInfoPanel from './components/NodeInfoPanel';
import { transformDataToElements, showNotification } from './utils/graphUtils';

cytoscape.use(fcose);
cytoscape.use(svg); // 注册SVG插件

function CanvasBoard({ graphData, onModeSelect }) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // 如果没有图数据，清理现有的Cytoscape实例
    if (!graphData) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      setSelectedNode(null);
      setZoomLevel(1);
      return;
    }
    
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // 初始化Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: transformDataToElements(graphData),
      style: cytoscapeStyles,
      layout: {
        name: 'fcose',
        quality: 'default',
        randomize: false,
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out-cubic',
        fit: true,
        padding: 50,
        nodeSeparation: 350,
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: 'all',
        idealEdgeLength: 200,
        nodeRepulsion: 2000,
      },
    });

    // 启用缩放和平移
    cyRef.current.userZoomingEnabled(true);
    cyRef.current.userPanningEnabled(true);

    // 添加事件监听器
    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      setSelectedNode(node.id());
      
      // 高亮连接的边和节点
      cyRef.current.elements().removeClass('highlighted');
      node.addClass('highlighted');
      node.connectedEdges().addClass('highlighted');
      node.neighborhood().addClass('highlighted');
    });

    cyRef.current.on('tap', function(evt) {
      if (evt.target === cyRef.current) {
        // 点击空白区域，取消选择
        setSelectedNode(null);
        cyRef.current.elements().removeClass('highlighted');
      }
    });

    // 监听缩放事件
    cyRef.current.on('zoom', function(evt) {
      setZoomLevel(cyRef.current.zoom());
    });

    // 添加双击节点居中功能
    cyRef.current.on('dblclick', 'node', function(evt) {
      const node = evt.target;
      cyRef.current.animate({
        center: { eles: node },
        zoom: 1.5
      }, {
        duration: 500,
        easing: 'ease-out-cubic'
      });
    });

  }, [graphData]);

  // 添加组件卸载时的清理
  useEffect(() => {
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // 返回首页功能
  const handleBackToHome = () => {
    // 确认对话框
    if (window.confirm('确定要返回首页吗？当前的图谱数据将会丢失。')) {
      // 清理Cytoscape实例
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      
      // 重置所有状态
      setSelectedNode(null);
      setZoomLevel(1);
      
      // 重置到首页状态
      onModeSelect(null);
    }
  };

  // 如果没有图数据，显示欢迎页面
  if (!graphData) {
    return <WelcomePage onModeSelect={onModeSelect} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 工具栏 */}
      <GraphToolbar 
        cyRef={cyRef}
        zoomLevel={zoomLevel}
        onBackToHome={handleBackToHome}
        showNotification={showNotification}
      />

      {/* 图谱容器 */}
      <div
        id="cy"
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />

      {/* 选中节点信息面板 */}
      <NodeInfoPanel selectedNode={selectedNode} />
    </div>
  );
}

// Cytoscape样式配置
const cytoscapeStyles = [
  {
    selector: 'node.keyword-node',
    style: {
      'label': 'data(keyword)',
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-weight': 'bold',
      'font-size': '16px',
      'color': '#2c3e50',
      'background-color': '#3498db',
      'background-gradient-direction': 'to-bottom',
      'background-gradient-stop-colors': '#3498db #2980b9',
      'width': '80px',
      'height': '80px',
      'border-width': '3px',
      'border-color': '#2980b9',
      'border-opacity': 0.8,
      'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
      'shape': 'roundrectangle',
      'padding': '10px',
      'grabbable': true,
      'transition-property': 'background-color, transform, box-shadow',
      'transition-duration': '0.3s',
      'transition-timing-function': 'ease-out',
    },
  },
  {
    selector: 'node.keyword-node:hover',
    style: {
      'background-gradient-stop-colors': '#5dade2 #3498db',
      'transform': 'scale(1.1)',
      'box-shadow': '0 6px 12px rgba(0,0,0,0.4)',
      'border-color': '#1f618d',
      'z-index': 999,
    },
  },
  {
    selector: 'node.keyword-node:selected',
    style: {
      'background-gradient-stop-colors': '#f39c12 #e67e22',
      'border-color': '#d35400',
      'transform': 'scale(1.15)',
      'box-shadow': '0 8px 16px rgba(243,156,18,0.5)',
    },
  },
  {
    selector: 'node.detail-node',
    style: {
      'background-color': '#ecf0f1',
      'background-image': 'data(image)',
      'background-fit': 'cover',
      'background-clip': 'none',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '14px',
      'font-weight': '500',
      'color': '#2c3e50',
      'text-margin-y': '15px',
      'text-background-color': 'rgba(255,255,255,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
      'text-border-radius': '4px',
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '15px',
      'border-width': '2px',
      'border-color': '#bdc3c7',
      'box-shadow': '0 3px 6px rgba(0,0,0,0.2)',
      'transition-property': 'transform, box-shadow, border-color',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.detail-node:hover',
    style: {
      'transform': 'scale(1.05)',
      'box-shadow': '0 5px 10px rgba(0,0,0,0.3)',
      'border-color': '#95a5a6',
      'z-index': 998,
    },
  },
  {
    selector: 'node.extended-node',
    style: {
      'background-color': '#f8c6db',
      'background-image': 'data(image)',
      'background-fit': 'cover',
      'background-clip': 'none',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '14px',
      'font-weight': '500',
      'color': '#8e44ad',
      'text-margin-y': '15px',
      'text-background-color': 'rgba(248,198,219,0.95)',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
      'text-border-radius': '4px',
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '15px',
      'border-width': '3px',
      'border-color': '#bf88a5',
      'box-shadow': '0 4px 8px rgba(191,136,165,0.4)',
      'transition-property': 'transform, box-shadow, border-color',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.extended-node:hover',
    style: {
      'transform': 'scale(1.05)',
      'box-shadow': '0 6px 12px rgba(191,136,165,0.5)',
      'border-color': '#9b59b6',
      'background-color': '#f4d1e8',
      'z-index': 998,
    },
  },
  {
    selector: 'node.text-only-node',
    style: {
      'background-color': 'transparent',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': '200px',
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '12px',
      'font-weight': '500',
      'color': '#2c3e50',
      'text-background-color': 'rgba(236,240,241,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '6px',
      'text-border-radius': '6px',
      'text-border-width': '1px',
      'text-border-color': '#bdc3c7',
      'grabbable': true,
      'shape': 'ellipse',
      'border-width': '0px',
      'transition-property': 'transform',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.text-only-node:hover',
    style: {
      'transform': 'scale(1.1)',
      'text-background-color': 'rgba(189,195,199,0.95)',
      'z-index': 998,
    },
  },
  {
    selector: 'node.text-only-extended-node',
    style: {
      'background-color': 'transparent',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': '200px',
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '12px',
      'font-weight': '500',
      'color': '#8e44ad',
      'text-background-color': 'rgba(248,198,219,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '6px',
      'text-border-radius': '6px',
      'text-border-width': '1px',
      'text-border-color': '#bf88a5',
      'grabbable': true,
      'shape': 'ellipse',
      'border-width': '0px',
      'transition-property': 'transform',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.text-only-extended-node:hover',
    style: {
      'transform': 'scale(1.1)',
      'text-background-color': 'rgba(191,136,165,0.95)',
      'z-index': 998,
    },
  },
  {
    selector: 'edge',
    style: {
      'label': 'data(label)',
      'text-rotation': 'autorotate',
      'font-weight': '600',
      'font-size': '13px',
      'text-margin-x': '0px',
      'text-margin-y': '-12px',
      'text-background-color': 'rgba(255,255,255,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '3px',
      'text-border-radius': '3px',
      'text-border-width': '1px',
      'text-border-color': '#e0e0e0',
      'width': 3,
      'line-color': '#7f8c8d',
      'target-arrow-color': '#7f8c8d',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'color': '#34495e',
      'source-endpoint': 'outside-to-node',
      'target-endpoint': 'outside-to-node',
      'arrow-scale': 1.3,
      'line-gradient-stop-colors': '#7f8c8d #95a5a6',
      'transition-property': 'line-color, target-arrow-color, width',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'edge:hover',
    style: {
      'width': 4,
      'line-color': '#3498db',
      'target-arrow-color': '#3498db',
      'line-gradient-stop-colors': '#3498db #5dade2',
      'z-index': 997,
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      'width': 5,
      'line-color': '#e74c3c',
      'target-arrow-color': '#e74c3c',
      'line-gradient-stop-colors': '#e74c3c #c0392b',
    },
  },
];

export default CanvasBoard; 