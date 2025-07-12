// CanvasBoard.js
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import svg from 'cytoscape-svg';

import GraphToolbar from './components/GraphToolbar';
import WelcomePage from './components/WelcomePage';
import NodeInfoPanel from './components/NodeInfoPanel';
import NodeContextMenu from './components/NodeContextMenu';
import { transformDataToElements, showNotification } from './utils/graphUtils';
import axios from 'axios';

cytoscape.use(fcose);
cytoscape.use(svg);

function CanvasBoard({ graphData, onModeSelect, setResponse, setLoading, mode }) {
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
    const currentGraphData = extendedGraphData || graphData;
    
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
    
    if (isIncrementalUpdate && cyRef.current) {
      setIsIncrementalUpdate(false);
      return;
    }
    
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: transformDataToElements(currentGraphData),
      style: cytoscapeStyles,
      layout: {
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
          return {
            x: Math.random() * 1.5 - 0.75,
            y: Math.random() * 0.7 - 0.35
          };
        },
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: 'all',
        samplingType: true,
        sampleSize: 25,
        ready: function() {
          if (cyRef.current) {
            const nodes = cyRef.current.nodes();
            const bbox = nodes.boundingBox();
            const centerY = (bbox.y1 + bbox.y2) / 2;
            
            nodes.forEach(node => {
              const pos = node.position();
              const newY = centerY + (pos.y - centerY) * 0.6;
              node.position({ x: pos.x, y: newY });
            });
          }
        }
      },
    });

    cyRef.current.userZoomingEnabled(true);
    cyRef.current.userPanningEnabled(true);

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      
      setSelectedNode({
        id: node.id(),
        keyword: nodeData.keyword,
        details: nodeData.details,
        isParent: node.hasClass('keyword-node')
      });
      
      setContextMenu({
        isVisible: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        nodeKeyword: null
      });
      
      cyRef.current.elements().removeClass('highlighted');
      node.addClass('highlighted');
      node.connectedEdges().addClass('highlighted');
      node.neighborhood().addClass('highlighted');
    });

    cyRef.current.on('cxttap', 'node.keyword-node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      const renderedPosition = evt.renderedPosition || evt.position;
      
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

    cyRef.current.on('zoom', function(evt) {
      setZoomLevel(cyRef.current.zoom());
    });

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

  useEffect(() => {
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.isVisible) {
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

  const handleBackToHome = () => {
    if (window.confirm('确定要返回首页吗？当前的图谱数据将会丢失。')) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      
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
      
      onModeSelect(null);
    }
  };

  const handleExtendNode = async () => {
    if (!contextMenu.nodeKeyword || isExtending) return;

    setIsExtending(true);
    
    try {
      const response = await axios.post('http://localhost:5000/node-extend', {
        nodeKeyword: contextMenu.nodeKeyword
      });

      const { data: newData } = response.data;
      
      if (newData && newData.keyinfo && newData.connections) {
        const currentData = extendedGraphData || graphData;
        const existingIds = currentData.keyinfo.map(node => node.id);
        const maxId = Math.max(...existingIds, 0);
        
        const updatedNewNodes = newData.keyinfo.map((node, index) => ({
          ...node,
          id: maxId + index + 1,
          isExtendedInfo: 1
        }));
        
        const updatedNewConnections = newData.connections.map(conn => {
          let fromId, toId;
          
          if (conn.from === 0) {
            fromId = contextMenu.nodeId;
          } else {
            fromId = maxId + conn.from;
          }
          
          if (conn.to === 0) {
            toId = contextMenu.nodeId;
          } else {
            toId = maxId + conn.to;
          }
          
          return {
            ...conn,
            from: fromId,
            to: toId
          };
        });
        
        const mergedData = {
          keyinfo: [...currentData.keyinfo, ...updatedNewNodes],
          connections: [...currentData.connections, ...updatedNewConnections]
        };
        
        if (cyRef.current) {
          setIsIncrementalUpdate(true);
          
          const newElements = transformDataToElements({
            keyinfo: updatedNewNodes,
            connections: updatedNewConnections
          });
          
          cyRef.current.add(newElements);
          
          const clickedNode = cyRef.current.getElementById(contextMenu.nodeId);
          const clickedNodePosition = clickedNode.position();
          
          const existingPositions = [];
          cyRef.current.nodes().forEach(node => {
            if (!updatedNewNodes.some(newNode => 
              node.id() === newNode.id.toString() || 
              node.id() === `${newNode.id}-child`
            )) {
              const pos = node.position();
              existingPositions.push({
                x: pos.x,
                y: pos.y,
                radius: 100
              });
            }
          });
          
          const baseRadius = 200;
          const angleStep = (2 * Math.PI) / updatedNewNodes.length;
          
          updatedNewNodes.forEach((node, index) => {
            const keywordNode = cyRef.current.getElementById(node.id);
            const childNode = cyRef.current.getElementById(`${node.id}-child`);
            
            const angle = index * angleStep;
            let radius = baseRadius;
            let targetX, targetY;
            let positionFound = false;
            
            while (!positionFound && radius < 500) {
              targetX = clickedNodePosition.x + radius * Math.cos(angle);
              targetY = clickedNodePosition.y + radius * Math.sin(angle);
              
              let hasOverlap = false;
              for (const existingPos of existingPositions) {
                const distance = Math.sqrt(
                  Math.pow(targetX - existingPos.x, 2) + 
                  Math.pow(targetY - existingPos.y, 2)
                );
                if (distance < existingPos.radius) {
                  hasOverlap = true;
                  break;
                }
              }
              
              if (!hasOverlap) {
                positionFound = true;
                existingPositions.push({
                  x: targetX,
                  y: targetY,
                  radius: 100
                });
              } else {
                radius += 80;
              }
            }
            
            if (keywordNode.length > 0) {
              keywordNode.style('opacity', 0);
              keywordNode.position({ x: targetX, y: targetY });
              
              setTimeout(() => {
                keywordNode.animate({
                  style: { opacity: 1 }
                }, {
                  duration: 600,
                  easing: 'ease-out-cubic'
                });
              }, index * 150);
            }
            
            if (childNode.length > 0) {
              childNode.style('opacity', 0);
              childNode.position({ 
                x: targetX + 15, 
                y: targetY + 15 
              });
              
              setTimeout(() => {
                childNode.animate({
                  style: { opacity: 1 }
                }, {
                  duration: 600,
                  easing: 'ease-out-cubic'
                });
              }, index * 150 + 100);
            }
          });
          
          setTimeout(() => {
            cyRef.current.nodes().forEach(node => {
              const nodeId = node.id();
              if (updatedNewNodes.some(newNode => 
                nodeId === newNode.id.toString() || 
                nodeId === `${newNode.id}-child`
              )) {
                node.ungrabify();
                node.grabify();
              }
            });
          }, 1000);
        }
        
        setExtendedGraphData(mergedData);
      }
    } catch (error) {
      console.error('节点拓展失败:', error);
      showNotification('节点拓展失败，请稍后重试', 'error');
    } finally {
      setIsExtending(false);
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: { x: 0, y: 0 },
      nodeId: null,
      nodeKeyword: null
    });
  };

  if (!graphData) {
    return <WelcomePage onModeSelect={onModeSelect} setResponse={setResponse} setLoading={setLoading} mode={mode} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GraphToolbar 
        cyRef={cyRef}
        zoomLevel={zoomLevel}
        onBackToHome={handleBackToHome}
        showNotification={showNotification}
      />

      <div
        id="cy"
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />

      <NodeInfoPanel selectedNode={selectedNode} />

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

const cytoscapeStyles = [
  {
    selector: 'node.keyword-node',
    style: {
      'label': '',
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
      'color': '#8e44ad',
      'background-color': '#f4e6f7',
      'border-color': '#bb8fce',
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
        return Math.min(Math.max(size * 1.1, 120), 300) + 'px';
      },
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '17px',
      'font-weight': 'bold',
      'color': '#2c3e50',
      'text-margin-y': '18px',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '8px',
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
        return Math.min(Math.max(size * 1.1, 120), 300) + 'px';
      },
      'text-valign': 'bottom',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '17px',
      'font-weight': 'bold',
      'color': '#8e44ad',
      'text-margin-y': '18px',
      'text-background-color': 'transparent',
      'text-background-opacity': 0,
      'grabbable': true,
      'shape': 'roundrectangle',
      'padding': '8px',
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
        return Math.min(Math.max(size * 6, 200), 250) + 'px';
      },
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '16px',
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
        return Math.min(Math.max(size * 6, 150), 250) + 'px';
      },
      'text-valign': 'center',
      'text-halign': 'center',
      'label': 'data(details)', 
      'font-size': '16px',
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
      'font-size': '20px',
      'text-margin-x': '0px',
      'text-margin-y': '-12px',
      'text-background-color': 'rgba(255,255,255,0.9)',
      'text-background-opacity': 1,
      'text-background-padding': '3px',
      'text-border-radius': '3px',
      'text-border-width': '1px',
      'text-border-color': '#e0e0e0',
      'width': 12,
      'line-color': '#d5dbdb',
      'target-arrow-color': '#d5dbdb',
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
      'width': 15,
      'line-color': '#bdc3c7',
      'target-arrow-color': '#bdc3c7',
      'z-index': 997,
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      'width': 18,
      'line-color': '#bb8fce',
      'target-arrow-color': '#bb8fce',
    },
  },
];

export default CanvasBoard; 