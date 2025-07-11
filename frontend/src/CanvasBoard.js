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

function CanvasBoard({ graphData, onModeSelect, setResponse, setLoading }) {
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
        randomize: true,  // 启用随机化初始位置
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out-cubic',
        fit: true,
        padding: 50,
        
        // 节点分离和布局参数
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
      },
    });

    // 启用缩放和平移
    cyRef.current.userZoomingEnabled(true);
    cyRef.current.userPanningEnabled(true);

    // 添加事件监听器
    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      
      // 传递完整的节点数据，包括keyword
      setSelectedNode({
        id: node.id(),
        keyword: nodeData.keyword,
        details: nodeData.details,
        isParent: node.hasClass('keyword-node')
      });
      
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
          
          // 为新节点设置初始位置（智能避免重叠）
          const baseRadius = 280; // 增加基础半径
          const minNodeDistance = 180; // 增加节点之间的最小距离
          const maxRadius = 800; // 增加最大半径限制
          
          // 获取所有现有节点的位置，用于碰撞检测
          const existingPositions = [];
          cyRef.current.nodes().forEach(node => {
            if (!updatedNewNodes.some(newNode => node.id() === newNode.id.toString() || node.id() === `${newNode.id}-child`)) {
              const pos = node.position();
              let nodeSize;
              
              // 根据节点类型正确获取大小
              if (node.hasClass('keyword-node')) {
                nodeSize = 80; // keyword-node固定80px
              } else if (node.hasClass('detail-node') || node.hasClass('extended-node')) {
                nodeSize = parseInt(node.data('size')) || 100; // 使用data中的size
              } else if (node.hasClass('text-only-node') || node.hasClass('text-only-extended-node')) {
                nodeSize = Math.max(parseInt(node.data('size')) || 20, 60); // text-only节点虽然size小，但文字占据更大空间
              } else {
                nodeSize = 80; // 默认大小
              }
              
              existingPositions.push({
                x: pos.x,
                y: pos.y,
                size: nodeSize + 40 // 增加更大的缓冲距离
              });
            }
          });
          
          // 为每个新节点找到合适的位置
          const newNodePositions = [];
          const startAngle = Math.random() * Math.PI * 2; // 随机起始角度
          
          updatedNewNodes.forEach((node, index) => {
            let foundValidPosition = false;
            let currentRadius = baseRadius;
            let targetX, targetY;
            
            // 尝试不同半径和角度，直到找到不重叠的位置
            while (!foundValidPosition && currentRadius <= maxRadius) {
              const angleStep = (2 * Math.PI) / updatedNewNodes.length;
              const angle = startAngle + index * angleStep;
              
              // 尝试当前半径的位置
              targetX = clickedNodePosition.x + currentRadius * Math.cos(angle);
              targetY = clickedNodePosition.y + currentRadius * Math.sin(angle);
              
              // 检查与现有节点的碰撞
              let hasCollision = false;
              
              // 检查与原有节点的碰撞
              for (const existingPos of existingPositions) {
                const distance = Math.sqrt(
                  Math.pow(targetX - existingPos.x, 2) + 
                  Math.pow(targetY - existingPos.y, 2)
                );
                // 增加安全距离：考虑现有节点大小的一半 + 新节点估计大小的一半 + 最小距离
                const safeDistance = existingPos.size / 2 + 60 + minNodeDistance; // 新节点估计60px半径
                if (distance < safeDistance) {
                  hasCollision = true;
                  break;
                }
              }
              
              // 检查与其他新节点的碰撞
              if (!hasCollision) {
                for (const newPos of newNodePositions) {
                  const distance = Math.sqrt(
                    Math.pow(targetX - newPos.x, 2) + 
                    Math.pow(targetY - newPos.y, 2)
                  );
                  if (distance < minNodeDistance) {
                    hasCollision = true;
                    break;
                  }
                }
              }
              
              if (!hasCollision) {
                foundValidPosition = true;
                newNodePositions.push({ x: targetX, y: targetY });
              } else {
                // 如果当前角度有碰撞，尝试微调角度
                let angleOffset = Math.PI / (updatedNewNodes.length * 2);
                let triedAngles = 0;
                const maxAngleTries = 12; // 增加尝试次数
                
                while (hasCollision && triedAngles < maxAngleTries) {
                  const adjustedAngle = angle + (triedAngles % 2 === 0 ? angleOffset : -angleOffset) * Math.ceil(triedAngles / 2);
                  targetX = clickedNodePosition.x + currentRadius * Math.cos(adjustedAngle);
                  targetY = clickedNodePosition.y + currentRadius * Math.sin(adjustedAngle);
                  
                  hasCollision = false;
                  
                  // 重新检查碰撞
                  for (const existingPos of existingPositions) {
                    const distance = Math.sqrt(
                      Math.pow(targetX - existingPos.x, 2) + 
                      Math.pow(targetY - existingPos.y, 2)
                    );
                    const safeDistance = existingPos.size / 2 + 60 + minNodeDistance;
                    if (distance < safeDistance) {
                      hasCollision = true;
                      break;
                    }
                  }
                  
                  if (!hasCollision) {
                    for (const newPos of newNodePositions) {
                      const distance = Math.sqrt(
                        Math.pow(targetX - newPos.x, 2) + 
                        Math.pow(targetY - newPos.y, 2)
                      );
                      if (distance < minNodeDistance) {
                        hasCollision = true;
                        break;
                      }
                    }
                  }
                  
                  if (!hasCollision) {
                    foundValidPosition = true;
                    newNodePositions.push({ x: targetX, y: targetY });
                    break;
                  }
                  
                  triedAngles++;
                }
                
                if (!foundValidPosition) {
                  // 如果微调角度还是不行，增加半径
                  currentRadius += 120; // 增加更大的半径步长
                }
              }
            }
            
            // 如果还是找不到位置，使用一个相对安全的位置
            if (!foundValidPosition) {
              const fallbackAngle = startAngle + index * (2 * Math.PI) / updatedNewNodes.length;
              targetX = clickedNodePosition.x + maxRadius * Math.cos(fallbackAngle);
              targetY = clickedNodePosition.y + maxRadius * Math.sin(fallbackAngle);
              newNodePositions.push({ x: targetX, y: targetY });
            }
            
            // 设置关键词节点位置
            const keywordNode = cyRef.current.getElementById(node.id);
            if (keywordNode.length > 0) {
              // 从被点击节点的位置开始，然后动画到目标位置
              keywordNode.position(clickedNodePosition);
              
              // 位置动画
              keywordNode.animate({
                position: { x: targetX, y: targetY }
              }, {
                duration: 800, // 稍微延长动画时间，让用户更容易跟踪
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
            
            // 设置子节点位置（稍微偏移，确保不重叠）
            const childNode = cyRef.current.getElementById(`${node.id}-child`);
            if (childNode.length > 0) {
              childNode.position(clickedNodePosition);
              
              // 子节点偏移位置，确保不与父节点重叠
              const childOffsetX = targetX + 15;
              const childOffsetY = targetY + 15;
              
              // 位置动画
              childNode.animate({
                position: { x: childOffsetX, y: childOffsetY }
              }, {
                duration: 800,
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
        
        // showNotification(`成功拓展节点 "${contextMenu.nodeKeyword}"`, 'success'); // 移除成功提示
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
    return <WelcomePage onModeSelect={onModeSelect} setResponse={setResponse} setLoading={setLoading} />;
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
      'label': '', // 移除文本显示
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-weight': 'bold',
      'font-size': '16px',
      'color': '#2c3e50',
      'background-color': '#ffffff',
      'background-opacity': 0.9,
      'width': '80px',
      'height': '80px',
      'border-width': '2px',
      'border-color': '#e1e5e9',
      'border-opacity': 0.6,
      'shape': 'roundrectangle',
      'padding': '10px',
      'grabbable': true,
      'transition-property': 'transform, border-color, background-color',
      'transition-duration': '0.3s',
      'transition-timing-function': 'ease-out',
    },
  },
  {
    selector: 'node.keyword-node:hover',
    style: {
      'transform': 'scale(1.1)',
      'background-color': '#f8f9fa',
      'border-color': '#bdc3c7',
      'border-opacity': 0.8,
      'z-index': 999,
    },
  },
  {
    selector: 'node.keyword-node:selected',
    style: {
      'transform': 'scale(1.15)',
      'color': '#8e44ad', // 改为紫色文字
      'background-color': '#f4e6f7', // 改为浅紫色背景
      'border-color': '#bb8fce', // 改为紫色边框
      'border-opacity': 0.8,
    },
  },
  {
    selector: 'node.detail-node',
    style: {
      'background-color': '#ecf0f1',
      'background-image': 'data(image)',
      'background-fit': 'cover',
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': function(ele) {
        const size = parseInt(ele.data('size')) || 100;
        // 对于有图片的节点，文本框宽度为节点宽度的80%，最小120px，最大300px
        return Math.min(Math.max(size * 1.1, 120), 300) + 'px';
      },
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '17px', // 从15px增加到17px
      'font-weight': 'bold',
      'color': '#2c3e50',
      'text-margin-y': '18px',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '8px', // 适当的padding值
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
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': function(ele) {
        const size = parseInt(ele.data('size')) || 100;
        // 对于有图片的节点，文本框宽度为节点宽度的80%，最小120px，最大300px
        return Math.min(Math.max(size * 1.1, 120), 300) + 'px';
      },
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '17px', // 从15px增加到17px
      'font-weight': 'bold',
      'color': '#8e44ad',
      'text-margin-y': '18px',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '8px', // 适当的padding值
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
      'background-opacity': 0,
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': function(ele) {
        const size = parseInt(ele.data('size')) || 20;
        // 对于纯文本节点，基础宽度较大，因为它们主要依靠文本显示
        return Math.min(Math.max(size * 6, 200), 250) + 'px';
      },
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '16px', // 从14px增加到16px
      'font-weight': 'bold',
      'color': '#2c3e50',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'rectangle',
      'border-width': '0px',
      'border-opacity': 0,
      'transition-property': 'transform',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.text-only-node:hover',
    style: {
      'transform': 'scale(1.1)',
      'text-background-color': 'transparent',
      'background-color': 'transparent',
      'z-index': 998,
    },
  },
  {
    selector: 'node.text-only-extended-node',
    style: {
      'background-color': 'transparent',
      'background-opacity': 0,
      'width': 'data(size)',
      'height': 'data(size)',
      'text-wrap': 'wrap',
      'text-max-width': function(ele) {
        const size = parseInt(ele.data('size')) || 20;
        // 对于纯文本节点，基础宽度较大，因为它们主要依靠文本显示
        return Math.min(Math.max(size * 6, 150), 250) + 'px';
      },
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '16px', // 从14px增加到16px
      'font-weight': 'bold',
      'color': '#8e44ad',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'rectangle',
      'border-width': '0px',
      'border-opacity': 0,
      'transition-property': 'transform',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'node.text-only-extended-node:hover',
    style: {
      'transform': 'scale(1.1)',
      'text-background-color': 'transparent',
      'background-color': 'transparent',
      'z-index': 998,
    },
  },
  {
    selector: 'edge',
    style: {
      'label': 'data(label)',
      'text-rotation': 'autorotate',
      'font-weight': '600',
      'font-size': '20px', // 从13px增加到16px，关系文字更大
      'text-margin-x': '0px',
      'text-margin-y': '-12px',
      'text-background-color': 'rgba(255,255,255,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '3px',
      'text-border-radius': '3px',
      'text-border-width': '1px',
      'text-border-color': '#e0e0e0',
      'width': 12, // 从8增加到12，边更粗
      'line-color': '#d5dbdb', // 改为更浅的灰色
      'target-arrow-color': '#d5dbdb', // 改为更浅的灰色
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'color': '#34495e',
      'source-endpoint': 'outside-to-node',
      'target-endpoint': 'outside-to-node',
      'arrow-scale': 1.3,
      'transition-property': 'line-color, target-arrow-color, width',
      'transition-duration': '0.2s',
    },
  },
  {
    selector: 'edge:hover',
    style: {
      'width': 15, // 从10增加到15，悬停时更粗
      'line-color': '#bdc3c7', // 悬停时稍深一点的浅灰色
      'target-arrow-color': '#bdc3c7',
      'z-index': 997,
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      'width': 18, // 从12增加到18，高亮时最粗
      'line-color': '#bb8fce', // 改为更浅的紫色
      'target-arrow-color': '#bb8fce', // 改为更浅的紫色
    },
  },
];

export default CanvasBoard; 