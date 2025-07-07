// CanvasBoard.js
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose'; // fCoSE图布局算法
import svg from 'cytoscape-svg'; // SVG导出插件

import GraphToolbar from './components/GraphToolbar';
import WelcomePage from './components/WelcomePage';
import NodeInfoPanel from './components/NodeInfoPanel';
import NodeContextMenu from './components/NodeContextMenu';
import { transformDataToElements, showNotification } from './utils/graphUtils';
import axios from 'axios';

cytoscape.use(fcose);
cytoscape.use(svg); // 注册SVG插件

function CanvasBoard({ graphData, onModeSelect }) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contextMenu, setContextMenu] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    nodeKeyword: null
  });
  const [extendedGraphData, setExtendedGraphData] = useState(null);
  const [isExtending, setIsExtending] = useState(false);
  const [isIncrementalUpdate, setIsIncrementalUpdate] = useState(false);

  useEffect(() => {
    // 使用extendedGraphData优先，如果没有则使用graphData
    const currentGraphData = extendedGraphData || graphData;
    
    // 如果没有图数据，清理现有的Cytoscape实例
    if (!currentGraphData) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      setSelectedNode(null);
      setZoomLevel(1);
      setContextMenu({
        isVisible: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        nodeKeyword: null
      });
      return;
    }
    
    // 如果是增量更新，不重新创建整个图
    if (isIncrementalUpdate && cyRef.current) {
      setIsIncrementalUpdate(false);
      return;
    }
    
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // 初始化Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: transformDataToElements(currentGraphData),
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
      
      // 关闭右键菜单
      setContextMenu({
        isVisible: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        nodeKeyword: null
      });
      
      // 高亮连接的边和节点
      cyRef.current.elements().removeClass('highlighted');
      node.addClass('highlighted');
      node.connectedEdges().addClass('highlighted');
      node.neighborhood().addClass('highlighted');
    });

    // 添加右键点击事件监听器
    cyRef.current.on('cxttap', 'node.keyword-node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      const renderedPosition = evt.renderedPosition || evt.position;
      
      // 显示右键菜单
      setContextMenu({
        isVisible: true,
        position: { x: renderedPosition.x, y: renderedPosition.y },
        nodeId: nodeData.id,
        nodeKeyword: nodeData.keyword
      });
      
      evt.stopPropagation();
    });

    cyRef.current.on('tap', function(evt) {
      if (evt.target === cyRef.current) {
        // 点击空白区域，取消选择并关闭右键菜单
        setSelectedNode(null);
        cyRef.current.elements().removeClass('highlighted');
        setContextMenu({
          isVisible: false,
          position: { x: 0, y: 0 },
          nodeId: null,
          nodeKeyword: null
        });
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

  }, [graphData, extendedGraphData]);

  // 添加组件卸载时的清理
  useEffect(() => {
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // 处理点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.isVisible) {
        // 检查点击是否在菜单外部
        const menuElement = event.target.closest('[data-context-menu]');
        if (!menuElement) {
          handleCloseContextMenu();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.isVisible]);

  // 处理返回首页功能
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
      setExtendedGraphData(null);
      setIsIncrementalUpdate(false);
      setContextMenu({
        isVisible: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        nodeKeyword: null
      });
      
      // 重置到首页状态
      onModeSelect(null);
    }
  };

  // 处理节点拓展
  const handleExtendNode = async () => {
    if (!contextMenu.nodeKeyword || isExtending) return;

    setIsExtending(true);
    
    try {
      // 调用后端API进行节点拓展
      const response = await axios.post('http://localhost:5000/node-extend', {
        nodeKeyword: contextMenu.nodeKeyword
      });

      const { data: newData } = response.data;
      
      if (newData && newData.keyinfo && newData.connections) {
        // 获取当前图谱数据
        const currentData = extendedGraphData || graphData;
        
        // 找到最大的现有ID
        const existingIds = currentData.keyinfo.map(node => node.id);
        const maxId = Math.max(...existingIds, 0);
        
        // 为新节点分配新的ID，并更新连接关系
        const updatedNewNodes = newData.keyinfo.map((node, index) => ({
          ...node,
          id: maxId + index + 1,
          isExtendedInfo: 1 // 标记为扩展节点
        }));
        
        const updatedNewConnections = newData.connections.map(conn => {
          let fromId, toId;
          
          // 如果from是0，连接到被点击的节点
          if (conn.from === 0) {
            fromId = contextMenu.nodeId;
          } else {
            // 否则更新为新的ID
            fromId = maxId + conn.from;
          }
          
          // 如果to是0，连接到被点击的节点
          if (conn.to === 0) {
            toId = contextMenu.nodeId;
          } else {
            // 否则更新为新的ID
            toId = maxId + conn.to;
          }
          
          return {
            ...conn,
            from: fromId,
            to: toId
          };
        });
        
        // 合并数据
        const mergedData = {
          keyinfo: [...currentData.keyinfo, ...updatedNewNodes],
          connections: [...currentData.connections, ...updatedNewConnections]
        };
        
        // 如果Cytoscape实例存在，增量添加新元素
        if (cyRef.current) {
          // 设置增量更新标志，防止useEffect重新创建整个图
          setIsIncrementalUpdate(true);
          
          // 转换新节点数据为Cytoscape元素
          const newElements = transformDataToElements({
            keyinfo: updatedNewNodes,
            connections: updatedNewConnections
          });
          
          // 获取被点击节点的位置
          const clickedNode = cyRef.current.getElementById(contextMenu.nodeId);
          const clickedNodePosition = clickedNode.position();
          
          // 添加新元素到图中
          cyRef.current.add(newElements);
          
          // 为新节点设置初始样式（透明度为0）
          updatedNewNodes.forEach((node) => {
            const keywordNode = cyRef.current.getElementById(node.id);
            const childNode = cyRef.current.getElementById(`${node.id}-child`);
            
            if (keywordNode.length > 0) {
              keywordNode.style('opacity', 0);
            }
            if (childNode.length > 0) {
              childNode.style('opacity', 0);
            }
          });
          
          // 为新节点设置初始位置（围绕被点击的节点）
          const radius = 180; // 新节点围绕原节点的半径
          const angleStep = (2 * Math.PI) / updatedNewNodes.length;
          const startAngle = Math.random() * Math.PI * 2; // 随机起始角度，避免重叠
          
          updatedNewNodes.forEach((node, index) => {
            const angle = startAngle + index * angleStep;
            const targetX = clickedNodePosition.x + radius * Math.cos(angle);
            const targetY = clickedNodePosition.y + radius * Math.sin(angle);
            
            // 设置关键词节点位置
            const keywordNode = cyRef.current.getElementById(node.id);
            if (keywordNode.length > 0) {
              // 从被点击节点的位置开始，然后动画到目标位置
              keywordNode.position(clickedNodePosition);
              
              // 位置动画
              keywordNode.animate({
                position: { x: targetX, y: targetY }
              }, {
                duration: 500,
                easing: 'ease-out-cubic'
              });
              
              // 透明度动画（稍微延迟开始）
              setTimeout(() => {
                keywordNode.animate({
                  style: { opacity: 1 }
                }, {
                  duration: 300,
                  easing: 'ease-in'
                });
              }, 100);
            }
            
            // 设置子节点位置（稍微偏移）
            const childNode = cyRef.current.getElementById(`${node.id}-child`);
            if (childNode.length > 0) {
              childNode.position(clickedNodePosition);
              
              // 位置动画
              childNode.animate({
                position: { x: targetX + 10, y: targetY + 10 }
              }, {
                duration: 500,
                easing: 'ease-out-cubic'
              });
              
              // 透明度动画
              setTimeout(() => {
                childNode.animate({
                  style: { opacity: 1 }
                }, {
                  duration: 300,
                  easing: 'ease-in'
                });
              }, 150);
            }
          });
          
          // 确保新节点可以被正常交互
          cyRef.current.nodes().forEach(node => {
            const nodeId = node.id();
            // 只对新添加的节点重新绑定事件
            if (updatedNewNodes.some(newNode => nodeId === newNode.id.toString() || nodeId === `${newNode.id}-child`)) {
              node.ungrabify();
              node.grabify();
            }
          });
        }
        
        // 更新扩展图谱数据
        setExtendedGraphData(mergedData);
        
        showNotification(`成功拓展节点 "${contextMenu.nodeKeyword}"`, 'success');
      }
    } catch (error) {
      console.error('节点拓展失败:', error);
      showNotification('节点拓展失败，请稍后重试', 'error');
    } finally {
      setIsExtending(false);
    }
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: { x: 0, y: 0 },
      nodeId: null,
      nodeKeyword: null
    });
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

      {/* 右键菜单 */}
      {contextMenu.isVisible && (
        <div
          data-context-menu
          style={{
            position: 'absolute',
            left: contextMenu.position.x,
            top: contextMenu.position.y,
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '120px',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div
            onClick={() => {
              handleExtendNode();
              handleCloseContextMenu();
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#2c3e50',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s ease',
              borderBottom: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            🚀 拓展此节点
          </div>
        </div>
      )}

      {/* 节点拓展加载状态 */}
      {isExtending && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px'
        }}>
          <div className="loading-spinner" style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ffffff33',
            borderTop: '2px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          正在拓展节点...
        </div>
      )}
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